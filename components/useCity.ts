"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DEFAULT_CITY, cityFromAdcode, loadCities, type City } from "@/lib/cities";
import { todayIso } from "@/lib/stay";
import { useProfile, type TripCity } from "./useProfile";
import { currentPosition } from "@/lib/location";

const KEY = "ctg.city";
const EVENT = "ctg-city";

export type Here = { location: string; citycode: string; adcode: string; address: string };
type Stored = { city: City; day: string; src: "gps" | "manual" };

const fromTrip = (c: TripCity): City => ({ n: c.n ?? c.s, s: c.s, a: c.a, e: c.e, p: c.p ?? "", py: "", t: "city" });

/**
 * The city the traveller is in, shared by every screen. Order (SPEC v0.5):
 * a location fix or manual pick from today → the trip city whose dates cover today →
 * the first trip city → an older fix or pick → Shanghai. With trip cities set, Shanghai
 * is never the silent default.
 */
export function useCity() {
  const [p] = useProfile();
  const [stored, setStored] = useState<Stored | null>(null);

  useEffect(() => {
    const read = () => {
      try {
        const raw = JSON.parse(localStorage.getItem(KEY) ?? "null");
        // Older versions stored the City itself.
        setStored(raw?.city ? raw : raw?.a ? { city: raw, day: "", src: "manual" } : null);
      } catch {}
    };
    read();
    window.addEventListener(EVENT, read);
    return () => window.removeEventListener(EVENT, read);
  }, []);

  const save = useCallback((city: City, src: Stored["src"]) => {
    const s: Stored = { city, day: todayIso(), src };
    setStored(s);
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
    window.dispatchEvent(new Event(EVENT));
  }, []);
  const setCity = useCallback((c: City) => save(c, "manual"), [save]);

  const today = todayIso();
  const city = useMemo(() => {
    if (stored && stored.day === today) return stored.city;
    const dated = p.cities.find((c) => c.from && c.from <= today && (!c.to || today <= c.to));
    if (dated) return fromTrip(dated);
    if (p.cities[0]) return fromTrip(p.cities[0]);
    return stored?.city ?? DEFAULT_CITY;
  }, [stored, today, p.cities]);
  /** True once today's city came from a location fix or a manual pick. */
  const detected = Boolean(stored && stored.day === today);

  /** GPS → Amap reverse geocode → city. Resolves with the raw position too, for routing. */
  const detect = useCallback(async (): Promise<Here> => {
    const pos = await currentPosition({ highAccuracy: true });
    const r = await fetch(`/api/regeo?lng=${pos.longitude}&lat=${pos.latitude}`);
    const d = await r.json();
    if (!r.ok) throw new Error(d.error);
    const match = cityFromAdcode(await loadCities(), d.adcode);
    if (match) save(match, "gps");
    return d;
  }, [save]);

  return { city, setCity, detect, detected };
}
