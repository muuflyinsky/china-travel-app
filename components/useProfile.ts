"use client";
import { useCallback, useEffect, useState } from "react";
import type { EntryType } from "@/lib/stay";

export type Mode = "planning" | "in_china";

export type Profile = {
  lang: string;
  allergens: string[];
  diets: string[];
  homeCurrency: string;
  name: string;
  /** null until the traveller answers "planning or already in China?" */
  mode: Mode | null;
  arrival: string; // planned arrival date, YYYY-MM-DD
  entryDate: string; // actual entry date, YYYY-MM-DD
  entryType: EntryType;
  visaDays: number; // "duration of each stay" on a visa
};

const DEFAULT: Profile = {
  lang: "en", allergens: [], diets: [], homeCurrency: "USD", name: "",
  mode: null, arrival: "", entryDate: "", entryType: "visa_free_30", visaDays: 30,
};
const KEY = "ctg.profile";
const EVENT = "ctg-profile";

function read(): Profile {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT;
}

/** Traveller preferences, kept in this browser only and shared live across screens. */
export function useProfile() {
  const [profile, setProfile] = useState<Profile>(DEFAULT);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const sync = () => { setProfile(read()); setLoaded(true); };
    sync();
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);

  const update = useCallback((patch: Partial<Profile>) => {
    const next = { ...read(), ...patch };
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
    setProfile(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return [profile, update, loaded] as const;
}
