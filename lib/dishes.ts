// Menu reading in two steps (SPEC v0.5 P1.7 #28): a vision model only reads the dish names and
// prices off the photo, then each dish is looked up in the dish knowledge base and only the
// misses go to a text model, a few dishes per call, so the list can be streamed dish by dish.
// The list carries just what's needed to answer "can I order this?"; ingredients, literal
// meaning and notes come from /api/dish when a dish is opened.
import * as z from "zod/v4";
import { structured, allergenEnum } from "./llm";
import { langName } from "./languages";
import { ALLERGENS } from "./allergens";
import { cacheGet, cachePut, canonicalZh, factsGet, isChineseName, mergeFacts, PROMPT_VERSION, type Cached } from "./dish-cache";
import { normalizeName, regionOf } from "./dish-name";
import { tighten } from "./ingredients";

const ROLE = z.enum(["main", "sauce", "garnish"]);
const MEAT = ["pork", "beef", "lamb", "chicken", "duck", "fish", "seafood", "offal", "other"] as const;

// ---- shapes sent to the browser -------------------------------------------------------------

/** One allergen in a dish, traced to the ingredient that brings it. */
export type DishAllergen = { id: string; role: "main" | "sauce" | "garnish"; via: string; via_zh: string };

/** A dish in the result list. `printed` is any description printed next to it on the menu. */
export type ListDish = {
  zh: string; pinyin: string; price: string; name: string; short: string;
  allergens: DishAllergen[]; spice: number; vegetarian: boolean; meat: string[]; alcohol: boolean;
  confidence: "high" | "medium" | "low"; printed?: string;
};

export type DishDetail = {
  literal: string; description: string; notes: string;
  ingredients: { zh: string; name: string; role: "main" | "sauce" | "garnish"; source: "menu" | "standard_recipe"; allergens: string[] }[];
};

// ---- step 1: read the photo -----------------------------------------------------------------

const ReadSchema = z.object({
  cuisine: z.string(),
  dishes: z.array(z.object({ zh: z.string(), price: z.string(), printed: z.string() })),
});

const READ_SYSTEM = `You read Chinese restaurant menus from photos (printed or handwritten).
List every dish exactly as written, top to bottom: "zh" is the dish name in Chinese (copy it, don't translate or fix it), "price" is the price as printed including the unit such as 份/斤/位 (empty if none), "printed" is any ingredient or description text printed with that dish in Chinese (empty if none). Skip section headings, drinks lists without names, and restaurant slogans.
"cuisine" is the kind of restaurant in English in one or two words (e.g. Sichuan, Cantonese, hotpot, noodles), empty if unclear.
If the image is not a food menu, return an empty dishes array.`;

export async function readMenuPhoto(image: { data: string; mediaType: string }) {
  return structured(ReadSchema, {
    system: READ_SYSTEM, maxTokens: 4000, image, text: "Read the menu.",
    example: { cuisine: "Sichuan", dishes: [{ zh: "宫保鸡丁", price: "¥48/份", printed: "" }] },
    repair: (raw) => {
      const m = (raw ?? {}) as Record<string, unknown>;
      const dishes = (Array.isArray(m.dishes) ? m.dishes : []).map((x) => {
        const d = (typeof x === "string" ? { zh: x } : x ?? {}) as Record<string, unknown>;
        return { zh: s(d.zh ?? d.name), price: s(d.price), printed: s(d.printed) };
      }).filter((d) => d.zh.trim());
      return { cuisine: s(m.cuisine), dishes };
    },
  });
}

/** Typed input: one dish per line (commas and 、 also separate). */
export const splitTyped = (text: string) =>
  text.split(/[\n,，、;；]+/).map((x) => x.trim()).filter(Boolean).slice(0, 40).map((zh) => ({ zh, price: "", printed: "" }));

// ---- step 2: facts for the list -------------------------------------------------------------

const FactsSchema = z.object({
  cuisine: z.string(),
  tips: z.array(z.string()),
  dishes: z.array(z.object({
    zh: z.string(), pinyin: z.string(), name: z.string(), short: z.string(),
    allergens: z.array(z.object({ id: allergenEnum, role: ROLE, via_zh: z.string(), via: z.string() })),
    spice: z.number().int().min(0).max(3), vegetarian: z.boolean(), meat: z.array(z.enum(MEAT)), alcohol: z.boolean(),
    confidence: z.enum(["high", "medium", "low"]),
  })),
});

