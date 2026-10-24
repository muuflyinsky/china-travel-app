import { AppIcon } from "./AppIcon";
import type { Award } from "@/lib/restaurant-awards";

// Guide symbols for award badges. The Michelin ones are drawn here after the guide's own symbols
// (star, Bib Gourmand face, the plate for Selected) in Michelin red: a brand mark, not one of the
// app's semantic colours. Must-Eat uses the real Dianping app icon, as there is no 必吃榜 asset.
const RED = "#c4262e";

export function MichelinStar({ size = 16 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden className="shrink-0">
      {[0, 60, 120].map((r) => <rect key={r} x="8.6" y="1.5" width="6.8" height="21" rx="3.4" fill={RED} transform={`rotate(${r} 12 12)`} />)}
      <circle cx="12" cy="12" r="2.3" fill="#fff" />
    </svg>
  );
}

export function BibGourmand({ size = 16 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden className="shrink-0">
      <circle cx="12" cy="12" r="11" fill={RED} />
      <ellipse cx="8.6" cy="9.6" rx="1.6" ry="2.2" fill="#fff" />
      <ellipse cx="15.4" cy="9.6" rx="1.6" ry="2.2" fill="#fff" />
      <path d="M6.8 14.2q5.2 5.2 10.4 0" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <circle cx="15" cy="16.6" r="1.7" fill="#ffb4b4" />
    </svg>
  );
}

export function MichelinPlate({ size = 16 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden className="shrink-0">
      <circle cx="12" cy="12" r="11" fill={RED} />
      <g stroke="#fff" strokeWidth="1.4" strokeLinecap="round" fill="none">
        <path d="M7.6 5.8v3.6M9.1 5.8v3.6M10.6 5.8v3.6M7.6 9.4q1.5 1.6 3 0M9.1 10.4v7.8" />
        <path d="M15.2 5.8q2.4 2 1.2 6.6h-1.2zM15.2 12.4v5.8" />
      </g>
    </svg>
  );
}

/** The symbol for one award; Michelin stars repeat once per star. */
export function AwardIcon({ a, size = 16 }: { a: Award; size?: number }) {
  if (a.list === "michelin") {
    if (a.level === "bib") return <BibGourmand size={size} />;
    if (a.level === "selected") return <MichelinPlate size={size} />;
    return <span className="inline-flex">{Array.from({ length: Number(a.level) }, (_, i) => <MichelinStar key={i} size={size} />)}</span>;
  }
  if (a.list === "dianping") return <AppIcon id="dianping" size={size} className="border-0" />;
  return null;
}
