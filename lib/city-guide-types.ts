// City guide = top 5 sights + 5 signature dishes, generated automatically per hot city.
// Shared by the server pipeline (lib/city-guide.ts) and the UI.

export const GUIDE_LANGS = ["en", "es", "fr", "de", "ja", "ko"] as const;
/** Text in each UI language; English is always present and is the fallback. */
export type L10n = { en: string } & Partial<Record<(typeof GUIDE_LANGS)[number], string>>;
export const pick = (t: L10n | undefined, lang: string) => (t ? (t as Record<string, string | undefined>)[lang] || t.en : "");

export type GuideSight = {
  id: string; zh: string; en: string; location: string; address: string;
  rating?: number; national: boolean;
  /** First Amap photo, https. Credited "图片：高德" wherever shown. */
  photo?: string;
  intro: L10n; bestTime: L10n; hours: number;
  /** Low = the model was unsure; the UI hides the intro and the item is queued for review. */
  confidence: "high" | "low";
  reservation?: string; // id in lib/reservations.ts
};

export type GuideDish = {
  zh: string; pinyin: string; name: L10n; intro: L10n;
  allergens: string[]; spice: number; vegetarian: boolean;
  /** Typical spend per person (CNY) at restaurants in the city that serve it, from Amap. */
  spend?: [number, number];
  confidence: "high" | "low";
};

/** A first-time-visitor area to stay in: AI-suggested, located and metro-counted with Amap. */
export type GuideArea = {
  zh: string; name: L10n; reason: L10n;
  location: string; // "lng,lat" GCJ-02, centre used for the hotel search
  metro: number; // metro stations within 1 km
};

export type CityGuide = {
  city: string; cityEn: string; adcode: string;
  generatedAt: string; model: string;
  sources: string[];
  sights: GuideSight[]; dishes: GuideDish[];
  areas?: GuideArea[];
};
