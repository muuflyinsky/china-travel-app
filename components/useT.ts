"use client";
import { useEffect } from "react";
import { useProfile } from "./useProfile";
import { getDict } from "@/lib/i18n";

/** UI strings in the traveller's language (falls back to English). */
export function useT() {
  const [profile] = useProfile();
  useEffect(() => { document.documentElement.lang = profile.lang; }, [profile.lang]);
  return getDict(profile.lang);
}