const FACTS_SYSTEM = `You are a Chinese cuisine expert helping foreign travellers in mainland China order safely.
For each dish name you get, answer for the dish's standard (most common) recipe, in the region given:
- "zh": the dish name exactly as given. "pinyin": Hanyu Pinyin with tone marks.
- "name": the natural dish name in the target language, as a good bilingual menu would write it. "short": what it is in at most 10 words, target language.
- "allergens": every allergen likely present, including hidden ones in sauces (soy sauce = soy + gluten, oyster sauce = mollusc, sesame oil = sesame). Be conservative: if a common version contains it, include it; a missed allergen can hurt someone, an extra one only costs a question. Allergen ids: ${ALLERGENS.map((a) => a.id).join(", ")}.
  Sichuan pepper (花椒) is a spice, not a nut. For each allergen, "via_zh" is the ingredient that brings it (Chinese) and "via" the same ingredient in the target language: just its name, 1–3 words, no comments or parentheses. "role": "main" if the dish is defined by it and can't be made without it (peanuts in 宫保鸡丁, shrimp in 虾饺), "sauce" for seasoning, sauce, oil or stock, "garnish" for a topping that can be left off. When unsure, "main".
- "spice" 0–3; "vegetarian" true only if no meat, fish, seafood, animal stock or lard; "meat" lists ${MEAT.join(", ")}; "alcohol" true if cooked with wine or spirits.
- "confidence" is about knowing what the dish is, not about every kitchen's recipe: "high" for any established dish with a standard recipe (宫保鸡丁, 麻婆豆腐, 担担面, 回锅肉, 夫妻肺片, 清炒时蔬 are all high), "medium" when the name covers clearly different dishes, "low" only for house specials, poetic names you can't decode, or text that may not be a dish.
- "cuisine": the kind of restaurant these dishes suggest, in the target language. "tips": 0–2 short ordering tips for these dishes in the target language (e.g. sold by weight, rice is extra); empty if nothing useful.
Return the dishes in the order given.`;

const FACTS_EXAMPLE = {
  cuisine: "Sichuan", tips: ["Rice is ordered separately, per bowl."],
  dishes: [{
    zh: "宫保鸡丁", pinyin: "gōng bǎo jī dīng", name: "Kung Pao Chicken", short: "Diced chicken with peanuts and dried chili, sweet-sour",
    allergens: [{ id: "peanut", role: "main", via_zh: "花生", via: "peanuts" }, { id: "soy", role: "sauce", via_zh: "酱油", via: "soy sauce" }],
    spice: 2, vegetarian: false, meat: ["chicken"], alcohol: true, confidence: "high",
  }],
};

const known = new Set<string>(ALLERGENS.map((a) => a.id));
const ALIASES: Record<string, string> = {
  peanuts: "peanut", shellfish: "crustacean", crustaceans: "crustacean", shrimp: "crustacean", prawn: "crustacean", crab: "crustacean",
  wheat: "gluten", eggs: "egg", dairy: "milk", soya: "soy", soybean: "soy", sesame_oil: "sesame", nuts: "tree_nut", tree_nuts: "tree_nut",
  molluscs: "mollusc", mollusk: "mollusc", oyster: "mollusc", sulfites: "sulphites", sulfite: "sulphites", fish_sauce: "fish",
  oyster_sauce: "mollusc", squid: "mollusc", clam: "mollusc", flour: "gluten", tofu: "soy", sesame_seeds: "sesame",
  sesame_paste: "sesame", peanut_oil: "peanut", eggs_yolk: "egg", egg_white: "egg", milk_products: "milk", lactose: "milk",
  monosodium_glutamate: "msg", chicken_powder: "msg", walnut: "tree_nut", cashew: "tree_nut", almond: "tree_nut", shellfish_crustacean: "crustacean",
};
// Words models put in "allergens" that aren't allergens: meat, alcohol and spice are covered by
// their own fields, so they mustn't make a well-known dish look uncertain. Lard and animal fat
// aren't dropped: they make the dish pork and not vegetarian (review R2).
const ANIMAL_FAT: Record<string, (typeof MEAT)[number]> = { lard: "pork", pork_fat: "pork", suet: "beef", tallow: "beef", beef_tallow: "beef", chicken_fat: "chicken", animal_fat: "other" };
const NOT_ALLERGENS = new Set([
  "pork", "beef", "lamb", "mutton", "chicken", "duck", "goose", "meat", "offal",
  "alcohol", "wine", "cooking_wine", "rice_wine", "shaoxing_wine", "chili", "chilli", "spicy", "sichuan_pepper",
  "garlic", "onion", "scallion", "ginger", "vinegar", "sugar", "salt", "starch", "corn_starch", "none",
]);
const s = (v: unknown) => (v == null ? "" : typeof v === "string" ? v : String(v));
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : v == null || v === "" ? [] : [v]);
const key = (v: unknown) => s(v).toLowerCase().trim().replace(/[\s-]+/g, "_");
const pick = <T extends string>(v: unknown, ok: readonly T[], fallback: T) => (ok.includes(key(v) as T) ? (key(v) as T) : fallback);
const yes = (v: unknown) => v === true || key(v) === "true";

