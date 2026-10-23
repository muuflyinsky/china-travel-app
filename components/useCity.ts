"use client";
import { useCallback, useEffect, useState } from "react";
import { DEFAULT_CITY, cityFromAdcode, loadCities, type City } from "@/lib/cities";

const KEY = "ctg.city";
const EVENT = "ctg-city";

export type Here = { location: string; citycode: string; adcode: string; address: string };

/** The city the traveller is in. Shared by every screen and kept in localStorage. */
export function useCity() {
  const [city, setCityState] = useState<City>(DEFAULT_CITY);
  const [detected, setDetected] = useState(false);

  useEffect(() => {
    const read = () => {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) { setCityState(JSON.parse(raw)); setDetected(true); }
      } catch {}
    };
    read();
    window.addEventListener(EVENT, read);
    return () => window.removeEventListener(EVENT, read);
  }, []);

  const setCity = useCallback((c: City) => {
    setCityState(c);
    setDetected(true);
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch {}
    window.dispatchEvent(new Event(EVENT));
  }, []);

  /** GPS → Amap reverse geocode → city. Resolves with the raw position too, for routing. */
  const detect = useCallback(
    () =>
      new Promise<Here>((resolve, reject) => {
        if (!navigator.geolocation) return reject(new Error("no-geolocation"));
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              const r = await fetch(`/api/regeo?lng=${pos.coords.longitude}&lat=${pos.coords.latitude}`);
              const d = await r.json();
              if (!r.ok) throw new Error(d.error);
              const match = cityFromAdcode(await loadCities(), d.adcode);
              if (match) setCity(match);
              resolve(d);
            } catch (e) { reject(e); }
          },
          (e) => reject(e),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
        );
      }),
    [setCity],
  );

  return { city, setCity, detect, detected };
}
