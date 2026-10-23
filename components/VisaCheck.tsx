"use client";
import { useEffect, useMemo, useState } from "react";
import { Popup, Searchbar } from "konsta/react";
import { Check, ExternalLink, X, TriangleAlert } from "lucide-react";
import { Card, Button, Seg } from "./ui";
import { useProfile } from "./useProfile";
import { useT } from "./useT";
import { fmt } from "@/lib/i18n";
import { COUNTRIES, SOURCE, VERIFIED_ON, currencyFor, entryTypeFor, guessCountry, visaRule } from "@/lib/visa";
import { daysBetween } from "@/lib/stay";

export function useCountryName(lang: string) {
  return useMemo(() => {
    try {
      const dn = new Intl.DisplayNames([lang, "en"], { type: "region" });
      return (code: string) => dn.of(code) ?? code;
    } catch {
      return (code: string) => code;
    }
  }, [lang]);
}

export function CountryPicker({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (c: string) => void }) {
  const t = useT();
  const [p] = useProfile();
  const name = useCountryName(p.lang);
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const all = COUNTRIES.map((c) => ({ c, n: name(c) })).sort((a, b) => a.n.localeCompare(b.n, p.lang));
    const k = q.trim().toLowerCase();
    return k ? all.filter((x) => x.n.toLowerCase().includes(k) || x.c.toLowerCase() === k) : all;
  }, [q, name, p.lang]);
  return (
    <Popup opened={open} onBackdropClick={onClose}>
      <div className="flex h-full flex-col bg-porcelain">
        <div className="flex items-center justify-between px-4 pt-[calc(12px+env(safe-area-inset-top))]">
          <h2 className="text-title text-ink">{t.settings.passport}</h2>
          <button onClick={onClose} aria-label={t.common.close} className="grid h-11 w-11 place-items-center rounded-full bg-card"><X className="h-5 w-5" /></button>
        </div>
        <Searchbar value={q} placeholder={t.visa.search} onInput={(e: React.ChangeEvent<HTMLInputElement>) => setQ(e.target.value)} onClear={() => setQ("")} disableButton={false} />
        <ul className="mx-4 mb-8 flex-1 divide-y divide-line overflow-auto rounded-2xl border border-line bg-card">
          {/* Country names come from the browser's ICU data, so only render them on the client. */}
          {open && list.map(({ c, n }) => (
            <li key={c}><button onClick={() => { onPick(c); onClose(); setQ(""); }} className="flex min-h-12 w-full items-center px-4 text-left text-body text-ink">{n}</button></li>
          ))}
        </ul>
      </div>
    </Popup>
  );
}

/**
 * Visa-free check: confirm a guessed nationality (usually one tap), ask one follow-up only for
 * transit-only passports, then show a result card. Also sets the stay countdown's entry type.
 */