/** Near-misses from open models, fixed toward safety: unknown role = main, unknown allergen = low confidence. */
function repairFacts(raw: unknown) {
  const m = (raw ?? {}) as Record<string, unknown>;
  return {
    cuisine: s(m.cuisine), tips: arr(m.tips).map(s).filter(Boolean),
    dishes: arr(m.dishes).map((x) => {
      const d = (x ?? {}) as Record<string, unknown>;
      const fat: (typeof MEAT)[number][] = [];
      let unsure = false;
      const allergens = arr(d.allergens).flatMap((y) => {
        const a = (typeof y === "string" ? { id: y } : y ?? {}) as Record<string, unknown>;
        if (ANIMAL_FAT[key(a.id)]) { fat.push(ANIMAL_FAT[key(a.id)]); return []; }
        const id = known.has(key(a.id)) ? key(a.id) : ALIASES[key(a.id)];
        if (!id) {
          // Unknown word: could be an allergen we can't map, so the dish is marked unsure (and logged to extend ALIASES).
          if (key(a.id) && !NOT_ALLERGENS.has(key(a.id))) { unsure = true; console.warn(`[menu] unknown allergen "${key(a.id)}" in ${s(d.zh)}`); }
          return [];
        }
        return [{ id, role: pick(a.role, ["main", "sauce", "garnish"] as const, "main"), via_zh: s(a.via_zh), via: s(a.via) }];
      });
      const spice = Math.round(Number(d.spice));
      return {
        zh: s(d.zh), pinyin: s(d.pinyin), name: s(d.name), short: s(d.short), allergens,
        spice: Number.isFinite(spice) ? Math.min(3, Math.max(0, spice)) : 0,
        vegetarian: yes(d.vegetarian) && !fat.length, alcohol: yes(d.alcohol),
        meat: [...new Set([...arr(d.meat).map((v) => pick(v, MEAT, "other")), ...fat])],
        confidence: unsure ? "low" : pick(d.confidence, ["high", "medium", "low"] as const, "low"),
      };
    }),
  };
}

async function generateFacts(names: { zh: string; printed: string }[], lang: string, city: string | undefined, wantTips: boolean) {
  return structured(FactsSchema, {
    system: FACTS_SYSTEM, maxTokens: 700 * names.length + 400, example: FACTS_EXAMPLE, repair: repairFacts,
    text: `Target language: ${langName(lang)}.\n` +
      (city ? `The restaurant is in ${city}; use that region's version of each dish.\n` : "") +
      (wantTips ? "" : "Leave tips empty.\n") +
      `Dishes:\n${names.map((n, i) => `${i + 1}. ${n.zh}${n.printed ? ` (menu says: ${n.printed})` : ""}`).join("\n")}`,
  });
}

// ---- detail ---------------------------------------------------------------------------------

const DetailSchema = z.object({
  literal: z.string(), description: z.string(), notes: z.string(),
  ingredients: z.array(z.object({ zh: z.string(), name: z.string(), role: ROLE, source: z.enum(["menu", "standard_recipe"]), allergens: z.array(allergenEnum) })),
});

const DETAIL_SYSTEM = `You are a Chinese cuisine expert explaining one dish to a foreign traveller in mainland China, in the target language.
- "literal": what the Chinese characters of the name literally say, word by word, even when that sounds odd: 麻婆豆腐 → "pockmarked old woman's tofu", 蚂蚁上树 → "ants climbing a tree", 宫保鸡丁 → "palace-guardian chicken cubes". Not a description of the dish. Empty if it equals the plain name.
- "description": 1–2 sentences: what it is, how it's cooked, how it tastes.
- "ingredients": the standard recipe for this region, main ingredients first, including seasonings that matter for allergies or diet (soy sauce, oyster sauce, sesame oil, peanuts, lard, fish sauce, cooking wine, MSG). "source" is "menu" only for ingredients the menu text mentions, otherwise "standard_recipe". "role" as: main = the dish can't be made without it; sauce = seasoning, sauce, oil, stock; garnish = can be left off. "allergens" per ingredient, conservative. Allergen ids: ${ALLERGENS.map((a) => a.id).join(", ")}.
- "notes": what to watch for: served cold, sold by weight (斤), big regional differences, usually very spicy, can be made without X. Empty if nothing.`;

