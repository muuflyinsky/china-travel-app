"use client";
import { useState } from "react";
import { ShowCard } from "@/components/ShowCard";
import { DemoBadge } from "@/components/DemoBadge";
import { amapNav, appleNav } from "@/lib/maplinks";
import type { Place, RouteOption } from "@/lib/amap";

type Here = { location: string; city: string; citycode: string; address: string };

const NEARBY = [
  { label: "🚇 Metro", q: "地铁站" },
  { label: "🚻 Toilet", q: "公共厕所" },
  { label: "💊 Pharmacy", q: "药店" },
  { label: "🏧 ATM", q: "ATM" },
  { label: "🏪 Convenience", q: "便利店" },
  { label: "🏥 Hospital", q: "医院" },
];

const MODE_ICON = { transit: "🚇", walking: "🚶", driving: "🚕" } as const;

export default function GoPage() {
  const [here, setHere] = useState<Here | null>(null);
  const [city, setCity] = useState("上海");
  const [q, setQ] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);
  const [dest, setDest] = useState<Place | null>(null);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [demo, setDemo] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState<string>();
  const [card, setCard] = useState<string[] | null>(null);

  async function locate() {
    setBusy("locating"); setError(undefined);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const r = await fetch(`/api/regeo?lng=${pos.coords.longitude}&lat=${pos.coords.latitude}`);
        const d = await r.json();
        if (r.ok) { setHere(d); setCity(d.city.replace(/市$/, "")); } else setError(d.error);
        setBusy("");
      },
      () => {
        // Fallback for desktop / denied permission: use the city centre.
        setHere({ location: "121.4737,31.2304", city: "上海市", citycode: "021", address: "人民广场 People's Square (approx.)" });
        setError("Location unavailable — using People's Square, Shanghai.");
        setBusy("");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function search(keyword: string, nearby = false) {
    setBusy("search"); setError(undefined); setDest(null); setRoutes([]);
    const qs = new URLSearchParams({ q: keyword });
    if (nearby && here) qs.set("around", here.location); else qs.set("city", city);
    const r = await fetch(`/api/places?${qs}`);
    const d = await r.json();
    if (r.ok) { setPlaces(d.places); setDemo(d.demo); } else setError(d.error);
    setBusy("");
  }

  async function choose(p: Place) {
    setDest(p); setPlaces([]); setRoutes([]);
    if (!here) return;
    setBusy("route");
    const qs = new URLSearchParams({ origin: here.location, destination: p.location, citycode: here.citycode, destCitycode: p.citycode || here.citycode });
    const r = await fetch(`/api/route?${qs}`);
    const d = await r.json();
    if (r.ok) setRoutes(d.routes); else setError(d.error);
    setBusy("");
  }

  const taxiCard = (p: Place) => ["师傅您好，请带我去：", p.name, `地址：${p.address}`];

  return (
    <>
      <h1>Get around</h1>
      <p className="muted">Search in English, pinyin or Chinese. Routes come from Amap (高德), the map locals use.</p>

      <div className="card stack" style={{ marginTop: 12 }}>
        <div className="row">
          <button className="btn" onClick={locate} disabled={busy === "locating"}>📍 {here ? "Update" : "Use my location"}</button>
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City, e.g. 北京 / Beijing" style={{ flex: 1 }} />
        </div>
        {here && <div className="small muted zh">You are near: {here.address}</div>}
        <form className="row" onSubmit={(e) => { e.preventDefault(); if (q.trim()) search(q.trim()); }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Where to? e.g. The Bund, 豫园, Hongqiao station" />
          <button className="btn primary">Go</button>
        </form>
        <div className="row wrap">
          {NEARBY.map((n) => (
            <button key={n.q} className="chip toggle" disabled={!here} onClick={() => search(n.q, true)} title={here ? "" : "Use my location first"}>{n.label}</button>
          ))}
        </div>
      </div>

      {error && <div className="banner warn" style={{ marginTop: 12 }}>{error}</div>}
      {busy === "search" && <p className="muted">Searching…</p>}
      <div style={{ marginTop: 12 }}><DemoBadge show={demo} what="AMAP_KEY" /></div>

      {places.length > 0 && (
        <div className="stack" style={{ marginTop: 12 }}>
          {places.map((p) => (
            <button key={p.id} className="card" style={{ textAlign: "left", width: "100%", font: "inherit", color: "inherit", cursor: "pointer" }} onClick={() => choose(p)}>
              <div className="row spread"><h3 className="zh">{p.name}</h3>{p.distance && <span className="small muted">{p.distance} m</span>}</div>
              <div className="small">{p.pinyin}</div>
              <div className="small muted zh">{p.address}</div>
            </button>
          ))}
        </div>
      )}

      {dest && (
        <div className="card stack" style={{ marginTop: 12 }}>
          <div>
            <h2 style={{ margin: 0 }} className="zh">{dest.name}</h2>
            <div className="small">{dest.pinyin}</div>
            <div className="small muted zh">{dest.address}</div>
          </div>
          <div className="row wrap">
            <a className="btn primary sm" href={amapNav(dest, "bus")} target="_blank">Open in Amap</a>
            <a className="btn sm" href={appleNav(dest, "r")} target="_blank">Apple Maps</a>
            <button className="btn sm" onClick={() => setCard(taxiCard(dest))}>🚕 Show to driver</button>
          </div>
          {!here && <p className="small muted">Tap “Use my location” to see metro, walking and taxi options.</p>}
          {busy === "route" && <p className="muted">Planning routes…</p>}
          {routes.map((r, i) => (
            <div key={i} className="card" style={{ boxShadow: "none" }}>
              <div className="row spread">
                <b>{MODE_ICON[r.mode]} {r.summary}</b>
                <span>{r.minutes} min{r.priceCny !== undefined && ` · ¥${r.priceCny}`}</span>
              </div>
              {r.steps.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  {r.steps.map((s, j) => (
                    <div key={j} className="step">
                      <span>{{ walk: "🚶", subway: "🚇", bus: "🚌", rail: "🚄", drive: "🚗" }[s.kind]}</span>
                      <div>{s.text}{s.zh && <div className="small muted zh">{s.zh}</div>}</div>
                    </div>
                  ))}
                </div>
              )}
              {r.mode === "driving" && (
                <p className="small muted">Book via DiDi (English app) or Alipay → DiDi mini-program. Fare is Amap’s estimate.</p>
              )}
              <div className="row" style={{ marginTop: 6 }}>
                <a className="btn sm" target="_blank" href={amapNav(dest, r.mode === "transit" ? "bus" : r.mode === "walking" ? "walk" : "car", { location: here!.location, name: "我的位置" })}>Navigate</a>
              </div>
            </div>
          ))}
          {routes.some((r) => r.mode === "transit") && (
            <p className="small muted">Metro: scan the Alipay / WeChat “Transport code” at the gate — foreign cards work once linked. Some cities (e.g. Shanghai, Beijing) also accept Visa/Mastercard tap at the gate.</p>
          )}
        </div>
      )}
      {card && <ShowCard lines={card} sub={dest?.pinyin} onClose={() => setCard(null)} />}
    </>
  );
}
