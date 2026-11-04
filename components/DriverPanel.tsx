"use client";
import { useEffect, useRef, useState } from "react";
import { Check, Copy, Search, X } from "lucide-react";
import { Preloader } from "konsta/react";
import { Button, Group, Note } from "./ui";
import { AppIcon } from "./AppIcon";
import { HotelCard } from "./HotelCard";
import { RideButtons } from "./RideButtons";
import { ShowCard } from "./ShowCard";
import { useCity } from "./useCity";
import { useProfile } from "./useProfile";
import { useT } from "./useT";
import { fmt } from "@/lib/i18n";
import { openApp } from "@/lib/openApp";
import { track } from "@/lib/track";
import type { Place } from "@/lib/amap";

/** Saved hotel: Amap navigation, DiDi with the address to paste, the Chinese address to copy. */
function HotelRide() {
  const t = useT();
  const [p, set] = useProfile();
  const [copied, setCopied] = useState(false);
  const h = p.hotel;
  // Hotels saved before v0.5 have no coordinates: look them up once.
  useEffect(() => {
    if (!h || h.location) return;
    fetch(`/api/geocode?address=${encodeURIComponent(h.address)}`).then((r) => r.json()).then((d) => d.location && set({ hotel: { ...h, location: d.location } })).catch(() => {});
  }, [h, set]);
  if (!h) return null;
  return (
    <div className="space-y-2">
      {h.location ? <RideButtons to={{ location: h.location, name: h.name }} address={h.address} /> : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => openApp("amap")} className="flex min-h-control items-center justify-center gap-2 rounded-control border border-line bg-card text-subhead font-semibold"><AppIcon id="amap" size={24} />Amap</button>
            <button onClick={() => openApp("didi")} className="flex min-h-control items-center justify-center gap-2 rounded-control border border-line bg-card text-subhead font-semibold"><AppIcon id="didi" size={24} />{t.today.openDidi}</button>
          </div>
          <p className="px-1 text-footnote text-muted">{t.today.didiHint}</p>
        </>
      )}
      <div className="flex items-center gap-2 rounded-card bg-porcelain p-3">
        <span className="zh min-w-0 flex-1 text-subhead" lang="zh-CN">{h.address}</span>
        <button onClick={() => { navigator.clipboard?.writeText(h.address).then(() => setCopied(true)).catch(() => {}); }}
          className="flex min-h-11 shrink-0 items-center gap-1 px-2 text-subhead font-semibold text-cobalt">
          {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}{copied ? t.today.copied : t.today.copy}
        </button>
      </div>
    </div>
  );
}

/**
 * "Somewhere else": search a place in the current city right here (no trip to Explore), pick one,
 * and it opens as a full-screen card for the driver in Chinese, with a line in the traveller's
 * language saying what the card asks. The picked place also gets the ride buttons.
 */
function Destination() {
  const t = useT();
  const { city } = useCity();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<Place[] | null>(null);
  const [notice, setNotice] = useState<string>();
  const [picked, setPicked] = useState<Place | null>(null);
  const [card, setCard] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    const k = q.trim();
    if (!k) return;
    input.current?.blur(); // close the keyboard so the results are visible
    setBusy(true); setNotice(undefined); setPicked(null);
    const r = await fetch(`/api/places?${new URLSearchParams({ q: k, city: city.a })}`).catch(() => null);
    const d = r?.ok ? await r.json().catch(() => null) : null;
    setBusy(false);
    if (!d) { setResults(null); setNotice(t.go.searchDown); return; }
    const list = (d.places as Place[]).slice(0, 6);
    setResults(list);
    if (!list.length) setNotice(fmt(t.go.nothing, { q: k }));
  }

  function pick(x: Place) {
    setPicked(x); setCard(true);
    track("taxi_card_shown", { source: "driver_search" });
  }

  return (
    <div className="space-y-2">
      <h3 className="px-1 pt-2 text-subhead font-semibold text-muted">{fmt(t.today.driverElseIn, { city: city.e })}</h3>
      <form className="flex gap-2" onSubmit={search} role="search">
        <label className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-control border border-line bg-card px-3">
          <Search className="h-5 w-5 shrink-0 text-muted" aria-hidden />
          <input ref={input} type="search" enterKeyHint="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.today.driverElse} aria-label={t.today.driverElse}
            className="h-full min-w-0 flex-1 bg-transparent text-body outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden" />
          {q && <button type="button" onClick={() => { setQ(""); setResults(null); setNotice(undefined); setPicked(null); }} aria-label={t.go.clear} className="grid h-11 w-8 shrink-0 place-items-center text-muted"><X className="h-4 w-4" aria-hidden /></button>}
        </label>
        <Button type="submit" className="shrink-0 px-5">{t.today.driverFind}</Button>
      </form>
      {busy && <div className="flex justify-center py-3"><Preloader /></div>}
      {notice && <Note tone="warn">{notice}</Note>}
      {results && results.length > 0 && !busy && (
        <>
          <p className="px-1 text-footnote text-muted">{t.today.driverPick}</p>
          <Group>
            {results.map((x) => (
              <li key={x.id}>
                <button onClick={() => pick(x)} aria-pressed={picked?.id === x.id} className={`block w-full px-4 py-3 text-left ${picked?.id === x.id ? "bg-cobalt-soft" : ""}`}>
                  <span className="zh block text-body" lang="zh-CN">{x.name}</span>
                  <span className="block text-footnote text-muted">{x.pinyin}</span>
                  {x.address && <span className="zh block text-footnote text-muted" lang="zh-CN">{x.address}</span>}
                </button>
              </li>
            ))}
          </Group>
        </>
      )}
      {picked && (
        <div className="space-y-2 rounded-card border border-line bg-card p-3">
          <p className="zh text-headline" lang="zh-CN">{picked.name}</p>
          <p className="text-footnote text-muted">{picked.pinyin}</p>
          <Button className="w-full" onClick={() => setCard(true)}>{t.today.driverShowAgain}</Button>
          {picked.location && <RideButtons to={{ location: picked.location, name: picked.name }} address={picked.address} />}
        </div>
      )}
      {card && picked && (
        <ShowCard kind="taxi" lines={["师傅您好，请带我去：", picked.name, ...(picked.address ? [`地址：${picked.address}`] : [])]}
          sub={fmt(t.today.driverCardSays, { place: picked.pinyin })} onClose={() => setCard(false)} />
      )}
    </div>
  );
}

/**
 * Everything for a taxi in one place (Today's "Show the driver" sheet and the /driver page):
 * back to the hotel, ride apps, and any other destination searched here and shown in Chinese.
 */
export function DriverPanel() {
  return (
    <>
      <HotelCard />
      <HotelRide />
      <Destination />
    </>
  );
}
