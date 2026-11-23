"use client";
import { ShowCard } from "./ShowCard";
import { useProfile } from "./useProfile";
import { useT } from "./useT";
import { allergyLinesZh } from "@/lib/allergens";

/** The full-screen allergy card for staff (always free, D3): Talk and the Today shortcut. */
export function AllergyShowCard({ onClose }: { onClose: () => void }) {
  const t = useT();
  const [p] = useProfile();
  const { severe, rest } = allergyLinesZh(p.allergens, p.diets, p.severe);
  return <ShowCard kind="allergy" lead={severe || undefined} lines={["您好！我有饮食限制，麻烦您帮忙确认，谢谢！"]} rest={rest}
    replies={[{ zh: "可以，没问题", mine: t.eat.replyOk }, { zh: "里面有您过敏的东西", mine: t.eat.replyContainsAny }]} onClose={onClose} />;
}
