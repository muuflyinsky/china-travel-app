import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import * as z from "zod/v4";
import { config } from "./config";
import { ALLERGENS } from "./allergens";
import { langName } from "./languages";

const client = () => new Anthropic({ apiKey: config.anthropicKey });

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
- If the menu is not a food menu or is unreadable, return an empty dishes array and explain in tips.
Write every free-text field except "original", "pinyin" and ingredient "zh" in the target language.`;

export async function analyzeMenu(input: { imageBase64?: string; mediaType?: string; text?: string; lang: string; city?: string }) {
  const content: Anthropic.Beta.BetaContentBlockParam[] = [];
  if (input.imageBase64) {
    content.push({
      type: "image",
      source: { type: "base64", media_type: (input.mediaType ?? "image/jpeg") as "image/jpeg", data: input.imageBase64 },
    });
  }
  content.push({
    type: "text",
    text:
      `Target language: ${langName(input.lang)}.\n` +
      // Regional context: the same dish name differs between, say, Chengdu and Guangzhou.
      (input.city ? `The restaurant is in ${input.city}; prefer that region's version of each dish.\n` : "") +
      (input.text ? `Dish names typed by the traveller:\n${input.text}` : "Read the menu in the photo."),
  });

  const res = await client().beta.messages.parse({
    model: config.model,
    max_tokens: 16000,
    system: MENU_SYSTEM,
    output_config: { effort: "low", format: betaZodOutputFormat(MenuSchema) },
    messages: [{ role: "user", content }],
    ...FALLBACK,
  });
  if (res.stop_reason === "refusal" || !res.parsed_output) {
    throw new Error("The menu could not be analysed. Try a clearer photo.");
  }
  return res.parsed_output;
}

const TranslateSchema = z.object({
  translation: z.string(),
  pinyin: z.string().describe("Hanyu Pinyin with tone marks if the translation is Chinese, else empty"),
  note: z.string().describe("Optional cultural/politeness note in the source language, else empty"),
});

export async function translate(text: string, from: string, to: string) {
  const res = await client().beta.messages.parse({
    model: config.model,
    max_tokens: 2000,
    system:
      "You are an interpreter for a foreign traveller in mainland China. Translate the message so a local (taxi driver, waiter, hotel staff, pharmacist) understands it immediately. Use natural spoken Simplified Chinese for Chinese output. Do not add content.",
    output_config: { effort: "low", format: betaZodOutputFormat(TranslateSchema) },
    messages: [{ role: "user", content: `From ${from === "zh" ? "Chinese" : langName(from)} to ${to === "zh" ? "Simplified Chinese" : langName(to)}:\n${text}` }],
    ...FALLBACK,
  });
  if (!res.parsed_output) throw new Error("Translation failed");
  return res.parsed_output;
}

const HotelSchema = z.object({
  found: z.boolean().describe("False if the image is not a hotel booking or the address is unreadable"),
  name_zh: z.string().describe("Hotel name in Simplified Chinese, exactly as a taxi driver would know it"),
  address_zh: z.string().describe("Full street address in Simplified Chinese (city, district, road, number)"),
  name_en: z.string().describe("Hotel name in English if shown, else empty"),
});

/** Reads a booking confirmation (screenshot or photo) into a Chinese name + address for taxis. */
export async function extractHotel(imageBase64: string, mediaType = "image/jpeg") {
  const res = await client().beta.messages.parse({
    model: config.model,
    max_tokens: 2000,
    system:
      "You read hotel booking confirmations for travellers in mainland China. Return the hotel's Chinese name and Chinese street address so a taxi driver can find it. If only an English name or address is shown, give the official Chinese name and address you are confident of; if you are not confident, set found=false rather than guessing.",
    output_config: { effort: "low", format: betaZodOutputFormat(HotelSchema) },
    messages: [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: mediaType as "image/jpeg", data: imageBase64 } },
        { type: "text", text: "Extract the hotel from this booking." },
      ],
    }],
    ...FALLBACK,
  });
  if (res.stop_reason === "refusal" || !res.parsed_output) throw new Error("Could not read the booking");
  return res.parsed_output;
}
