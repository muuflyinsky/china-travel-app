// The order card shown to restaurant staff (Simplified Chinese), shared by Eat and Explore:
// a severe allergy first, then the dishes, then other allergies; the traveller's language only
// in the collapsed explanation. Replies are pinned under the card (at most three).
import { allergyLinesZh, type AllergenId } from "./allergens";
import { fmt, type Dict } from "./i18n";
import type { StaffReply } from "@/components/ShowCard";

type Restrictions = { allergens: string[]; diets: string[]; severe: string[] };
export type OrderItem = { zh: string; name: string; qty: number; without: string[] };

export function staffReplies(t: Dict, p: Restrictions, withCant: boolean): StaffReply[] {
  return [
    { zh: "可以，没问题", mine: t.eat.replyOk },
    ...(withCant ? [{ zh: "这道菜做不了", mine: t.eat.replyCant }] : []),
    ...(p.allergens.length ? [{ zh: "里面有您过敏的东西", mine: t.eat.replyContainsAny }] : []),
  ];
}

export function allergyExplain(t: Dict, p: Restrictions) {
  const mine = p.allergens.map((a) => t.allergens[a as AllergenId].toLowerCase());
  return mine.length ? fmt(t.eat.orderExplainAllergy, { allergens: mine.join(", ") }) : "";
}

export function orderCard(t: Dict, p: Restrictions, items: OrderItem[]) {
  const { severe, rest } = allergyLinesZh(p.allergens, p.diets, p.severe);
  const dishes = items.map((x) => `${x.name} ×${x.qty}`).join(", ");
  return {
    kind: "order",
    lead: severe || undefined,
    lines: ["您好，我要点：", ...items.map((x) => `${x.zh} ×${x.qty}${x.without.length ? `（不要放${x.without.join("、")}）` : ""}`)],
    rest,
    explain: [fmt(t.eat.orderExplain, { dishes }), allergyExplain(t, p)].filter(Boolean).join(" "),
    replies: staffReplies(t, p, true),
  };
}
