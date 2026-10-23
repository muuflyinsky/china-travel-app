"use client";
import { Screen } from "@/components/Shell";
import { Section, Group, Field, Note } from "@/components/ui";
import { useProfile, type Mode } from "@/components/useProfile";
import { useT } from "@/components/useT";
import { LANGUAGES } from "@/lib/languages";
import { ALLERGENS, DIETS } from "@/lib/allergens";
import { UI_DICTS, fmt } from "@/lib/i18n";
import type { EntryType } from "@/lib/stay";

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "KRW", "AUD", "CAD", "SGD", "HKD", "CHF", "THB", "MYR", "NZD", "SEK", "INR", "BRL", "MXN", "RUB", "TRY", "IDR", "VND", "PHP"];
const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

export default function SettingsPage() {
  const t = useT();
  const [p, set] = useProfile();
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
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t.settings.mode}>
          {(["planning", "in_china"] as Mode[]).map((m) => (
            <button key={m} role="radio" aria-checked={p.mode === m} onClick={() => set({ mode: m })}
              className={`min-h-12 rounded-2xl border px-3 text-[15px] font-semibold ${p.mode === m ? "border-cobalt bg-cobalt text-white dark:text-[#12141c]" : "border-line bg-card"}`}>
              {m === "planning" ? t.mode.planning : t.mode.inChina}
            </button>
          ))}
        </div>
        <Group>
          <Field label={t.settings.arrival}>
            <input type="date" value={p.arrival} onChange={(e) => set({ arrival: e.target.value })} />
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
        <p className="px-1 text-[13px] text-muted">{t.stay.checkStamp}</p>
      </Section>

      <Section title={t.settings.allergies} id="food" aside={<span className="text-[13px] text-muted">{t.settings.allergiesNote}</span>}>
        <div className="flex flex-wrap gap-2">
          {ALLERGENS.map((a) => (
            <button key={a.id} className="pill" aria-pressed={p.allergens.includes(a.id)} onClick={() => set({ allergens: toggle(p.allergens, a.id) })}>
              {t.allergens[a.id]}
            </button>
          ))}
        </div>
      </Section>

      <Section title={t.settings.diet}>
        <div className="flex flex-wrap gap-2">
          {DIETS.map((d) => (
            <button key={d.id} className="pill" aria-pressed={p.diets.includes(d.id)} onClick={() => set({ diets: toggle(p.diets, d.id) })}>
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
