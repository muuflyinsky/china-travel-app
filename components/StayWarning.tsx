"use client";
import { TriangleAlert } from "lucide-react";
import { useProfile } from "./useProfile";
import { useT } from "./useT";
import { fmt } from "@/lib/i18n";
import { stayWindow } from "@/lib/stay";
import { UNILATERAL_UNTIL, visaRule } from "@/lib/visa";

/**
 * Legal warnings about the planned stay (SPEC v0.5 · P0-6), shown wherever dates appear:
 * a departure after the latest legal exit day, the 240-hour transit rules, and an arrival
 * after the unilateral visa-free policy currently ends.
 */
export function StayWarning({ transit = true, policy = true }: { transit?: boolean; policy?: boolean }) {
  const t = useT();
  const [p, , loaded] = useProfile();
  if (!loaded) return null;
  const w = stayWindow(p);
  const d = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString(p.lang, { timeZone: "UTC", day: "numeric", month: "long" });
  const rule = p.nationality ? visaRule(p.nationality, p.onwardThird) : null;
  const notes: { text: string; strong?: boolean }[] = [];
  if (w?.overstay) {
    notes.push({ strong: true, text: fmt(p.entryType === "visa" ? t.stay.overstayVisa : t.stay.overstayFree, { planned: d(w.planned), legal: d(w.legal) }) });
  }
  if (transit && p.entryType === "transit_240") notes.push({ text: t.stay.transitRules });
  if (policy && rule?.kind === "unilateral" && rule.until && p.arrival && p.arrival > UNILATERAL_UNTIL) {
    notes.push({ text: fmt(t.visa.expiry, { date: d(UNILATERAL_UNTIL) }) });
  }
  if (!notes.length) return null;
  return (
    <div className="space-y-2" role="alert">
      {notes.map((n) => (
        <p key={n.text} className={`flex gap-2 rounded-xl p-3 text-subhead ${n.strong ? "bg-danger-soft font-semibold text-danger" : "bg-warn-soft text-warn"}`}>
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{n.text}
        </p>
      ))}
    </div>
  );
}
