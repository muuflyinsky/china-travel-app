import { Award as AwardMark, BadgeCheck, Star, Utensils } from "lucide-react";
import type { Award } from "@/lib/restaurant-awards";

// Award badges use neutral lucide icons next to the guide's name in text ("MICHELIN Bib Gourmand").
// We don't draw the guides' own symbols (Michelin's star and Bib Gourmand face, the Dianping app
// icon): they are trademarks (App Review 5.2). Ink colour, not Michelin red.
const cls = "shrink-0 text-ink";

export function MichelinStar({ size = 16 }: { size?: number }) {
  return <Star width={size} height={size} className={`${cls} fill-current`} aria-hidden />;
}

export function BibGourmand({ size = 16 }: { size?: number }) {
  return <AwardMark width={size} height={size} className={cls} aria-hidden />;
}

export function MichelinPlate({ size = 16 }: { size?: number }) {
  return <Utensils width={size} height={size} className={cls} aria-hidden />;
}

/** The icon for one award; Michelin stars repeat once per star. The text label says which guide. */
export function AwardIcon({ a, size = 16 }: { a: Award; size?: number }) {
  if (a.list === "michelin") {
    if (a.level === "bib") return <BibGourmand size={size} />;
    if (a.level === "selected") return <MichelinPlate size={size} />;
    return <span className="inline-flex">{Array.from({ length: Number(a.level) }, (_, i) => <MichelinStar key={i} size={size} />)}</span>;
  }
  if (a.list === "dianping") return <BadgeCheck width={size} height={size} className={cls} aria-hidden />;
  return null;
}
