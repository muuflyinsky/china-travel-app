"use client";
import { useMemo } from "react";
import { Screen } from "@/components/Shell";
import { Section, Group, Field, Note, Seg } from "@/components/ui";
import { useProfile, type Mode } from "@/components/useProfile";
import { useT } from "@/components/useT";
import { LANGUAGES } from "@/lib/languages";
import { ALLERGENS, DIETS } from "@/lib/allergens";
import { UI_DICTS, fmt } from "@/lib/i18n";
import type { EntryType } from "@/lib/stay";
import { COUNTRIES, entryTypeFor, visaRule } from "@/lib/visa";

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "KRW", "AUD", "CAD", "SGD", "HKD", "CHF", "THB", "MYR", "NZD", "SEK", "INR", "BRL", "MXN", "RUB", "TRY", "IDR", "VND", "PHP"];
const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

export default function SettingsPage() {
  const t = useT();
  const [p, set, loaded] = useProfile();
  const countries = useMemo(() => {
    let name = (c: string) => c;
    try { const dn = new Intl.DisplayNames([p.lang, "en"], { type: "region" }); name = (c) => dn.of(c) ?? c; } catch {}
    return COUNTRIES.map((c) => ({ c, n: name(c) })).sort((a, b) => a.n.localeCompare(b.n, p.lang));
  }, [p.lang]);
  const derived = p.nationality ? entryTypeFor(visaRule(p.nationality, p.onwardThird)) : null;
  const uiLangs = LANGUAGES.filter((l) => l.code in UI_DICTS).map((l) => l.name).join(", ");

  return (
    <Screen title={t.settings.title} back>
      <Section title={t.settings.language}>
        <Group>
          <Field label={t.settings.language}>
            <select value={p.lang} onChange={(e) => set({ lang: e.target.value })}>
              {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
            </select>
          </Field>
          <Field label={t.settings.currency}>
            <select value={p.homeCurrency} onChange={(e) => set({ homeCurrency: e.target.value })}>
              {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
        </Group>
        <p className="px-1 text-[13px] text-muted">{fmt(t.settings.languageNote, { ui: uiLangs })}</p>
      </Section>

      <Section title={t.settings.trip} id="trip">
        <Seg value={p.mode ?? ("" as Mode)} onChange={(m) => set({ mode: m })} label={t.settings.mode}
          options={[{ value: "planning", label: t.mode.planning }, { value: "in_china", label: t.mode.inChina }]} />
        <Group>
          <Field label={t.settings.passport}>
            <select value={p.nationality} onChange={(e) => {
              const c = e.target.value;
              set({ nationality: c, onwardThird: null, ...(c ? { entryType: entryTypeFor(visaRule(c, null)) } : {}) });
            }}>
              <option value="">—</option>
              {loaded && countries.map(({ c, n }) => <option key={c} value={c}>{n}</option>)}
            </select>
          </Field>
          <Field label={t.settings.arrival}>
            <input type="date" value={p.arrival} onChange={(e) => set({ arrival: e.target.value })} />
          </Field>
          <Field label={t.settings.departure}>
            <input type="date" value={p.departure} min={p.arrival || undefined} onChange={(e) => set({ departure: e.target.value })} />
          </Field>
          <Field label={t.settings.entry}>
            <input type="date" value={p.entryDate} onChange={(e) => set({ entryDate: e.target.value })} />
          </Field>
          <Field label={t.settings.entryType}>
            <select value={p.entryType} onChange={(e) => set({ entryType: e.target.value as EntryType })}>
              {(Object.keys(t.settings.entryTypes) as EntryType[]).map((k) => <option key={k} value={k}>{t.settings.entryTypes[k]}</option>)}
            </select>
          </Field>
          {p.entryType === "visa" && (
            <Field label={t.settings.visaDays}>
              <input type="number" inputMode="numeric" min={1} max={180} value={p.visaDays} onChange={(e) => set({ visaDays: Number(e.target.value) || 30 })} />
            </Field>
          )}
        </Group>
        <p className="px-1 text-[13px] text-muted">
          {derived && p.entryType === derived && <>{fmt(t.settings.entryAuto, { type: t.settings.entryTypes[derived] })}. </>}
          {t.stay.checkStamp}
        </p>
      </Section>

      <Section title={t.settings.allergies} id="food" aside={<span className="text-[13px] text-muted">{t.settings.allergiesNote}</span>}>
        <div className="flex flex-wrap gap-2">
          {ALLERGENS.map((a) => (
            <button key={a.id} className="pill" aria-pressed={p.allergens.includes(a.id)} onClick={() => set({ allergens: toggle(p.allergens, a.id), allergiesAsked: true })}>
              {t.allergens[a.id]}
            </button>
          ))}
        </div>
      </Section>

      <Section title={t.settings.diet}>
        <div className="flex flex-wrap gap-2">
          {DIETS.map((d) => (
            <button key={d.id} className="pill" aria-pressed={p.diets.includes(d.id)} onClick={() => set({ diets: toggle(p.diets, d.id), allergiesAsked: true })}>
              {t.diets[d.id]}
            </button>
          ))}
        </div>
      </Section>

      <Section>
        <Note>{t.settings.privacy}</Note>
      </Section>
    </Screen>
  );
}
