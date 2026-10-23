"use client";
import { Plug, GlassWater, HandCoins, IdCard, ScrollText } from "lucide-react";
import { useT } from "../useT";

export function GoodToKnow() {
  const t = useT();
  const items = [
    [Plug, t.prepare.goodItems.plug], [GlassWater, t.prepare.goodItems.water], [HandCoins, t.prepare.goodItems.tip],
    [IdCard, t.prepare.goodItems.passport], [ScrollText, t.prepare.goodItems.tissues],
  ] as const;
  return (
    <ul className="space-y-2">
      {items.map(([Icon, text]) => (
        <li key={text} className="flex gap-3 text-subhead"><Icon className="mt-0.5 h-5 w-5 shrink-0 text-cobalt" aria-hidden />{text}</li>
      ))}
    </ul>
  );
}