export function VisaCheck() {
  const t = useT();
  const [p, set] = useProfile();
  const name = useCountryName(p.lang);
  const [guess, setGuess] = useState<string | null>(null);
  const [picker, setPicker] = useState(false);
  useEffect(() => { setGuess(guessCountry()); }, []);

  const choose = (c: string) => {
    const rule = visaRule(c, null);
    set({ nationality: c, onwardThird: null, homeCurrency: currencyFor(c), entryType: entryTypeFor(rule) });
  };
  const rule = p.nationality ? visaRule(p.nationality, p.onwardThird) : null;
  useEffect(() => {
    if (rule && p.entryType !== entryTypeFor(rule)) set({ entryType: entryTypeFor(rule) });
  }, [rule?.kind]); // eslint-disable-line react-hooks/exhaustive-deps

  // Step 1 — confirm the passport.
  if (!p.nationality) {
    return (
      <Card>
        <h3 className="text-headline">{t.visa.title}</h3>
        {guess ? (
          <>
            <p className="mt-2 text-body">{fmt(t.visa.confirm, { country: name(guess) })}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button onClick={() => choose(guess)}><Check className="h-5 w-5" aria-hidden />{t.visa.yes}</Button>
              <Button variant="soft" onClick={() => setPicker(true)}>{t.visa.change}</Button>
            </div>
          </>
        ) : (
          <Button className="mt-3 w-full" onClick={() => setPicker(true)}>{t.visa.search}</Button>
        )}
        <p className="mt-2 text-footnote text-muted">{t.visa.ordinary}</p>
        <CountryPicker open={picker} onClose={() => setPicker(false)} onPick={choose} />
      </Card>
    );
  }

  // Step 2 — only for passports that qualify for 240-hour transit and nothing else.
  if (rule!.transitOnly && p.onwardThird === null) {
    return (
      <Card>
        <h3 className="text-headline">{t.visa.onwardQ}</h3>
        <p className="mt-1 text-subhead text-muted">{t.visa.onwardSub}</p>
        <div className="mt-3">
          <Seg value={"" as "yes" | "no" | ""} onChange={(v) => set({ onwardThird: v === "yes" })}
            options={[{ value: "yes", label: t.visa.onwardYes }, { value: "no", label: t.visa.onwardNo }]} />
        </div>
      </Card>
    );
  }

  // Step 3 — result.
  const r = rule!;
  const headline =
    r.kind === "unilateral" ? fmt(t.visa.result.unilateral, { n: r.days })
    : r.kind === "mutual" ? fmt(t.visa.result.mutual, { n: r.days })
    : r.kind === "transit240" ? t.visa.result.transit240
    : t.visa.result.visa;
  const conditions =
    r.kind === "unilateral" ? [t.visa.cond.ordinary, t.visa.cond.purposes]
    : r.kind === "mutual" ? [t.visa.cond.ordinary, t.visa.cond.mutual90]
    : r.kind === "transit240" ? [t.visa.cond.onward, t.visa.cond.ports, t.visa.cond.ordinary]
    : [t.visa.cond.applyVisa, t.visa.cond.transit24];
  const max = r.kind === "visa" ? null : r.days;
  const tripDays = p.arrival && p.departure ? daysBetween(p.arrival, p.departure) : null;
  const tooLong = max !== null && tripDays !== null && tripDays > max;
  const until = r.kind === "unilateral" ? r.until : null;
  const afterExpiry = Boolean(until && p.arrival && p.arrival > until);
  const fmtDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString(p.lang, { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" });

  return (
    <Card>
      <div className="flex items-center justify-between gap-2">
        <p className="text-footnote text-muted">{t.visa.title} · {name(p.nationality)}</p>
        <button onClick={() => setPicker(true)} className="min-h-11 text-subhead font-semibold text-cobalt">{t.visa.change}</button>
      </div>
      <p className={`text-title ${r.kind === "visa" ? "text-ink" : "text-cobalt"}`}>{headline}</p>
      <ul className="mt-3 space-y-1.5 text-subhead">
        {conditions.slice(0, 3).map((c) => <li key={c} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-cobalt" aria-hidden />{c}</li>)}
      </ul>
      {(afterExpiry || tooLong) && (
        <p className="mt-3 flex gap-2 rounded-xl bg-warn-soft p-3 text-subhead text-warn">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>
            {afterExpiry && fmt(t.visa.expiry, { date: fmtDate(until!) })}
            {afterExpiry && tooLong && " "}
            {tooLong && fmt(t.visa.tooLong, { n: tripDays!, max: max! })}
          </span>
        </p>
      )}
      <a href={SOURCE.url} target="_blank" rel="noopener" className="mt-3 flex min-h-11 items-center gap-1 text-footnote text-muted">
        {fmt(t.visa.source, { source: SOURCE.name, date: fmtDate(VERIFIED_ON) })} <ExternalLink className="h-3.5 w-3.5" aria-hidden />
      </a>
      <CountryPicker open={picker} onClose={() => setPicker(false)} onPick={choose} />
    </Card>
  );
}
