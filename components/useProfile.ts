"use client";
import { useEffect, useState } from "react";

export type Profile = { lang: string; allergens: string[]; diets: string[]; homeCurrency: string; name: string };
const DEFAULT: Profile = { lang: "en", allergens: [], diets: [], homeCurrency: "USD", name: "" };
const KEY = "ctg.profile";

export function useProfile() {
  const [profile, setProfile] = useState<Profile>(DEFAULT);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setProfile({ ...DEFAULT, ...JSON.parse(raw) });
    } catch {}
  }, []);
  const update = (patch: Partial<Profile>) =>
    setProfile((p) => {
      const next = { ...p, ...patch };
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  return [profile, update] as const;
}
