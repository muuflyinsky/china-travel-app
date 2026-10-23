import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import * as z from "zod/v4";
import { aiProvider, config } from "./config";
import { Unavailable, Unreadable } from "./errors";
import { ALLERGENS } from "./allergens";
import { langName } from "./languages";

const client = () => new Anthropic({ apiKey: config.anthropicKey });

type Ask = { system: string; text: string; image?: { data: string; mediaType: string }; maxTokens: number; repair?: (raw: unknown) => unknown };

/**
 * One structured call to whichever model is configured. The answer is always validated
 * against the zod schema; anything that doesn't match throws Unreadable, so the UI says
 * "couldn't read it, try again" instead of showing half a result.
 */
async function structured<T extends z.ZodType>(schema: T, ask: Ask): Promise<z.infer<T>> {
  if (aiProvider === "openai") return openaiCompatible(schema, ask);
  if (aiProvider === "anthropic") {
    const content: Anthropic.Beta.BetaContentBlockParam[] = [];
    if (ask.image) content.push({ type: "image", source: { type: "base64", media_type: ask.image.mediaType as "image/jpeg", data: ask.image.data } });
    content.push({ type: "text", text: ask.text });
    const res = await client().beta.messages.parse({
      model: config.model, max_tokens: ask.maxTokens, system: ask.system,
      output_config: { effort: "low", format: betaZodOutputFormat(schema) },
      messages: [{ role: "user", content }],
      ...FALLBACK,
    });
    if (res.stop_reason === "refusal" || !res.parsed_output) throw new Unreadable("no structured output");
    return res.parsed_output as z.infer<T>;
  }
  throw new Unavailable("ai");
}

/**
 * OpenAI-compatible chat completions (Qwen on Alibaba Cloud Model Studio by default). The
 * JSON Schema goes in the system prompt; JSON mode is requested for text models only, since
 * not every vision model supports it. `repair` normalises near-misses (an allergen written as
 * "peanuts", a missing note) before validation. One retry, told what was wrong.
 */
async function openaiCompatible<T extends z.ZodType>(schema: T, ask: Ask): Promise<z.infer<T>> {
  const vision = Boolean(ask.image);
  const system = `${ask.system}\n\nReply with one JSON object only, no prose, matching this JSON Schema:\n${JSON.stringify(z.toJSONSchema(schema))}`;
  const user = vision
    ? [{ type: "image_url", image_url: { url: `data:${ask.image!.mediaType};base64,${ask.image!.data}` } }, { type: "text", text: ask.text }]
    : ask.text;
  let last = "", retry = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const data = await chat(vision ? "vision" : "text", {
      messages: [{ role: "system", content: system + retry }, { role: "user", content: user }],
      max_tokens: Math.min(ask.maxTokens, 8192),
      temperature: 0.2,
      ...(vision ? {} : { response_format: { type: "json_object" } }),
    });
    const choice = data.choices?.[0];
    last = String(choice?.message?.content ?? "");
    if (choice?.finish_reason === "length") {
      last = "reply cut off at max_tokens";
      retry = "\n\nYour previous reply was too long and was cut off. Answer again more briefly: one short sentence per text field and at most 20 dishes.";
    } else {
      try {
        const raw = JSON.parse(last.slice(last.indexOf("{"), last.lastIndexOf("}") + 1));
        const parsed = schema.safeParse(ask.repair ? ask.repair(raw) : raw);
        if (parsed.success) return parsed.data;
        last = z.prettifyError(parsed.error);
      } catch (e) { last = `not JSON: ${(e as Error).message}; reply began: ${last.slice(0, 120)}`; }
      retry = `\n\nYour previous reply did not match the schema (${last.slice(0, 300)}). Reply again with valid JSON only.`;
    }
    console.error(`[ai] ${currentModel(vision ? "vision" : "text")} attempt ${attempt + 1}: ${last.slice(0, 500)}`);
  }
  throw new Unreadable(`invalid model output: ${last.slice(0, 200)}`);
}

let region = 0; // index of the endpoint in config.ai.baseUrls that last accepted the key
const modelAt = { vision: 0, text: 0 }; // index of the model that last existed for this key

type Kind = keyof typeof modelAt;
const models = (kind: Kind) => (kind === "vision" ? config.ai.visionModels : config.ai.textModels);
export const currentModel = (kind: Kind) => models(kind)[modelAt[kind]];

