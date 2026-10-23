"use client";
import { useT } from "./useT";
import { fmt } from "@/lib/i18n";
import { awardScore, type Award } from "@/lib/restaurant-awards";

/** Text badges for guide awards (no logos), best first. Neutral colour: red/green/amber and gold are reserved. */
export function AwardBadges({ awards }: { awards?: Award[] }) {
  const t = useT();
  if (!awards?.length) return null;
  const label = (a: Award) =>
    a.list === "michelin"
      ? a.level === "bib" ? t.awards.bib : a.level === "selected" ? t.awards.selected : fmt(t.awards.michelin, { stars: "★".repeat(Number(a.level)) })
      : a.list === "black_pearl" ? fmt(t.awards.blackPearl, { d: "◆".repeat(Number(a.level)) })
      : fmt(t.awards.mustEat, { year: a.edition === "sample" ? "" : a.edition }).trim();
  const sorted = [...awards].sort((a, b) => awardScore([b]) - awardScore([a]));
  return (
    <span className="mt-1 flex flex-wrap gap-1">
      {sorted.map((a) => <span key={a.list + a.level} className="tag">{label(a)}</span>)}
    </span>
  );
}
