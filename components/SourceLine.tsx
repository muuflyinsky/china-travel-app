"use client";
import { BadgeCheck, Sparkles } from "lucide-react";
import { useProfile } from "./useProfile";
import { useT } from "./useT";
import { fmt } from "@/lib/i18n";

/**
 * Where a piece of content comes from, in one footnote line, the same everywhere (v0.6):
 * a named source and the day it was checked, or — for anything a model wrote — "Written by AI"
 * and the day it was generated. AI text is never shown as checked.
 */
export function SourceLine({ ai, name, href, date, extra }: {
  ai?: boolean; name: React.ReactNode; href?: string; date?: string; extra?: React.ReactNode;
}) {
  const t = useT();
  const [p] = useProfile();
  const day = date && new Date(date.length === 10 ? `${date}T00:00:00Z` : date)
    .toLocaleDateString(p.lang, { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" });
  const label = href && name ? <a href={href} target="_blank" rel="noopener" className="underline">{name}</a> : name;
  const Icon = ai ? Sparkles : BadgeCheck;
  // "{name}" can sit anywhere in the sentence (ja/ko put it first), and the name may be a link.
  const [before, after = ""] = (ai ? t.src.ai : t.src.source).split("{name}");
  return (
    <p className="flex items-start gap-1.5 px-1 text-footnote text-muted">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="min-w-0">
        {before}{label}{after}
        {day && <> · {fmt(ai ? t.src.updated : t.src.checked, { date: day })}</>}
        {extra && <> · {extra}</>}
      </span>
    </p>
  );
}