/** Tries each model in turn while the endpoint says it doesn't exist, and remembers the first that does. */
async function chat(kind: Kind, body: object): Promise<ChatReply> {
  const list = models(kind);
  for (let i = 0; ; i++) {
    const at = (modelAt[kind] + i) % list.length;
    try {
      const data = await post({ ...body, model: list[at] });
      modelAt[kind] = at;
      return data;
    } catch (e) {
      const missing = /AI 404|model_not_found|Model not exist|does not exist/i.test((e as Error).message);
      if (!missing || i >= list.length - 1) throw e;
    }
  }
}

type ChatReply = { choices?: { message?: { content?: unknown }; finish_reason?: string }[] };

/** POST to the first endpoint that accepts the key; upstream errors carry status and body for the logs. */
async function post(body: object): Promise<ChatReply> {
  const urls = config.ai.baseUrls;
  for (let i = 0; ; i++) {
    const at = (region + i) % urls.length;
    const res = await fetch(`${urls[at]}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${config.ai.key}` },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(110_000),
    });
    if (res.ok) { region = at; return res.json(); }
    const detail = (await res.text()).slice(0, 300);
    // A key from the other region is rejected as invalid, so try the next endpoint.
    if ((res.status === 401 || res.status === 403) && i < urls.length - 1) continue;
    throw new Error(`AI ${res.status} from ${new URL(urls[at]).host}: ${detail}`);
  }
}

/** Connectivity check for /api/ai-check: one tiny call per model, errors returned as text. */
export async function checkAi() {
  const probe = async (kind: Kind, content: unknown) => {
    try {
      const d = await chat(kind, { max_tokens: 5, messages: [{ role: "user", content }] });
      return { ok: true, endpoint: new URL(config.ai.baseUrls[region]).host, model: currentModel(kind), reply: String(d.choices?.[0]?.message?.content ?? "").slice(0, 40) };
    } catch (e) { return { ok: false, error: (e as Error).message.slice(0, 400) }; }
  };
  return {
    text: await probe("text", "Reply with OK."),
    vision: await probe("vision", [{ type: "image_url", image_url: { url: PROBE_PNG } }, { type: "text", text: "What colour is this? One word." }]),
  };
}
// 32×32 solid red PNG (some vision models reject images smaller than ~10 px).
const PROBE_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAKElEQVR4nO3NsQ0AAAzCMP5/un0CNkuZ41wybXsHAAAAAAAAAAAAxR4yw/wuPL6QkAAAAABJRU5ErkJggg==";

// Server-side refusal fallback: the API reroutes a declined request inside the same call.
// Only Fable / Opus 5+ / Sonnet 5.5 accept it; Haiku (the low-cost option) has no fallback.
const FALLBACK_MODELS = ["claude-fable-5-1", "claude-fable-5", "claude-opus-5-5", "claude-opus-5", "claude-sonnet-5-5"];
const FALLBACK = FALLBACK_MODELS.includes(config.model)
  ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const }
  : {};

const allergenIds = ALLERGENS.map((a) => a.id) as [string, ...string[]];

export const DishSchema = z.object({
  original: z.string().describe("Dish name exactly as printed, in Chinese"),
  pinyin: z.string(),
  translated: z.string().describe("Natural dish name in the target language"),
  literal: z.string().describe("Literal word-by-word meaning in the target language, useful for poetic names"),
  description: z.string().describe("1-2 sentences in the target language: what it is, how it's cooked, taste"),
  category: z.string().describe("e.g. cold dish, soup, meat, seafood, vegetable, staple, dessert, drink — in target language"),
  price: z.string().describe("Price as printed incl. unit like 份/斤/位, empty if none"),
  ingredients: z.array(
    z.object({
      name: z.string().describe("Ingredient in the target language"),
      zh: z.string().describe("Ingredient in Chinese"),
      source: z.enum(["menu", "standard_recipe"]).describe("menu = printed on the menu; standard_recipe = inferred from the dish's standard preparation"),
      role: z.enum(["main", "sauce", "garnish"]).describe("main = a defining ingredient the dish cannot be made without (the peanuts in 宫保鸡丁); sauce = seasoning, sauce, oil or stock; garnish = topping that can simply be left off"),
      allergens: z.array(z.enum(allergenIds)).describe("Allergens this ingredient itself contains, e.g. soy sauce → soy, gluten"),
    }),
  ),
  allergens: z.array(z.enum(allergenIds)).describe("Allergens likely present, including hidden ones in sauces (soy sauce = soy+gluten, oyster sauce = mollusc)"),
  meat: z.array(z.enum(["pork", "beef", "lamb", "chicken", "duck", "fish", "seafood", "offal", "other"])),
  vegetarian: z.boolean().describe("True only if no meat, fish, seafood, animal stock or lard in the standard recipe"),
  contains_alcohol: z.boolean(),
  spice_level: z.number().int().min(0).max(3),
  confidence: z.enum(["high", "medium", "low"]).describe("Confidence in the ingredient list; low if the name is ambiguous or a house special"),
  notes: z.string().describe("Warnings in the target language, e.g. regional variation, 'ask staff', portion sold by weight. Empty if none"),
});

