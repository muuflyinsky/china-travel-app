"use client";
import { useEffect, useState } from "react";
import { Check, Plus, X, Trash2 } from "lucide-react";
import { Screen } from "@/components/Shell";
import { Section, Group, Row, Field, Note } from "@/components/ui";
import { EditSheet } from "@/components/EditSheet";
import { AppIcon } from "@/components/AppIcon";
import { CountryPicker, useCountryName } from "@/components/VisaCheck";
import { CityPicker } from "@/components/CityPicker";
import { useProfile, type TripCity } from "@/components/useProfile";
import { useT } from "@/components/useT";
import { LANGUAGES, langName } from "@/lib/languages";
import { ALLERGENS, COMMON_ALLERGENS, DIETS } from "@/lib/allergens";
import { DEFAULT_CITY } from "@/lib/cities";
import { fmt } from "@/lib/i18n";
import { stayWindow, type EntryType } from "@/lib/stay";
import { StayWarning } from "@/components/StayWarning";
import { currencyFor, entryTypeFor, visaRule } from "@/lib/visa";
import pkg from "@/package.json";

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "KRW", "AUD", "CAD", "SGD", "HKD", "CHF", "THB", "MYR", "NZD", "SEK", "INR", "BRL", "MXN", "RUB", "TRY", "IDR", "VND", "PHP"];
const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
type Sheet = "passport" | "language" | "currency" | "dates" | "entry" | "cities" | "allergies" | "diet" | "earn" | "privacy" | "ride";
const SHEETS: Sheet[] = ["passport", "language", "currency", "dates", "entry", "cities", "allergies", "diet", "earn", "privacy"];

/** A row's current value, right-aligned and truncated. */
const Value = ({ children }: { children: React.ReactNode }) => <span className="max-w-[55%] truncate text-right text-body text-muted">{children}</span>;

function ChoiceList<T extends string>({ items, value, onPick }: { items: { value: T; label: React.ReactNode }[]; value: T; onPick: (v: T) => void }) {
  return (
    <Group>
      {items.map((i) => (
        <li key={i.value}>
          <button onClick={() => onPick(i.value)} aria-pressed={i.value === value} className="flex min-h-12 w-full items-center px-4 text-left text-body">
            <span className="flex-1">{i.label}</span>
            {i.value === value && <Check className="h-5 w-5 text-cobalt" aria-hidden />}
          </button>
        </li>
      ))}
    </Group>
  );
}

