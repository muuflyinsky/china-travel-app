"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Preloader } from "konsta/react";
import { MapPin, Minus, Plus, ExternalLink, Check, TrainFront, Sparkles } from "lucide-react";
import { Screen, DemoNote } from "@/components/Shell";
import { Section, Group, Field, Note, Seg } from "@/components/ui";
import { EditSheet } from "@/components/EditSheet";
import { CityPicker } from "@/components/CityPicker";
import { FeaturedHotel, HotelRow, useHotelPicks } from "@/components/HotelPicks";
import { useGuide } from "@/components/CityGuide";
import { pick } from "@/lib/city-guide-types";
import { useCity } from "@/components/useCity";
import { useProfile } from "@/components/useProfile";
import { useFx, formatMoney } from "@/components/useFx";
import { useT } from "@/components/useT";
import { goLink } from "@/lib/affiliate";
import { fmt } from "@/lib/i18n";
import { addDays, daysBetween, todayIso } from "@/lib/stay";
import { TIER_IDS, type TierId } from "@/lib/hotel-tiers";
import type { City } from "@/lib/cities";

type CityLite = { a: string; e: string; s: string };
const asCity = (c: CityLite): City => ({ n: c.s, s: c.s, a: c.a, e: c.e, p: "", py: "", t: "city" });

