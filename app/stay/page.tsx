"use client";
import { useEffect, useState } from "react";
import { BlockTitle, List, ListInput, Preloader } from "konsta/react";
import { BedDouble, Star, Map, IdCard, ExternalLink } from "lucide-react";
import { Screen, DemoNote } from "@/components/Shell";
import { goLink } from "@/lib/affiliate";
import { CityPicker } from "@/components/CityPicker";
import { useCity } from "@/components/useCity";
import { amapNav } from "@/lib/maplinks";
import type { Place } from "@/lib/amap";

const iso = (d: Date) => d.toISOString().slice(0, 10);
const plus = (days: number) => iso(new Date(Date.now() + days * 864e5));

type Change = React.ChangeEvent<HTMLInputElement & HTMLSelectElement>;

export default function StayPage() {
  const { city, setCity, detect } = useCity();
  const [checkin, setCheckin] = useState(plus(7));
  const [checkout, setCheckout] = useState(plus(9));
  const [adults, setAdults] = useState(2);
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

  const nights = Math.max(1, Math.round((+new Date(checkout) - +new Date(checkin)) / 864e5));
  const base = { city: city.s, cityEn: city.e, checkin, checkout, adults };

  return (
    <Screen title="Stay">
      <List strong inset className="mt-1!">
        <li className="p-2"><CityPicker value={city} onChange={setCity} onLocate={detect} label="City" /></li>
        <ListInput type="date" label="Check-in" value={checkin} onChange={(e: Change) => setCheckin(e.target.value)} />
        <ListInput type="date" label={`Check-out · ${nights} night${nights > 1 ? "s" : ""}`} value={checkout} onChange={(e: Change) => setCheckout(e.target.value)} />
        <ListInput type="number" label="Guests" value={adults} min={1} max={8} onChange={(e: Change) => setAdults(+e.target.value)} />
        <ListInput type="text" label="Near (optional)" placeholder="外滩, 王府井, Jing’an…" value={area} onChange={(e: Change) => setArea(e.target.value)} onBlur={load} />
      </List>

      <div className="mx-4 space-y-2">
        <a href={goLink("trip", "hotel_list", base, "stay_search")} target="_blank" className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-cta text-[17px] font-semibold text-cta-ink">
          Search hotels on Trip.com <ExternalLink className="h-4 w-4" aria-hidden />
        </a>
        <a href={goLink("fliggy", "hotel_list", { ...base, keyword: area }, "stay_search")} target="_blank" className="flex min-h-11 items-center justify-center text-[15px] font-semibold text-cobalt">
          Or search Fliggy 飞猪 (Chinese only)
        </a>
      </div>

      <p className="mx-4 mt-2 flex gap-2 rounded-2xl bg-cobalt-soft p-3 text-[15px]">
        <IdCard className="mt-0.5 h-5 w-5 shrink-0 text-cobalt" aria-hidden />
        <span>Hotels register foreign guests with the police at check-in, so bring your passport. Some budget guesthouses can’t host foreigners — Trip.com marks the ones that can.</span>
      </p>

      <BlockTitle>Hotels in {city.e}{area && ` near ${area}`}</BlockTitle>
      <DemoNote show={demo} what="AMAP_KEY" />
      {loading && <div className="flex justify-center py-6"><Preloader /></div>}
      {!loading && hotels.length === 0 && <p className="mx-4 text-[15px] text-muted">No hotels found here. Try a different area, or search Trip.com directly.</p>}

      <ul className="mx-4 space-y-3">
        {hotels.map((h) => (
          <li key={h.id} className="flex gap-3 rounded-2xl border border-line bg-card p-3">
            {h.photo
              ? <img className="h-20 w-20 shrink-0 rounded-xl object-cover" src={h.photo} alt="" />
              : <span className="grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-cobalt-soft text-cobalt"><BedDouble className="h-7 w-7" aria-hidden /></span>}
            <div className="min-w-0 flex-1">
              <h3 className="zh text-[17px] leading-snug font-semibold">{h.name}</h3>
              <p className="truncate text-[13px] text-muted">{h.pinyin}</p>
              <p className="mt-1 flex items-center gap-1 text-[13px]">
                {h.rating && <><Star className="h-3.5 w-3.5 fill-current text-ink" aria-hidden /><b>{h.rating}</b></>}
                {h.cost && <span className="text-muted"> · from ~¥{h.cost}</span>}
              </p>
              <div className="mt-2 flex gap-2">
                <a target="_blank" href={goLink("trip", "hotel_search", { ...base, keyword: h.name }, "stay_card")} className="flex h-10 flex-1 items-center justify-center rounded-xl bg-cta text-[15px] font-semibold text-cta-ink">Check price</a>
                <a target="_blank" href={amapNav(h, "car")} aria-label={`${h.name} on the map`} className="grid h-10 w-11 place-items-center rounded-xl bg-cobalt-soft text-cobalt"><Map className="h-4 w-4" aria-hidden /></a>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <p className="mx-4 mt-4 text-[13px] text-muted">We may earn a commission when you book through these links, at no extra cost to you.</p>
    </Screen>
  );
}
