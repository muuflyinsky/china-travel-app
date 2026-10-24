"use client";
import { useT } from "./useT";
import { AwardIcon } from "./AwardIcon";
import { fmt } from "@/lib/i18n";
import { awardScore, type Award } from "@/lib/restaurant-awards";

/** Guide award badges, best first: the guide's symbol plus its name. The tag itself stays neutral. */
export function AwardBadges({ awards }: { awards?: Award[] }) {
  const t = useT();
  if (!awards?.length) return null;
  const label = (a: Award) =>
    a.list === "michelin"
      ? a.level === "bib" ? t.awards.bib : a.level === "selected" ? t.awards.selected : fmt(t.awards.michelin, { stars: "" }).trim()
      : a.list === "black_pearl" ? fmt(t.awards.blackPearl, { d: "◆".repeat(Number(a.level)) })
      : fmt(t.awards.mustEat, { year: a.edition === "sample" ? "" : a.edition }).trim();
  const sorted = [...awards].sort((a, b) => awardScore([b]) - awardScore([a]));
  return (
    <span className="mt-1 flex flex-wrap gap-1">
      {sorted.map((a) => (
        <span key={a.list + a.level} className="tag"
          aria-label={a.list === "michelin" && /^\d$/.test(a.level) ? fmt(t.awards.stars, { n: a.level }) : undefined}>
          <AwardIcon a={a} size={14} />{label(a)}
        </span>
      ))}
    </span>
  );
}