function repairDetail(raw: unknown) {
  const m = (raw ?? {}) as Record<string, unknown>;
  return {
    literal: s(m.literal), description: s(m.description), notes: s(m.notes),
    ingredients: arr(m.ingredients).map((y) => {
      const i = (typeof y === "string" ? { name: y } : y ?? {}) as Record<string, unknown>;
      return {
        zh: s(i.zh), name: s(i.name), role: pick(i.role, ["main", "sauce", "garnish"] as const, "main"),
        source: pick(i.source, ["menu", "standard_recipe"] as const, "standard_recipe"),
        allergens: arr(i.allergens).map((a) => (known.has(key(a)) ? key(a) : ALIASES[key(a)])).filter(Boolean),
      };
    }),
  };
}

// ---- the pipeline ---------------------------------------------------------------------------

const CHUNK = 2;      // dishes per model call: output length drives latency, so small batches arrive first
const PARALLEL = 6;   // concurrent model calls per menu

type Item = { zh: string; price: string; printed: string };

// Every dish leaves through the word list (lib/ingredients.ts), cached or fresh.
const fromCache = (it: Item, c: Cached): ListDish => tighten({
  ...c.facts, zh: it.zh, price: it.price, name: c.text.name, short: c.text.short,
  allergens: c.facts.allergens.map((a) => ({ ...a, via: c.text.via?.[a.via_zh] || a.via_zh })),
});

export type MenuEvent =
  | { type: "meta"; cuisine: string; total: number }
  | { type: "dish"; i: number; dish: ListDish; cached: boolean }
  | { type: "tips"; tips: string[] }
  | { type: "missing"; i: number[]; reason?: string };

/**
 * Streams a menu: the dish count first, then each dish as soon as it's known (cache hits at
 * once, the rest per model call), then tips. Timings go to the server log.
 */
