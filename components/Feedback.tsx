"use client";
import { useEffect, useState } from "react";
import { Flag, ThumbsDown, ThumbsUp } from "lucide-react";
import { useProfile } from "./useProfile";
import { useT } from "./useT";

export type FeedbackKind = "sight" | "guide_dish" | "menu_dish" | "resv";
type Vote = "yes" | "no";

const key = (kind: string, id: string, version: string) => `ctg.fb.${kind}.${id}.${version}`;
const read = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch {} };

/**
 * One feedback row for any piece of content (v0.6): helpful yes/no, and a report that it's
 * outdated or wrong. No free text and no traveller id: this browser remembers its own vote per
 * content version, and a changed vote is sent with the previous one so counts stay deduplicated.
 */
export function Feedback({ kind, id, version, city, reportLabel, onReport }: {
  kind: FeedbackKind; id: string; version: string; city?: string;
  /** Wording of the report link, e.g. "This dish info is wrong"; defaults to "Report outdated info". */
  reportLabel?: string;
  /** Extra work when reported (the menu reader also drops the dish from its cache). */
  onReport?: () => void;
}) {
  const t = useT();
  const [p] = useProfile();
  const k = key(kind, id, version);
  const [vote, setVote] = useState<Vote | null>(null);
  const [reported, setReported] = useState(false);
  useEffect(() => { setVote(read(k) as Vote | null); setReported(read(`${k}.r`) === "1"); }, [k]);

  const send = (body: object) => fetch("/api/feedback", {
    method: "POST", headers: { "content-type": "application/json" }, keepalive: true,
    body: JSON.stringify({ kind, id, version, city, lang: p.lang, ...body }),
  }).catch(() => {});

  function cast(v: Vote) {
    if (v === vote) return;
    send({ vote: v, prev: vote });
    setVote(v); write(k, v);
  }
  function report() {
    send({ report: kind === "menu_dish" ? "wrong" : "outdated" });
    setReported(true); write(`${k}.r`, "1");
    onReport?.();
  }

  const btn = (v: Vote, Icon: typeof ThumbsUp, label: string) => (
    <button onClick={() => cast(v)} aria-pressed={vote === v} aria-label={label}
      className={`flex min-h-touch items-center gap-1 px-2 font-semibold ${vote === v ? "text-cobalt" : "text-muted"}`}>
      <Icon className={`h-4 w-4 ${vote === v ? "fill-current" : ""}`} aria-hidden />{label}
    </button>
  );

  return (
    <div className="-ml-2 flex flex-wrap items-center text-footnote text-muted">
      <span className="pl-2">{vote ? t.fb.thanks : t.fb.ask}</span>
      {btn("yes", ThumbsUp, t.fb.yes)}
      {btn("no", ThumbsDown, t.fb.no)}
      {reported ? <span className="px-2" role="status">{t.fb.reported}</span> : (
        <button onClick={report} className="flex min-h-touch items-center gap-1 px-2">
          <Flag className="h-3.5 w-3.5" aria-hidden />{reportLabel ?? t.fb.outdated}
        </button>
      )}
    </div>
  );
}
