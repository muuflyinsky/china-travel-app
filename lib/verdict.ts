// One answer per dish for the menu list (SPEC v0.5 P1.7 #26): can I order this, and why not.
// Red/amber/green are used for this verdict only.
import type { ListDish } from "./dishes";

export type VerdictKind = "ok" | "ask" | "no";
export type Reason =
  | { k: "main"; via: string }        // one of my allergens is a main ingredient
  | { k: "has"; via: string }         // one of my allergens is in the sauce or garnish
  | { k: "diet"; what: "notVeg" | "pork" | "beef" | "alcohol" | "spicy" }
  | { k: "unsure" };

export type Verdict = {
  kind: VerdictKind;
  reasons: Reason[];
  /** Severe allergens that are a main ingredient: the dish can't be added at all. */
  blocked: string[];
  /** My allergens that only come from sauce or garnish: "add, without X" is an option. */
  removable: { id: string; via: string; via_zh: string }[];
};

type Restrictions = { allergens: string[]; diets: string[]; severe: string[] };

export function verdict(d: ListDish, p: Restrictions): Verdict {
  const reasons: Reason[] = [];
  const mine = d.allergens.filter((a) => p.allergens.includes(a.id));
  // An allergen counts as main if any ingredient that brings it is main.
  const mainIds = new Set(mine.filter((a) => a.role === "main").map((a) => a.id));
  const main = mine.filter((a) => mainIds.has(a.id));
  // One entry per ingredient: soy sauce and bean paste both bring soy, and both get left out.
  const removable = mine.filter((a) => !mainIds.has(a.id)).filter((a, i, all) => all.findIndex((x) => x.via_zh === a.via_zh) === i);
  const blocked = [...mainIds].filter((id) => p.severe.includes(id));

  let no = false;
  for (const a of main.filter((a, i, all) => all.findIndex((x) => x.id === a.id) === i)) { reasons.push({ k: "main", via: a.via }); no = true; }
  const veg = p.diets.includes("vegetarian") || p.diets.includes("vegan");
  const veganMiss = p.diets.includes("vegan") && d.allergens.some((a) => a.id === "egg" || a.id === "milk");
  if (veg && (!d.vegetarian || veganMiss)) { reasons.push({ k: "diet", what: "notVeg" }); no = true; }
  if ((p.diets.includes("no_pork") || p.diets.includes("halal")) && d.meat.includes("pork")) { reasons.push({ k: "diet", what: "pork" }); no = true; }
  if (p.diets.includes("no_beef") && d.meat.includes("beef")) { reasons.push({ k: "diet", what: "beef" }); no = true; }

  for (const a of removable) reasons.push({ k: "has", via: a.via });
  if ((p.diets.includes("halal") || p.diets.includes("no_alcohol")) && d.alcohol) reasons.push({ k: "diet", what: "alcohol" });
  if (p.diets.includes("no_spicy") && d.spice >= 2) reasons.push({ k: "diet", what: "spicy" });
  const restricted = p.allergens.length + p.diets.length > 0;
  if (restricted && d.confidence === "low" && !no) reasons.push({ k: "unsure" });

  return { kind: no ? "no" : reasons.length ? "ask" : "ok", reasons, blocked, removable };
}

/** Allergens found when the detail loads are merged in, so the verdict only gets stricter. */
export function withDetailAllergens(d: ListDish, ingredients: { zh: string; name: string; role: "main" | "sauce" | "garnish"; allergens: string[] }[]): ListDish {
  const extra = ingredients.flatMap((i) => i.allergens.map((id) => ({ id, role: i.role, via: i.name, via_zh: i.zh })))
    .filter((a) => !d.allergens.some((x) => x.id === a.id && (x.via_zh === a.via_zh || x.role === "main")));
  return extra.length ? { ...d, allergens: [...d.allergens, ...extra] } : d;
}
