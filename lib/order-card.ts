// The order card shown to restaurant staff (Simplified Chinese), shared by Eat and Explore:
// a severe allergy first, then the dishes, then other allergies; the traveller's language only
// in the collapsed explanation. Replies are pinned under the card (at most three).
import { ALLERGENS, allergyLinesZh, zhShort, type AllergenId } from "./allergens";
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

/**
 * What the order card asks staff, in big Chinese: can they make all of it, and is any dish one
 * where the allergen can't be left out (or that breaks the diet). Staff then mark the problem
 * dishes, several at once (components/OrderShowCard.tsx).
 */
export function orderAsk(p: Restrictions, n = 2) {
  const x = ALLERGENS.filter((a) => p.allergens.includes(a.id)).map(zhShort).join("、");
  const diet = p.diets.length > 0;
  // "Can every dish be made without X?": a yes is a clear promise the kitchen can act on, even for
  // a dish where the app didn't see X (so the card has no "不要放X" line for it).
  const problems = ["做不了", x && `${x}去不掉`, diet && "不符合我饮食要求"].filter(Boolean);
  return {
    q: n === 1
      ? `这道菜能做吗？${x ? `能不放${x}${diet ? "，也符合我的饮食要求" : ""}吗？` : diet ? "符合我的饮食要求吗？" : ""}`
      : `这些菜都能做吗？${x ? `每道菜都能不放${x}${diet ? "，也符合我的饮食要求" : ""}吗？` : diet ? "都符合我的饮食要求吗？" : ""}`,
    yes: x ? `${n === 1 ? "能做" : "都能做"}，${n === 1 ? "" : "都"}不放${x}${diet ? "，也符合要求" : ""}` : diet ? (n === 1 ? "能做，符合要求" : "都能做，都符合要求") : n === 1 ? "能做" : "都能做",
    some: "有问题，我来选",
    pick: `请点出${problems.join("，或者")}的菜（可以多选）：`,
    done: "选好了",
    unsure: x ? "不确定，要问厨房" : "",
    handoff: ["好的，谢谢！", "请把手机还给客人。"],
  };
}

/** `again`: staff marked dishes that are now out; the card says so before what's left. */
export function orderCard(t: Dict, p: Restrictions, items: OrderItem[], again = false) {
  const { severe, rest } = allergyLinesZh(p.allergens, p.diets, p.severe);
  const dishes = items.map((x) => `${x.name} ×${x.qty}`).join(", ");
  return {
    kind: "order",
    lead: severe || undefined,
    lines: [again ? "好的，有问题的那几道不要了。我点这些：" : "您好，我要点：", ...items.map((x) => `${x.zh} ×${x.qty}${x.without.length ? `（不要放${x.without.join("、")}）` : ""}`)],
    again,
    dishes: items.map((x) => ({ zh: x.zh, name: x.name, qty: x.qty })),
    ask: orderAsk(p, items.length),
    rest,
    explain: [fmt(t.eat.orderExplain, { dishes }), allergyExplain(t, p)].filter(Boolean).join(" "),
    replies: staffReplies(t, p, true),
  };
}
