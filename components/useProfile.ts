"use client";
import { useCallback, useEffect, useState } from "react";
import type { EntryType } from "@/lib/stay";
import { LANGUAGES } from "@/lib/languages";
import { currencyFor, guessCountry } from "@/lib/visa";

export type Profile = {
  lang: string;
  allergens: string[];
  diets: string[];
  homeCurrency: string;
  name: string;
  /** Set once the browser's location has been seen inside mainland China. */
  locatedInChina: boolean;
  arrival: string; // planned arrival date, YYYY-MM-DD
  entryDate: string; // actual entry date, YYYY-MM-DD
  entryType: EntryType;
  visaDays: number; // "duration of each stay" on a visa
  departure: string; // planned departure date, YYYY-MM-DD
  nationality: string; // ISO country code, confirmed by the traveller ("" = not yet)
  onwardThird: boolean | null; // only asked when the passport qualifies for transit only
  guests: number; // remembered for hotel search
  hotel: { name: string; address: string; nameEn?: string } | null; // "back to my hotel" card
  allergiesAsked: boolean; // the first-visit allergy sheet on Eat has been answered
  severe: string[]; // allergens where even a trace is dangerous
  cities: { a: string; e: string; s: string }[]; // destination cities: adcode, English, Chinese short name
};

const DEFAULT: Profile = {
  lang: "en", allergens: [], diets: [], homeCurrency: "USD", name: "",
  locatedInChina: false, arrival: "", entryDate: "", entryType: "visa_free_30", visaDays: 30,
  departure: "", nationality: "", onwardThird: null, guests: 1, hotel: null, allergiesAsked: false,
  severe: [], cities: [],
};
const KEY = "ctg.profile";
const EVENT = "ctg-profile";

/** First visit: language and currency are inferred from the browser instead of asked. */
function inferred(): Profile {
  const lang = navigator.language.split("-")[0];
  const country = guessCountry();
  return {
    ...DEFAULT,
    lang: LANGUAGES.some((l) => l.code === lang) ? lang : "en",
    homeCurrency: country ? currencyFor(country) : DEFAULT.homeCurrency,
  };
}

function read(): Profile {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {}
  return inferred();
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