export default function SettingsPage() {
  const t = useT();
  const [p, set, loaded] = useProfile();
  const country = useCountryName(p.lang);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [moreAllergens, setMoreAllergens] = useState(false);
  // Deep links such as /settings#dates open the matching editor.
  useEffect(() => {
    const h = location.hash.slice(1) as Sheet;
    if (SHEETS.includes(h)) setSheet(h);
  }, []);
  const close = () => { setSheet(null); if (location.hash) history.replaceState(null, "", location.pathname); };

  const list = (xs: string[]) => { try { return new Intl.ListFormat(p.lang, { type: "unit" }).format(xs); } catch { return xs.join(", "); } };
  const fmtDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString(p.lang, { timeZone: "UTC", day: "numeric", month: "short" });
  const dates = p.arrival ? `${fmtDate(p.arrival)} – ${p.departure ? fmtDate(p.departure) : "…"}` : t.settings.add;
  const overstay = Boolean(stayWindow(p)?.overstay);
  const derived = p.nationality ? entryTypeFor(visaRule(p.nationality, p.onwardThird)) : null;
  const entryValue = t.settings.entryTypes[p.entryType];
  const allergyValue = p.allergens.length
    ? list(ALLERGENS.filter((a) => p.allergens.includes(a.id)).map((a) => `${t.allergens[a.id]}${p.severe.includes(a.id) ? ` · ${t.settings.severeShort}` : ""}`))
    : t.settings.none;
  const dietValue = p.diets.length ? list(DIETS.filter((d) => p.diets.includes(d.id)).map((d) => t.diets[d.id])) : t.settings.none;
  const shown = moreAllergens ? ALLERGENS : ALLERGENS.slice(0, COMMON_ALLERGENS);

  function clearAll() {
    if (!confirm(t.settings.clearConfirm)) return;
    try { Object.keys(localStorage).filter((k) => k.startsWith("ctg.")).forEach((k) => localStorage.removeItem(k)); } catch {}
    location.href = "/";
  }

  return (
    <Screen title={t.settings.title} back>
      <Section title={t.settings.you}>
        <Group>
          <Row onClick={() => setSheet("passport")} title={t.settings.passport} after={<Value>{loaded && p.nationality ? country(p.nationality) : t.settings.add}</Value>} />
          <Row onClick={() => setSheet("language")} title={t.settings.language} after={<Value>{langName(p.lang)}</Value>} />
          <Row onClick={() => setSheet("currency")} title={t.settings.currency} after={<Value>{p.homeCurrency}</Value>} />
        </Group>
      </Section>

      <Section title={t.settings.trip}>
        <Group>
          <Row onClick={() => setSheet("dates")} title={t.settings.dates} after={<Value>{dates}</Value>}
            sub={overstay ? <span className="font-semibold text-danger">{t.settings.datesOverstay}</span> : undefined} />
          <Row onClick={() => setSheet("entry")} title={t.settings.entryType}
            sub={derived && p.entryType === derived ? t.settings.fromPassport : undefined} after={<Value>{entryValue}</Value>} />
          <Row onClick={() => setSheet("cities")} title={t.settings.cities} after={<Value>{p.cities.length ? list(p.cities.map((c) => c.e)) : t.settings.add}</Value>} />
          <Row onClick={() => setSheet("ride")} title={t.settings.rideApp} after={<Value>{p.rideApp === "didi" ? "DiDi" : "Amap"}</Value>} />
        </Group>
      </Section>

      <Section title={t.settings.food}>
        <Note>{t.settings.privacy}</Note>
        <Group>
          <Row onClick={() => setSheet("allergies")} title={t.settings.allergies} after={<Value>{allergyValue}</Value>} />
          <Row onClick={() => setSheet("diet")} title={t.settings.diet} after={<Value>{dietValue}</Value>} />
        </Group>
      </Section>

      <Section title={t.settings.about}>
        <Group>
          <Row onClick={() => setSheet("earn")} title={t.settings.howWeEarn} />
          <Row onClick={() => setSheet("privacy")} title={t.settings.privacyTitle} />
          <Row title={t.settings.version} after={<Value>{pkg.version}</Value>} chevron={false} />
        </Group>
      </Section>

      <Section>
        <Group>
          <li>
            <button onClick={clearAll} className="flex min-h-12 w-full items-center justify-center gap-2 px-4 text-body text-danger">
              <Trash2 className="h-5 w-5" aria-hidden />{t.settings.clear}
            </button>
          </li>
        </Group>
      </Section>

      {/* ---- editors ---- */}
      <CountryPicker open={sheet === "passport"} onClose={close} onPick={(c) => {
        set({ nationality: c, onwardThird: null, entryType: entryTypeFor(visaRule(c, null)), homeCurrency: currencyFor(c) });
      }} />

      <EditSheet open={sheet === "language"} title={t.settings.language} onClose={close}>
        <ChoiceList items={LANGUAGES.map((l) => ({ value: l.code as string, label: l.name }))} value={p.lang} onPick={(lang) => set({ lang })} />
      </EditSheet>

      <EditSheet open={sheet === "currency"} title={t.settings.currency} onClose={close}>
        {p.nationality && currencyFor(p.nationality) === p.homeCurrency && <p className="px-1 text-footnote text-muted">{t.settings.fromPassport}</p>}
        <ChoiceList items={CURRENCIES.map((c) => ({ value: c, label: c }))} value={p.homeCurrency} onPick={(homeCurrency) => set({ homeCurrency })} />
      </EditSheet>

      <EditSheet open={sheet === "dates"} title={t.settings.dates} onClose={close}>
        <Group>
          <Field label={t.settings.arrival}><input type="date" value={p.arrival} onChange={(e) => set({ arrival: e.target.value })} /></Field>
          <Field label={t.settings.departure}><input type="date" value={p.departure} min={p.arrival || undefined} onChange={(e) => set({ departure: e.target.value })} /></Field>
        </Group>
        <p className="px-1 text-footnote text-muted">{t.settings.datesNote}</p>
        {/* Shown as soon as the departure date is past the legal limit, not later on Today. */}
        <StayWarning />
      </EditSheet>

      <EditSheet open={sheet === "entry"} title={t.settings.entryType} onClose={close}>
        <ChoiceList value={p.entryType} onPick={(v: EntryType) => set({ entryType: v })}
          items={(Object.keys(t.settings.entryTypes) as EntryType[]).map((k) => ({ value: k, label: t.settings.entryTypes[k] }))} />
        {derived && <p className="px-1 text-footnote text-muted">{fmt(t.settings.entryAuto, { type: t.settings.entryTypes[derived] })}</p>}
        <Group>
          {p.entryType === "visa" && (
            <Field label={t.settings.visaDays}>
              <input type="number" inputMode="numeric" min={1} max={180} value={p.visaDays} onChange={(e) => set({ visaDays: Number(e.target.value) || 30 })} />
            </Field>
          )}
          <Field label={t.settings.entry}>
            <input type="date" value={p.entryDate || p.arrival} onChange={(e) => set({ entryDate: e.target.value })} />
          </Field>
        </Group>
        <p className="px-1 text-footnote text-muted">{t.stay.checkStamp}</p>
        <StayWarning policy={false} />
      </EditSheet>

      <EditSheet open={sheet === "cities"} title={t.settings.cities} onClose={close}>
        <Group>
          {p.cities.map((c) => {
            const patch = (x: Partial<TripCity>) => set({ cities: p.cities.map((y) => (y.a === c.a ? { ...y, ...x } : y)) });
            return (
              <li key={c.a} className="py-1 pl-4">
                <div className="flex min-h-12 items-center gap-2">
                  <span className="flex-1 text-body">{c.e} <span className="zh text-muted">{c.s}</span></span>
                  <button onClick={() => set({ cities: p.cities.filter((x) => x.a !== c.a) })} aria-label={`${t.common.close}: ${c.e}`} className="grid h-11 w-11 place-items-center text-muted"><X className="h-5 w-5" /></button>
                </div>
                {/* Optional: lets Today pick the right city on each day of the trip. */}
                <div className="flex items-center gap-2 pr-4 pb-2 text-subhead text-muted">
                  <input type="date" aria-label={`${c.e}: ${t.settings.cityFrom}`} value={c.from ?? ""} min={p.arrival || undefined} max={p.departure || undefined}
                    onChange={(e) => patch({ from: e.target.value || undefined })} className="min-w-0 flex-1 rounded-lg bg-porcelain px-2 py-1.5 text-ink" />
                  –
                  <input type="date" aria-label={`${c.e}: ${t.settings.cityTo}`} value={c.to ?? ""} min={c.from || p.arrival || undefined} max={p.departure || undefined}
                    onChange={(e) => patch({ to: e.target.value || undefined })} className="min-w-0 flex-1 rounded-lg bg-porcelain px-2 py-1.5 text-ink" />
                </div>
              </li>
            );
          })}
          <li>
            <CityPicker value={DEFAULT_CITY} label={t.settings.addCity}
              onChange={(c) => { if (!p.cities.some((x) => x.a === c.a)) set({ cities: [...p.cities, { a: c.a, e: c.e, s: c.s, n: c.n, p: c.p }] }); }}
              trigger={(open) => (
                <button onClick={open} className="flex min-h-12 w-full items-center gap-2 px-4 text-body text-cobalt"><Plus className="h-5 w-5" aria-hidden />{t.settings.addCity}</button>
              )} />
          </li>
        </Group>
        <p className="px-1 text-footnote text-muted">{t.settings.cityDatesNote}</p>
      </EditSheet>

      <EditSheet open={sheet === "allergies"} title={t.settings.allergies} onClose={close}>
        <p className="px-1 text-subhead text-muted">{t.settings.allergiesNote}</p>
        <div className="flex flex-wrap gap-2">
          {shown.map((a) => (
            <button key={a.id} className="pill" aria-pressed={p.allergens.includes(a.id)}
              onClick={() => set({ allergens: toggle(p.allergens, a.id), severe: p.severe.filter((x) => x !== a.id), allergiesAsked: true })}>
              {t.allergens[a.id]}
            </button>
          ))}
        </div>
        <button onClick={() => setMoreAllergens(!moreAllergens)} className="flex min-h-11 items-center px-1 text-subhead font-semibold text-cobalt">
          {moreAllergens ? t.settings.fewer : t.settings.more}
        </button>
        {p.allergens.length > 0 && (
          <Group>
            {ALLERGENS.filter((a) => p.allergens.includes(a.id)).map((a) => (
              <li key={a.id} className="flex min-h-14 items-center gap-3 px-4 py-2">
                <span className="min-w-0 flex-1">
                  <span className="block text-body">{t.allergens[a.id]}</span>
                  <span className="block text-footnote text-muted">{t.settings.severe}</span>
                </span>
                <input type="checkbox" className="h-6 w-6 accent-[var(--danger)]" checked={p.severe.includes(a.id)}
                  aria-label={`${t.allergens[a.id]}: ${t.settings.severe}`} onChange={() => set({ severe: toggle(p.severe, a.id) })} />
              </li>
            ))}
          </Group>
        )}
      </EditSheet>

      <EditSheet open={sheet === "diet"} title={t.settings.diet} onClose={close}>
        <div className="flex flex-wrap gap-2">
          {DIETS.map((d) => (
            <button key={d.id} className="pill" aria-pressed={p.diets.includes(d.id)} onClick={() => set({ diets: toggle(p.diets, d.id), allergiesAsked: true })}>
              {t.diets[d.id]}
            </button>
          ))}
        </div>
      </EditSheet>

      <EditSheet open={sheet === "ride"} title={t.settings.rideApp} onClose={close}>
        <Group>
          {(["amap", "didi"] as const).map((id) => (
            <Row key={id} onClick={() => set({ rideApp: id })} icon={<AppIcon id={id} size={32} />} title={id === "didi" ? "DiDi · 滴滴出行" : "Amap · 高德地图"}
              after={p.rideApp === id ? <Check className="h-5 w-5 text-cobalt" aria-hidden /> : undefined} chevron={false} />
          ))}
        </Group>
        <p className="px-1 text-footnote text-muted">{t.settings.rideAppNote}</p>
      </EditSheet>

      <EditSheet open={sheet === "earn"} title={t.settings.howWeEarn} onClose={close}>
        <p className="text-body">{t.settings.howWeEarnBody}</p>
      </EditSheet>

      <EditSheet open={sheet === "privacy"} title={t.settings.privacyTitle} onClose={close}>
        <p className="text-body">{t.settings.privacyBody}</p>
      </EditSheet>
    </Screen>
  );
}