export const MenuSchema = z.object({
  restaurant_type: z.string().describe("Cuisine type in target language, e.g. Sichuan, Cantonese, hotpot"),
  dishes: z.array(DishSchema),
  tips: z.array(z.string()).describe("0-3 ordering tips for this menu in the target language"),
});

export type Menu = z.infer<typeof MenuSchema>;
export type Dish = z.infer<typeof DishSchema>;

const MENU_SYSTEM = `You are a Chinese cuisine expert helping foreign travellers in mainland China read menus safely.
Extract every dish on the menu (or every dish name the user typed). For each dish:
- Keep the original Chinese name exactly; give Hanyu Pinyin with tone marks.
- Translate into the requested target language naturally (the way a good bilingual menu would), plus a literal meaning.
- List the ingredients. Mark items printed on the menu as "menu"; when only a name is given, list the ingredients of the dish's standard/most common recipe and mark them "standard_recipe". Include seasonings that matter for allergies or diet (soy sauce, oyster sauce, sesame oil, peanuts, lard, fish sauce, cooking wine, MSG).
- Be conservative with allergens: if a common version contains it, include it. A traveller with a severe allergy relies on this; false negatives are worse than false positives.
- Give each ingredient a role. "main" means the dish is defined by it and cannot be made without it (peanuts in 宫保鸡丁, shrimp in 虾饺, sesame paste in 麻酱凉面); asking the kitchen to leave it out is not realistic. When unsure, choose "main".
- List each ingredient's own allergens; every dish-level allergen must come from at least one ingredient.
- If the menu is not a food menu or is unreadable, return an empty dishes array and explain in tips.
Write every free-text field except "original", "pinyin" and ingredient "zh" in the target language.`;

// ---- tolerant reading of model output --------------------------------------------------------

const ALLERGEN_ALIASES: Record<string, string> = {
  peanuts: "peanut", groundnut: "peanut", shellfish: "crustacean", crustaceans: "crustacean", shrimp: "crustacean",
  prawn: "crustacean", crab: "crustacean", lobster: "crustacean", wheat: "gluten", flour: "gluten", eggs: "egg",
  dairy: "milk", lactose: "milk", soya: "soy", soybean: "soy", soybeans: "soy", tofu: "soy", sesame_seed: "sesame",
  sesame_seeds: "sesame", nuts: "tree_nut", tree_nuts: "tree_nut", treenut: "tree_nut", walnut: "tree_nut",
  cashew: "tree_nut", almond: "tree_nut", molluscs: "mollusc", mollusk: "mollusc", mollusks: "mollusc",
  oyster: "mollusc", squid: "mollusc", clam: "mollusc", sulfites: "sulphites", sulfite: "sulphites", sulphite: "sulphites",
  monosodium_glutamate: "msg", fish_sauce: "fish",
};
const known = new Set<string>(allergenIds);
const MEATS = new Set(["pork", "beef", "lamb", "chicken", "duck", "fish", "seafood", "offal", "other"]);
const str = (v: unknown) => (v == null ? "" : typeof v === "string" ? v : String(v));
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : v == null || v === "" ? [] : [v]);
const oneOf = <T extends string>(v: unknown, ok: readonly T[], fallback: T): T => {
  const s = str(v).toLowerCase().trim().replace(/[\s-]+/g, "_") as T;
  return ok.includes(s) ? s : fallback;
};
const bool = (v: unknown) => v === true || str(v).toLowerCase() === "true";

