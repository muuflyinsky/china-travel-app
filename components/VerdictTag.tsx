"use client";
import { useT } from "./useT";
import { fmt, type Dict } from "@/lib/i18n";
import type { Reason, Verdict, VerdictKind } from "@/lib/verdict";

// "Can I order this?" for one dish: OK / ask first / don't order. Red/amber/green only here.
export const VERDICT_TONE: Record<VerdictKind, string> = { ok: "tag-ok", ask: "tag-warn", no: "tag-danger" };

export function reasonText(t: Dict, r: Reason) {
  if (r.k === "main") return fmt(t.eat.reasonMain, { x: r.via });
  if (r.k === "has") return fmt(t.eat.reasonHas, { x: r.via });
  if (r.k === "unsure") return t.eat.reasonUnsure;
  return { notVeg: t.eat.notVeg, pork: t.eat.pork, beef: t.eat.beef, alcohol: t.eat.cookedAlcohol, spicy: t.eat.spicy }[r.what];
}

export function VerdictTag({ v }: { v: Verdict }) {
  const t = useT();
  const label = { ok: t.eat.verdictOk, ask: t.eat.verdictAsk, no: t.eat.verdictNo }[v.kind];
  const why = v.reasons.slice(0, 2).map((r) => reasonText(t, r)).join(", ");
  return (
    // Wraps rather than truncates: the reason is the point (#26).
    <span className={`tag ${VERDICT_TONE[v.kind]} max-w-full rounded-control! py-1!`}>
      <span className="line-clamp-2">{label}{why && ` · ${why}`}</span>
    </span>
  );
}
