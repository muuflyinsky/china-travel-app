"use client";
import { useEffect, useState } from "react";
import { Preloader } from "konsta/react";
import { BedDouble, Star, ExternalLink } from "lucide-react";
import { Screen, DemoNote } from "@/components/Shell";
import { Section, Group, Field, Note } from "@/components/ui";
import { AppIcon } from "@/components/AppIcon";
import { CityPicker } from "@/components/CityPicker";
import { useCity } from "@/components/useCity";
import { useProfile } from "@/components/useProfile";
import { useFx, formatMoney } from "@/components/useFx";
import { useT } from "@/components/useT";
import { goLink } from "@/lib/affiliate";
import { amapNav } from "@/lib/maplinks";
import { fmt } from "@/lib/i18n";
import { addDays, daysBetween, todayIso } from "@/lib/stay";
import type { Place } from "@/lib/amap";

const plus = (days: number) => addDays(todayIso(), days);

export default function StayPage() {
  const t = useT();
  const [profile, setProfile, loaded] = useProfile();
  const fx = useFx(profile.homeCurrency);
  const { city, setCity, detect } = useCity();
  const [checkin, setCheckin] = useState(plus(7));
  const [checkout, setCheckout] = useState(plus(9));
  const adults = profile.guests;
  const setAdults = (n: number) => setProfile({ guests: n });
  const [area, setArea] = useState("");
  const [hotels, setHotels] = useState<Place[]>([]);
  const [demo, setDemo] = useState(false);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const qs = new URLSearchParams({ q: area ? `${area} 酒店` : "酒店", city: city.a, types: "100100" });
    const r = await fetch(`/api/places?${qs}`);
    const d = await r.json();
    setHotels(d.places ?? []); setDemo(d.demo); setLoading(false);
  }
  useEffect(() => { load(); }, [city.a]); // eslint-disable-line react-hooks/exhaustive-deps
  // Default to the trip dates the traveller already gave us, if they are still ahead.
  useEffect(() => {
    if (!loaded) return;
    const today = todayIso();
    if (profile.arrival && profile.arrival >= today) {
      setCheckin(profile.arrival);
      setCheckout(profile.departure > profile.arrival ? profile.departure : addDays(profile.arrival, 2));
    }
  }, [loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const nights = Math.max(1, daysBetween(checkin, checkout));
  const base = { city: city.s, cityEn: city.e, checkin, checkout, adults };
  const price = (cny: string) => {
    const home = fx && profile.homeCurrency !== "CNY" ? ` (≈ ${formatMoney(Number(cny) / fx.value, profile.homeCurrency, profile.lang)})` : "";
    return fmt(t.stay.from, { price: `¥${cny}${home}` });
  };

  return (
    <Screen title={t.stay.title}>
      <Section>
        <CityPicker value={city} onChange={setCity} onLocate={detect} label={t.stay.city} />
        <Group>
          <Field label={t.stay.checkIn}><input type="date" value={checkin} onChange={(e) => setCheckin(e.target.value)} /></Field>
          <Field label={fmt(t.stay.checkOut, { n: nights })}><input type="date" value={checkout} onChange={(e) => setCheckout(e.target.value)} /></Field>
          <Field label={t.stay.guests}><input type="number" inputMode="numeric" min={1} max={8} value={adults} onChange={(e) => setAdults(Number(e.target.value) || 1)} /></Field>
          <Field label={t.stay.near}><input type="text" placeholder={t.stay.nearPlaceholder} value={area} onChange={(e) => setArea(e.target.value)} onBlur={load} /></Field>
        </Group>
        <a href={goLink("trip", "hotel_list", base, "stay_search")} target="_blank" rel="noopener" className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-cta px-4 text-headline text-cta-ink">
          <AppIcon id="tripcom" size={28} /> {t.stay.searchTrip} <ExternalLink className="h-4 w-4" aria-hidden />
        </a>
        <a href={goLink("fliggy", "hotel_list", { ...base, keyword: area }, "stay_search")} target="_blank" rel="noopener" className="flex min-h-11 items-center justify-center gap-2 text-subhead font-semibold text-cobalt">
          <AppIcon id="fliggy" size={22} /> {t.stay.searchFliggy}
        </a>
        <Note>{t.stay.passportNote}</Note>
      </Section>

      <Section title={<>{fmt(t.stay.hotelsIn, { city: city.e })}{area && ` · ${area}`}</>}>
        <DemoNote show={demo} what={t.common.mapKey} />
        {loading && <div className="flex justify-center py-6"><Preloader /></div>}
        {!loading && hotels.length === 0 && <p className="px-1 text-subhead text-muted">{t.stay.none}</p>}
        {hotels.map((h) => (
          <div key={h.id} className="flex gap-3 rounded-2xl border border-line bg-card p-3">
            {h.photo
              ? <img className="h-20 w-20 shrink-0 rounded-xl object-cover" src={h.photo} alt="" />
              : <span className="grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-cobalt-soft text-cobalt"><BedDouble className="h-7 w-7" aria-hidden /></span>}
            <div className="min-w-0 flex-1">
              <h3 className="zh text-body font-semibold">{h.name}</h3>
              <p className="truncate text-footnote text-muted">{h.pinyin}</p>
              <p className="mt-1 flex flex-wrap items-center gap-1 text-footnote">
                {h.rating && <><Star className="h-3.5 w-3.5 fill-current text-ink" aria-hidden /><b>{h.rating}</b></>}
                {h.cost && <span className="text-muted">· {price(h.cost)}</span>}
              </p>
              <div className="mt-2 flex gap-2">
                <a target="_blank" rel="noopener" href={goLink("trip", "hotel_search", { ...base, keyword: h.name }, "stay_card")} className="flex min-h-11 flex-1 items-center justify-center rounded-xl bg-cobalt-soft text-subhead font-semibold text-cobalt">{t.stay.checkPrice}</a>
                <a target="_blank" rel="noopener" href={amapNav(h, "car")} aria-label={fmt(t.stay.onMap, { name: h.name })} className="grid min-h-11 w-11 place-items-center rounded-xl bg-cobalt-soft"><AppIcon id="amap" size={24} /></a>
              </div>
            </div>
          </div>
        ))}
        <p className="px-1 text-footnote text-muted">{t.common.commission}</p>
      </Section>
    </Screen>
  );
}