/** Maps allergen spellings to ids; anything unrecognised is reported so the dish can be marked uncertain. */
function allergensOf(v: unknown) {
  const ids = new Set<string>(); let unknown = false;
  for (const a of list(v)) {
    const k = str(a).toLowerCase().trim().replace(/[\s-]+/g, "_");
    const id = known.has(k) ? k : ALLERGEN_ALIASES[k];
    if (id) ids.add(id); else if (k) unknown = true;
  }
  return { ids: [...ids], unknown };
}

/**
 * Fixes the near-misses open models make (wrong enum spelling, a missing field, a string where a
 * list belongs) without inventing anything. Safety direction: unknown roles count as "main",
 * dish allergens include every ingredient's, and anything we couldn't map lowers confidence.
 */
function repairMenu(raw: unknown): unknown {
  let m = raw as Record<string, unknown>;
  if (m && !Array.isArray(m.dishes)) {
    const inner = Object.values(m).find((v) => v && typeof v === "object" && Array.isArray((v as Record<string, unknown>).dishes));
    if (inner) m = inner as Record<string, unknown>;
  }
  if (!m || !Array.isArray(m.dishes)) return raw;
  return {
    restaurant_type: str(m.restaurant_type),
    tips: list(m.tips).map(str).filter(Boolean),
    dishes: m.dishes.map((x) => {
      const d = (x ?? {}) as Record<string, unknown>;
      let unsure = false;
      const ingredients = list(d.ingredients).map((y) => {
        const i = (typeof y === "string" ? { name: y } : y ?? {}) as Record<string, unknown>;
        const a = allergensOf(i.allergens); unsure ||= a.unknown;
        return {
          name: str(i.name), zh: str(i.zh),
          source: oneOf(i.source, ["menu", "standard_recipe"] as const, "standard_recipe"),
          role: oneOf(i.role, ["main", "sauce", "garnish"] as const, "main"),
          allergens: a.ids,
        };
      });
      const dish = allergensOf(d.allergens); unsure ||= dish.unknown;
      const allergens = [...new Set([...dish.ids, ...ingredients.flatMap((i) => i.allergens)])];
      const spice = Math.round(Number(d.spice_level));
      const confidence = oneOf(d.confidence, ["high", "medium", "low"] as const, "low");
      return {
        original: str(d.original), pinyin: str(d.pinyin), translated: str(d.translated), literal: str(d.literal),
        description: str(d.description), category: str(d.category), price: str(d.price),
        ingredients, allergens,
        meat: [...new Set(list(d.meat).map((v) => (MEATS.has(str(v).toLowerCase()) ? str(v).toLowerCase() : "other")))],
        vegetarian: bool(d.vegetarian), contains_alcohol: bool(d.contains_alcohol),
        spice_level: Number.isFinite(spice) ? Math.min(3, Math.max(0, spice)) : 0,
        confidence: unsure ? "low" : confidence,
        notes: str(d.notes),
      };
    }),
  };
}

export async function analyzeMenu(input: { imageBase64?: string; mediaType?: string; text?: string; lang: string; city?: string }) {
  return structured(MenuSchema, {
    system: MENU_SYSTEM,
    maxTokens: 16000,
    repair: repairMenu,
    image: input.imageBase64 ? { data: input.imageBase64, mediaType: input.mediaType ?? "image/jpeg" } : undefined,
    text:
      `Target language: ${langName(input.lang)}.\n` +
      // Regional context: the same dish name differs between, say, Chengdu and Guangzhou.
      (input.city ? `The restaurant is in ${input.city}; prefer that region's version of each dish.\n` : "") +
      (input.text ? `Dish names typed by the traveller:\n${input.text}` : "Read the menu in the photo."),
  });
}

const TranslateSchema = z.object({
  translation: z.string(),
  pinyin: z.string().describe("Hanyu Pinyin with tone marks if the translation is Chinese, else empty"),
  note: z.string().describe("Optional cultural/politeness note in the source language, else empty"),
});

export async function translate(text: string, from: string, to: string) {
  return structured(TranslateSchema, {
    system: "You are an interpreter for a foreign traveller in mainland China. Translate the message so a local (taxi driver, waiter, hotel staff, pharmacist) understands it immediately. Use natural spoken Simplified Chinese for Chinese output. Do not add content.",
    maxTokens: 2000,
    text: `From ${from === "zh" ? "Chinese" : langName(from)} to ${to === "zh" ? "Simplified Chinese" : langName(to)}:\n${text}`,
  });
}

