"use client";
import { useEffect, useState } from "react";
import { DemoBadge } from "@/components/DemoBadge";
import { goLink, CITY_EN } from "@/lib/affiliate";
import { amapNav } from "@/lib/maplinks";
import type { Place } from "@/lib/amap";

const iso = (d: Date) => d.toISOString().slice(0, 10);
const plus = (days: number) => iso(new Date(Date.now() + days * 864e5));

export default function StayPage() {
  const [city, setCity] = useState("上海");
  const [checkin, setCheckin] = useState(plus(7));
  const [checkout, setCheckout] = useState(plus(9));
  const [adults, setAdults] = useState(2);
  const [area, setArea] = useState("");
  const [hotels, setHotels] = useState<Place[]>([]);
  const [demo, setDemo] = useState(false);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const qs = new URLSearchParams({ q: area ? `${area} 酒店` : "酒店", city, types: "100100" });
    const r = await fetch(`/api/places?${qs}`);
    const d = await r.json();
    setHotels(d.places ?? []); setDemo(d.demo); setLoading(false);
  }
  useEffect(() => { load(); }, [city]); // eslint-disable-line react-hooks/exhaustive-deps

  const base = { city, checkin, checkout, adults };

  return (
    <>
      <h1>Places to stay</h1>
      <p className="muted">Compare on Trip.com — English, foreign cards, and a filter for hotels licensed to host foreign guests.</p>

      <div className="card stack" style={{ marginTop: 12 }}>
        <label className="field">City
          <select value={city} onChange={(e) => setCity(e.target.value)}>
            {Object.entries(CITY_EN).map(([zh, en]) => <option key={zh} value={zh}>{en} · {zh}</option>)}
          </select>
        </label>
        <div className="grid2">
          <label className="field">Check-in<input type="date" value={checkin} onChange={(e) => setCheckin(e.target.value)} /></label>
          <label className="field">Check-out<input type="date" value={checkout} onChange={(e) => setCheckout(e.target.value)} /></label>
        </div>
        <div className="grid2">
          <label className="field">Guests<input type="number" min={1} max={8} value={adults} onChange={(e) => setAdults(+e.target.value)} /></label>
          <label className="field">Area / landmark<input value={area} placeholder="e.g. 外滩, 王府井" onChange={(e) => setArea(e.target.value)} onBlur={load} /></label>
        </div>
        <a className="btn primary block" href={goLink("trip", "hotel_list", base, "stay_search")} target="_blank">Search hotels on Trip.com</a>
        <a className="btn block" href={goLink("fliggy", "hotel_list", { ...base, keyword: area }, "stay_search")} target="_blank">Search on Fliggy 飞猪 (Chinese)</a>
      </div>

      <div className="banner warn" style={{ marginTop: 12 }}>
        🛂 Bring your passport. Hotels must register foreign guests with the police on check-in; budget guesthouses sometimes can’t. If staying with friends, register at the local police station within 24 h.
      </div>

      <h2>Hotels in {CITY_EN[city] ?? city}{area && ` near ${area}`}</h2>
      <DemoBadge show={demo} what="AMAP_KEY" />
      {loading && <p className="muted">Loading…</p>}
      <div className="stack">
        {hotels.map((h) => (
          <div key={h.id} className="card row" style={{ alignItems: "flex-start" }}>
            {h.photo ? <img className="thumb" src={h.photo} alt="" /> : <div className="thumb" />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 className="zh">{h.name}</h3>
              <div className="small">{h.pinyin}</div>
              <div className="small muted">
                {h.rating && `★ ${h.rating}`} {h.cost && ` · from ~¥${h.cost}`} {h.type.split(";")[2] && ` · ${h.type.split(";")[2]}`}
              </div>
              <div className="row wrap" style={{ marginTop: 8 }}>
                <a className="btn primary sm" target="_blank" href={goLink("trip", "hotel_search", { ...base, keyword: h.name }, "stay_card")}>Check price</a>
                <a className="btn sm" target="_blank" href={amapNav(h, "car")}>Map</a>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="small muted" style={{ marginTop: 16 }}>We may earn a commission when you book through these links, at no extra cost to you.</p>
    </>
  );
}
