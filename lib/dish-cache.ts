// Dish knowledge base (SPEC v0.5 P1.7 #29). Only general facts about dishes — never anything
// about a traveller, never menu photos. Lookup: (name, province) → (name, '') → miss.
// Kept in memory always, and in Supabase when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set
// (server-side only; the tables have RLS on and no policies, so browsers can't read them).
// Schema: supabase/migrations/0001_dishes.sql.
import { currentModel } from "./llm";
import type { DishDetail } from "./dishes";
import { normalizeName } from "./dish-name";
import { rest, supabaseOn } from "./supabase";

export { supabaseOn };

/** Bump when the prompts change: older entries are then treated as missing and regenerated. */
export const PROMPT_VERSION = "2026-10-25.1";

const MEDIUM_TTL = 7 * 24 * 3600_000;

export type Cached = {
  facts: {
    pinyin: string; allergens: { id: string; role: "main" | "sauce" | "garnish"; via_zh: string }[];
    spice: number; vegetarian: boolean; meat: string[]; alcohol: boolean; confidence: "high" | "medium" | "low";
  };
  /** In the traveller's language. `via`: ingredient (Chinese) → its name in this language. */
  text: { name: string; short: string; via?: Record<string, string> };
  detail?: DishDetail;
};

type Entry = Cached & { at: number };
const memory = new Map<string, Entry>();
const memKey = (n: string, region: string, lang: string) => `${n}|${region}|${lang}`;

const fresh = (confidence: string, at: number) => confidence === "high" || (confidence === "medium" && Date.now() - at < MEDIUM_TTL);

type Row = {
  id: number; region: string; facts: Cached["facts"]; confidence: string; prompt_version: string | null; flagged: boolean; updated_at: string;
  dish_texts: { name: string; short: string | null; description: string | null; literal: string | null; notes: string | null; via: Record<string, string> | null; ingredients: DishDetail["ingredients"] | null }[];
};

export async function cacheGet(zh: string, region: string, lang: string): Promise<Cached | null> {
  const n = normalizeName(zh);
  if (!n) return null;
  for (const r of region ? [region, ""] : [""]) {
    const m = memory.get(memKey(n, r, lang));
    if (m && fresh(m.facts.confidence, m.at)) return m;
  }
  if (!supabaseOn) return null;
  try {
    const regions = region ? `in.(${region},"")` : "eq.";
    const rows = (await rest(
      `dishes?select=id,region,facts,confidence,prompt_version,flagged,updated_at,dish_texts(name,short,description,literal,notes,via,ingredients)` +
      `&name_zh=eq.${encodeURIComponent(n)}&region=${regions}&dish_texts.lang=eq.${encodeURIComponent(lang)}`,
    )) as Row[];
    // Regional version first; skip flagged, outdated or expired entries and ones without this language.
    const row = rows.sort((a, b) => b.region.length - a.region.length).find((x) =>
      !x.flagged && x.prompt_version === PROMPT_VERSION && fresh(x.confidence, Date.parse(x.updated_at)) && x.dish_texts.length);
    if (!row) return null;
    const t = row.dish_texts[0];
    const c: Cached = {
      facts: row.facts,
      text: { name: t.name, short: t.short ?? "", via: t.via ?? {} },
      detail: t.description != null && t.ingredients ? { description: t.description, literal: t.literal ?? "", notes: t.notes ?? "", ingredients: t.ingredients } : undefined,
    };
    memory.set(memKey(n, row.region, lang), { ...c, at: Date.parse(row.updated_at) });
    return c;
  } catch (e) {
    console.error("[dish-cache] read:", (e as Error).message);
    return null;
  }
}

/** Stores high-confidence results; medium ones for 7 days; low ones never. */
export async function cachePut(zh: string, region: string, lang: string, c: Cached) {
  const n = normalizeName(zh);
  if (!n || c.facts.confidence === "low") return;
  memory.set(memKey(n, region, lang), { ...c, at: Date.now() });
  if (!supabaseOn) return;
  const [row] = (await rest("dishes?on_conflict=name_zh,region", {
    method: "POST",
    headers: { prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({
      name_zh: n, region, facts: c.facts, confidence: c.facts.confidence, model: currentModel("text"),
      prompt_version: PROMPT_VERSION, flagged: false, updated_at: new Date().toISOString(),
    }),
  })) as { id: number }[];
  await rest("dish_texts?on_conflict=dish_id,lang", {
    method: "POST",
    headers: { prefer: "resolution=merge-duplicates,return=minimal" },
    // Only the columns we have: a list-only write must not wipe a detail written earlier.
    body: JSON.stringify({
      dish_id: row.id, lang, name: c.text.name, short: c.text.short, via: c.text.via ?? {},
      ...(c.detail && { description: c.detail.description, literal: c.detail.literal, notes: c.detail.notes, ingredients: c.detail.ingredients }),
    }),
  });
}

/** "This dish info is wrong": anonymous. The entry stops being served and is regenerated next time. */
export async function flagDish(zh: string, region: string, lang: string, reason: string) {
  const n = normalizeName(zh);
  for (const k of memory.keys()) if (k.startsWith(`${n}|`)) memory.delete(k);
  if (!supabaseOn) { console.log(`[dish-cache] flagged ${n} (${region || "-"}, ${lang}): ${reason}`); return; }
  await rest("rpc/flag_dish", { method: "POST", body: JSON.stringify({ p_name_zh: n, p_region: region, p_lang: lang, p_reason: reason }) });
}