function Stay() {
  const t = useT();
  const params = useSearchParams();
  const [profile, setProfile, loaded] = useProfile();
  const { city: here } = useCity();
  const fx = useFx(profile.homeCurrency);

  // City: a link from Today (?city=) → the first trip city → where the traveller is now.
  const [city, setCity] = useState<CityLite | null>(null);
  const [checkin, setCheckin] = useState(addDays(todayIso(), 7));
  const [checkout, setCheckout] = useState(addDays(todayIso(), 9));
  const [tier, setTier] = useState<TierId>("comfort");
  const [edit, setEdit] = useState(false);
  useEffect(() => {
    if (!loaded) return;
    const a = params.get("city");
    setCity(a ? { a, s: params.get("name") ?? "", e: params.get("en") ?? "" } : profile.cities[0] ?? { a: here.a, e: here.e, s: here.s });
    if (profile.arrival && profile.arrival >= todayIso()) {
      setCheckin(profile.arrival);
      setCheckout(profile.departure > profile.arrival ? profile.departure : addDays(profile.arrival, 2));
    }
  }, [loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // A trip city with its own dates fills them in (from today if the stay has already started).
  useEffect(() => {
    const tc = profile.cities.find((x) => x.a === city?.a);
    if (!tc?.from || !tc.to || tc.to <= todayIso()) return;
    const start = tc.from > todayIso() ? tc.from : todayIso();
    setCheckin(start);
    setCheckout(tc.to > start ? tc.to : addDays(start, 1));
  }, [city?.a, profile.cities]);

  const c = city ?? { a: here.a, e: here.e, s: here.s };
  // Areas first (SPEC v0.5): 2–3 places first-time visitors stay, from the city guide.
  const { g: guide } = useGuide(c.a);
  const areas = guide?.areas ?? [];
  const [areaIdx, setAreaIdx] = useState(0);
  useEffect(() => setAreaIdx(0), [c.a]);
  const area = areas[areaIdx];
  const { data, error } = useHotelPicks(c.a, c.s, area?.location);
  const nights = Math.max(1, daysBetween(checkin, checkout));
  const guests = profile.guests;
  const link = { city: c.s, cityEn: c.e, checkin, checkout, adults: guests };
  const fmtDay = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString(profile.lang, { timeZone: "UTC", day: "numeric", month: "short" });

  const range = useMemo(() => {
    const b = data?.bounds ?? [400, 800, 1500];
    const [lo, hi] = { economy: [0, b[0]], comfort: [b[0], b[1]], upscale: [b[1], b[2]], luxury: [b[2], null] }[tier] as [number, number | null];
    const n = (x: number) => x.toLocaleString(profile.lang);
    const cny = hi === null ? `¥${n(lo)}+` : `¥${n(lo)}–${n(hi)}`;
    if (!fx || profile.homeCurrency === "CNY") return cny;
    const home = (x: number) => formatMoney(x / fx.value, profile.homeCurrency, profile.lang);
    return `${cny} · ≈ ${hi === null ? `${home(lo)}+` : `${home(lo)}–${home(hi)}`}`;
  }, [data, tier, fx, profile.homeCurrency, profile.lang]);

  // An empty tier never dead-ends: show the nearest tier that has picks (cheaper first on a tie) and say so.
  const shownTier = useMemo<TierId>(() => {
    if (!data || data.tiers[tier].length) return tier;
    const i = TIER_IDS.indexOf(tier);
    for (let d = 1; d < TIER_IDS.length; d++) {
      for (const j of [i - d, i + d]) if (TIER_IDS[j] && data.tiers[TIER_IDS[j]].length) return TIER_IDS[j];
    }
    return tier;
  }, [data, tier]);
  const picks = data?.tiers[shownTier] ?? [];
  const [top, ...rest] = picks;
  const tagBase = `stay-${area ? `a${areaIdx + 1}-` : ""}${shownTier}`;

  return (
    <Screen title={t.stay.title}>
      <Section>
        <button onClick={() => setEdit(true)} className="flex min-h-14 w-full items-center gap-3 rounded-2xl border border-line bg-card px-4 py-2 text-left">
          <MapPin className="h-5 w-5 shrink-0 text-cobalt" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block text-headline">{c.e} <span className="zh font-normal text-muted">{c.s}</span></span>
            <span className="block text-footnote text-muted">
              {fmtDay(checkin)} – {fmtDay(checkout)} · {nights === 1 ? t.stay.night1 : fmt(t.stay.nightsN, { n: nights })} · {guests === 1 ? t.stay.guest1 : fmt(t.stay.guestsN, { n: guests })}
            </span>
          </span>
          <span className="text-subhead font-semibold text-cobalt">{t.common.edit}</span>
        </button>
      </Section>

      {areas.length > 0 && (
        <Section title={t.stay.whereToStay} aside={<span className="flex items-center gap-1 text-footnote text-muted"><Sparkles className="h-3.5 w-3.5" aria-hidden />{t.stay.aiPick}</span>}>
          <Group>
            {areas.map((a, i) => (
              <li key={a.zh}>
                <button onClick={() => setAreaIdx(i)} aria-pressed={i === areaIdx} className="flex w-full items-start gap-3 px-4 py-3 text-left">
                  <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 ${i === areaIdx ? "border-cobalt bg-cobalt text-white dark:text-porcelain" : "border-line"}`}>
                    {i === areaIdx && <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-body">{pick(a.name, profile.lang)} <span className="zh text-muted">{a.zh}</span></span>
                    {i === areaIdx && <span className="mt-0.5 block text-footnote text-muted">{pick(a.reason, profile.lang)}</span>}
                    <span className="mt-0.5 flex items-center gap-1 text-footnote text-muted"><TrainFront className="h-3.5 w-3.5 text-cobalt" aria-hidden />{fmt(t.stay.metroCount, { n: a.metro })}</span>
                  </span>
                </button>
              </li>
            ))}
          </Group>
        </Section>
      )}

      <Section>
        <Seg value={tier} onChange={setTier} label={t.stay.priceRange} options={TIER_IDS.map((id) => ({ value: id, label: t.stay.tiers[id] }))} />
        <p className="px-1 text-footnote text-muted tabular-nums">{fmt(t.stay.perNight, { price: range })}</p>
        <DemoNote show={data?.demo} what={t.common.mapKey} />
        {!data && !error && <div className="flex justify-center py-8"><Preloader /></div>}
        {error && <Note tone="warn">{t.stay.picksDown}</Note>}
        {data && shownTier !== tier && <Note>{fmt(t.stay.tierFallback, { tier: t.stay.tiers[tier], other: t.stay.tiers[shownTier] })}</Note>}
        {data && !top && <p className="px-1 text-subhead text-muted">{t.stay.noneTier}</p>}
        {top && <FeaturedHotel h={top} label={fmt(t.stay.pick, { tier: t.stay.tiers[shownTier] })} link={link} tag={`${tagBase}-1`} />}
        {rest.length > 0 && <Group>{rest.map((h, i) => <HotelRow key={h.id} h={h} link={link} tag={`${tagBase}-${i + 2}`} />)}</Group>}
      </Section>

      <Section>
        <a href={goLink("trip", "hotel_list", link, "stay_all", "stay-all")} target="_blank" rel="noopener" className="flex min-h-11 items-center gap-1 px-1 text-subhead font-semibold text-cobalt">
          {fmt(t.stay.allTrip, { city: c.e })} <ExternalLink className="h-4 w-4" aria-hidden />
        </a>
        <p className="px-1 text-footnote text-muted">
          {t.stay.howWePick}
          {data && !data.demo && <> {fmt(t.stay.updated, { date: fmtDay(data.generatedAt.slice(0, 10)) })}</>}
        </p>
        <p className="px-1 text-footnote text-muted">{t.common.commission}</p>
        <Note>{t.stay.passportNote}</Note>
      </Section>

      <EditSheet open={edit} title={t.stay.trip} onClose={() => setEdit(false)}>
        <CityPicker value={asCity(c)} label={t.stay.city} onChange={(x) => setCity({ a: x.a, e: x.e, s: x.s })} />
        <Group>
          <Field label={t.stay.checkIn}><input type="date" value={checkin} onChange={(e) => setCheckin(e.target.value)} /></Field>
          <Field label={fmt(t.stay.checkOut, { n: nights })}><input type="date" value={checkout} min={checkin} onChange={(e) => setCheckout(e.target.value)} /></Field>
          <li className="flex min-h-14 items-center gap-3 px-4">
            <span className="flex-1 text-body">{t.stay.guests}</span>
            <button onClick={() => setProfile({ guests: Math.max(1, guests - 1) })} aria-label={t.stay.guestLess} className="grid h-11 w-11 place-items-center rounded-full bg-cobalt-soft text-cobalt"><Minus className="h-5 w-5" /></button>
            <span className="w-6 text-center text-headline tabular-nums" aria-live="polite">{guests}</span>
            <button onClick={() => setProfile({ guests: Math.min(8, guests + 1) })} aria-label={t.stay.guestMore} className="grid h-11 w-11 place-items-center rounded-full bg-cobalt-soft text-cobalt"><Plus className="h-5 w-5" /></button>
          </li>
        </Group>
      </EditSheet>
    </Screen>
  );
}

export default function StayPage() {
  return <Suspense><Stay /></Suspense>;
}