export async function* readMenu(input: { image?: { data: string; mediaType: string }; text?: string; lang: string; city?: string; adcode?: string }): AsyncGenerator<MenuEvent> {
  const t0 = Date.now();
  const region = regionOf(input.adcode);
  let items: Item[], cuisine = "";
  if (input.image) {
    const read = await readMenuPhoto(input.image);
    items = read.dishes.slice(0, 60); cuisine = read.cuisine;
  } else {
    items = splitTyped(input.text ?? "");
  }
  // Pinyin or English typed in: the Chinese name when we know the dish, so it is looked up
  // (and shown to staff) as that dish. Unknown ones are answered but never cached (review R3).
  items = await Promise.all(items.map(async (it) => {
    if (isChineseName(it.zh)) return it;
    const zh = await canonicalZh(it.zh);
    return zh ? { ...it, zh } : it;
  }));
  const tRead = Date.now();
  yield { type: "meta", cuisine, total: items.length };
  if (!items.length) return;

  // Cache first. Dishes with menu-printed text are the house version, so they skip the cache.
  const hits = await Promise.all(items.map((it) => (it.printed ? null : cacheGet(it.zh, region, input.lang))));
  const tCache = Date.now();
  const misses: number[] = [];
  for (let i = 0; i < items.length; i++) {
    const h = hits[i];
    if (h) yield { type: "dish", i, dish: fromCache(items[i], h), cached: true };
    else misses.push(i);
  }

  // Facts another language already stored: a new language merges into them instead of replacing them.
  const stored = new Map<number, Cached["facts"]>();
  await Promise.all(misses.map(async (i) => {
    const f = items[i].printed ? null : await factsGet(items[i].zh, region);
    if (f) stored.set(i, f);
  }));

  // Misses in small batches, a few at a time; each batch is emitted the moment it returns.
  type Facts = z.infer<typeof FactsSchema>;
  type Done = { id: number; b: number[]; out: Facts | null; err?: string };
  const batches: number[][] = [];
  for (let k = 0; k < misses.length; k += CHUNK) batches.push(misses.slice(k, k + CHUNK));
  const running = new Map<number, Promise<Done>>();
  const failed: number[] = [];
  const writes: Promise<unknown>[] = [];
  let next = 0, tipsSent = false, lastError = "";
  const launch = () => {
    if (next >= batches.length) return;
    const id = next++, b = batches[id];
    running.set(id, generateFacts(b.map((i) => items[i]), input.lang, input.city, id === 0)
      .then((out) => ({ id, b, out }), (e) => { console.error("[menu] facts batch failed:", (e as Error).message); return { id, b, out: null, err: (e as Error).message }; }));
  };
  for (let k = 0; k < PARALLEL; k++) launch();
  while (running.size) {
    const { id, b, out, err } = await Promise.race(running.values());
    running.delete(id);
    launch();
    if (!out) { failed.push(...b); lastError ||= err ?? ""; continue; }
    if (!cuisine && out.cuisine) { cuisine = out.cuisine; yield { type: "meta", cuisine, total: items.length }; }
    if (!tipsSent && out.tips.length) { tipsSent = true; yield { type: "tips", tips: out.tips.slice(0, 2) }; }
    for (const [j, i] of b.entries()) {
      // Models occasionally reorder, so prefer an exact name match over the position.
      const f = out.dishes.find((d) => normalizeName(d.zh) === normalizeName(items[i].zh)) ?? out.dishes[j];
      if (!f) { failed.push(i); continue; }
      const drawn: Cached["facts"] = { pinyin: f.pinyin, allergens: f.allergens.map(({ id, role, via_zh }) => ({ id, role, via_zh })), spice: f.spice, vegetarian: f.vegetarian, meat: f.meat, alcohol: f.alcohol, confidence: f.confidence };
      const facts = stored.has(i) ? mergeFacts(stored.get(i)!, drawn) : drawn;
      const via: Record<string, string> = Object.fromEntries(f.allergens.map((a) => [a.via_zh, a.via]));
      const dish: ListDish = tighten({
        ...f, ...facts, zh: items[i].zh, price: items[i].price, printed: items[i].printed || undefined,
        allergens: facts.allergens.map((a) => ({ ...a, via: via[a.via_zh] || a.via_zh })),
      });
      if (!items[i].printed) {
        writes.push(cachePut(items[i].zh, region, input.lang, { facts, text: { name: f.name, short: f.short, via } })
          .catch((e) => console.error("[dish-cache] write:", (e as Error).message)));
      }
      yield { type: "dish", i, dish, cached: false };
    }
  }
  // The first upstream error (no secrets in it) helps diagnose from the browser when logs aren't at hand.
  // Serverless hosts freeze the instance once the response ends, so writes still in flight would be
  // cut off (a dish row without its text row). Dishes are already on screen; this only delays "done".
  await Promise.allSettled(writes);
  if (failed.length) yield { type: "missing", i: failed.sort((a, b) => a - b), reason: lastError.slice(0, 200) };
  console.log(`[menu] ${input.image ? "photo" : "text"} dishes=${items.length} read=${tRead - t0}ms cache=${items.length - misses.length}/${items.length} (${tCache - tRead}ms) generate=${Date.now() - tCache}ms failed=${failed.length} total=${Date.now() - t0}ms prompt=${PROMPT_VERSION}`);
}

/** Detail for one opened dish: from the cache when we have it, otherwise generated and stored. */
export async function dishDetail(input: { zh: string; printed?: string; lang: string; city?: string; adcode?: string }): Promise<DishDetail & { cached: boolean }> {
  const t0 = Date.now();
  const region = regionOf(input.adcode);
  const hit = input.printed ? null : await cacheGet(input.zh, region, input.lang);
  if (hit?.detail) {
    console.log(`[dish] cache hit ${normalizeName(input.zh)} ${Date.now() - t0}ms`);
    return { ...hit.detail, cached: true };
  }
  const raw = await structured(DetailSchema, {
    system: DETAIL_SYSTEM, maxTokens: 1500, repair: repairDetail,
    example: { literal: "Palace-guardian chicken cubes", description: "…", notes: "", ingredients: [{ zh: "花生米", name: "roasted peanuts", role: "main", source: "standard_recipe", allergens: ["peanut"] }] },
    text: `Target language: ${langName(input.lang)}.\n` + (input.city ? `Region: ${input.city}.\n` : "") +
      `Dish: ${input.zh}` + (input.printed ? `\nThe menu says: ${input.printed}` : ""),
  });
  // Without menu text nothing can be "on the menu"; models still say so sometimes.
  const d = input.printed ? raw : { ...raw, ingredients: raw.ingredients.map((i) => ({ ...i, source: "standard_recipe" as const })) };
  // Awaited for the same reason as in readMenu: an unawaited write can be frozen mid-way.
  if (!input.printed && hit) await cachePut(input.zh, region, input.lang, { ...hit, detail: d }).catch((e) => console.error("[dish-cache] write:", (e as Error).message));
  console.log(`[dish] generated ${normalizeName(input.zh)} ${Date.now() - t0}ms`);
  return { ...d, cached: false };
}