const HotelSchema = z.object({
  found: z.boolean().describe("False if the image is not a hotel booking or the address is unreadable"),
  name_zh: z.string().describe("Hotel name in Simplified Chinese, exactly as a taxi driver would know it"),
  address_zh: z.string().describe("Full street address in Simplified Chinese (city, district, road, number)"),
  name_en: z.string().describe("Hotel name in English if shown, else empty"),
});

/** Reads a booking confirmation (screenshot or photo) into a Chinese name + address for taxis. */
export async function extractHotel(imageBase64: string, mediaType = "image/jpeg") {
  return structured(HotelSchema, {
    system: "You read hotel booking confirmations for travellers in mainland China. Return the hotel's Chinese name and Chinese street address so a taxi driver can find it. If only an English name or address is shown, give the official Chinese name and address you are confident of; if you are not confident, set found=false rather than guessing.",
    maxTokens: 2000,
    image: { data: imageBase64, mediaType },
    text: "Extract the hotel from this booking.",
  });
}

// ---- city guide ---------------------------------------------------------------------------

const L10nSchema = z.object({ en: z.string(), es: z.string(), fr: z.string(), de: z.string(), ja: z.string(), ko: z.string() });

const GuideSchema = z.object({
  sights: z.array(z.object({
    zh: z.string().describe("The sight's Chinese name exactly as given in the input"),
    en: z.string().describe("Its usual English name"),
    intro: L10nSchema.describe("1-2 sentences per language: what it is and why people go"),
    best_time: L10nSchema.describe("Short phrase per language, e.g. 'early morning, before the crowds' or 'at night, when it is lit up'"),
    hours: z.number().describe("Typical visit length in hours, 0.5 to 8"),
    confidence: z.enum(["high", "low"]).describe("low if you are not sure what this place is"),
  })),
  dishes: z.array(z.object({
    zh: z.string().describe("Dish name in Simplified Chinese, as restaurants write it"),
    name: L10nSchema.describe("Natural dish name per language"),
    intro: L10nSchema.describe("1-2 sentences per language: what it is and how it tastes"),
    confidence: z.enum(["high", "low"]),
  })).describe("Exactly 5 dishes the city is known for and a visitor can find in ordinary restaurants there"),
  areas: z.array(z.object({
    zh: z.string().describe("Area name in Simplified Chinese, as locals say it (a district or neighbourhood)"),
    anchor_zh: z.string().describe("One well-known landmark or metro station at the centre of the area, in Simplified Chinese, for the map search"),
    name: L10nSchema.describe("Area name per language"),
    reason: L10nSchema.describe("One sentence per language: why a first-time visitor would stay here (what is walkable, how it connects)"),
  })).describe("2 or 3 areas where a first-time visitor to this city usually stays"),
});

const GUIDE_SYSTEM = `You write short, factual travel notes for foreign visitors to mainland China, in English, Spanish, French, German, Japanese and Korean.
Rules:
- Describe each sight only from what it is widely known for. Never state prices, opening hours, ticket release times, dates or rules: those come from other sources and change.
- If a name in the list is ambiguous or you don't recognise it, still return it, mark confidence "low" and keep the text generic.
- Dishes must be specific to this city or its region, not national staples.
- Areas: suggest 2–3 neighbourhoods first-time visitors usually stay in. Explain why in terms of what is nearby; do not claim hotel prices or availability.
- Plain, friendly sentences. No superlatives you can't back up.`;

/** Text for a city guide. Sights are given (from Amap); dishes are chosen by the model. */
export async function writeCityGuide(input: { cityZh: string; cityEn: string; sights: { zh: string; type: string; address: string; rating?: number }[] }) {
  return structured(GuideSchema, {
    system: GUIDE_SYSTEM,
    maxTokens: 16000,
    text: `City: ${input.cityEn} (${input.cityZh}).\nSights (from the map, keep the order):\n` +
      input.sights.map((x, i) => `${i + 1}. ${x.zh} — ${x.type}; ${x.address}${x.rating ? `; rated ${x.rating}` : ""}`).join("\n"),
  });
}
