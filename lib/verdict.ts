// One answer per dish for the menu list (SPEC v0.5 P1.7 #26): can I order this, and why not.
// Red/amber/green are used for this verdict only. Wording follows the 2026-10-25 safety review
// (option B): a severe allergy never gets a green answer.
import type { ListDish } from "./dishes";
import { tighten } from "./ingredients";

export type VerdictKind = "ok" | "ask" | "no";
export type Reason =
  | { k: "main"; via: string }        // one of my allergens is a main ingredient
  | { k: "severe"; via: string }      // a severe allergen of mine is in the sauce or garnish
  | { k: "has"; via: string }         // one of my allergens is in the sauce or garnish
  | { k: "diet"; what: "notVeg" | "pork" | "beef" | "alcohol" | "spicy" | "halalMeat" | "hiddenAnimal" }
  | { k: "unsure" };

export type Verdict = {
  kind: VerdictKind;
  reasons: Reason[];
  /** Severe allergens in the usual recipe, whatever their role: the dish can't be added at all. */
  blocked: string[];
  /** Non-severe allergens that only come from sauce or garnish: "add, without X" is an option. */
  removable: { id: string; via: string; via_zh: string }[];
  /** "ok", but the traveller has a severe allergy: shown neutral, "confirm with your card", never green. */
  confirm: boolean;
};

type Restrictions = { allergens: string[]; diets: string[]; severe: string[] };

const LAND_MEAT = ["pork", "beef", "lamb", "chicken", "duck", "offal", "other"];

export function verdict(d: ListDish, p: Restrictions): Verdict {
  const reasons: Reason[] = [];
  const mine = d.allergens.filter((a) => p.allergens.includes(a.id));
  // An allergen counts as main if any ingredient that brings it is main.
  const mainIds = new Set(mine.filter((a) => a.role === "main").map((a) => a.id));
  const main = mine.filter((a) => mainIds.has(a.id));
  // With a severe allergy, a sauce or garnish counts too: "leave it out" can't be trusted (R1).
  const severeIds = new Set(mine.filter((a) => p.severe.includes(a.id)).map((a) => a.id));
  const severeSide = mine.filter((a) => severeIds.has(a.id) && !mainIds.has(a.id));
  // One entry per ingredient: soy sauce and bean paste both bring soy, and both get left out.
  const removable = mine.filter((a) => !mainIds.has(a.id) && !severeIds.has(a.id)).filter((a, i, all) => all.findIndex((x) => x.via_zh === a.via_zh) === i);
  const blocked = [...severeIds];

  let no = false;
  for (const a of main.filter((a, i, all) => all.findIndex((x) => x.id === a.id) === i)) { reasons.push({ k: "main", via: a.via }); no = true; }
  for (const a of severeSide.filter((a, i, all) => all.findIndex((x) => x.id === a.id) === i)) { reasons.push({ k: "severe", via: a.via }); no = true; }
  const veg = p.diets.includes("vegetarian") || p.diets.includes("vegan");
  const veganMiss = p.diets.includes("vegan") && d.allergens.some((a) => a.id === "egg" || a.id === "milk");
  if (veg && (!d.vegetarian || veganMiss)) { reasons.push({ k: "diet", what: "notVeg" }); no = true; }
  if ((p.diets.includes("no_pork") || p.diets.includes("halal")) && d.meat.includes("pork")) { reasons.push({ k: "diet", what: "pork" }); no = true; }
  if (p.diets.includes("no_beef") && d.meat.includes("beef")) { reasons.push({ k: "diet", what: "beef" }); no = true; }

  for (const a of removable) reasons.push({ k: "has", via: a.via });
  if ((p.diets.includes("halal") || p.diets.includes("no_alcohol")) && d.alcohol) reasons.push({ k: "diet", what: "alcohol" });
  // Meat outside a halal restaurant isn't halal even when it isn't pork.
  if (p.diets.includes("halal") && !no && d.meat.some((m) => LAND_MEAT.includes(m))) reasons.push({ k: "diet", what: "halalMeat" });
  // Until lard and meat stock are in the dish facts (R2), these diets never get a plain "ok".
  if (["vegetarian", "vegan", "halal", "no_pork"].some((x) => p.diets.includes(x)) && !no) reasons.push({ k: "diet", what: "hiddenAnimal" });
  if (p.diets.includes("no_spicy") && d.spice >= 2) reasons.push({ k: "diet", what: "spicy" });
  const restricted = p.allergens.length + p.diets.length > 0;
  if (restricted && d.confidence === "low" && !no) reasons.push({ k: "unsure" });

  const kind: VerdictKind = no ? "no" : reasons.length ? "ask" : "ok";
  return { kind, reasons, blocked, removable, confirm: kind === "ok" && p.severe.some((a) => p.allergens.includes(a)) };
}

/**
 * Allergens found when the detail loads are merged in, and the detail's ingredients go through
 * the word list too (猪油 makes the dish pork, 高汤 not vegetarian), so the verdict only gets stricter.
 */
export function withDetailAllergens(d: ListDish, ingredients: { zh: string; name: string; role: "main" | "sauce" | "garnish"; allergens: string[] }[]): ListDish {
  const extra = ingredients.flatMap((i) => i.allergens.map((id) => ({ id, role: i.role, via: i.name, via_zh: i.zh })))
    .filter((a) => !d.allergens.some((x) => x.id === a.id && (x.via_zh === a.via_zh || x.role === "main")));
  return tighten(extra.length ? { ...d, allergens: [...d.allergens, ...extra] } : d, ingredients);
}
