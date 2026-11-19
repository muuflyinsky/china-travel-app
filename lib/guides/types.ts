// Static travel guides (/[lang]/guides/[city]/[topic]): server-rendered pages for search engines and
// for travellers who haven't installed the app. Every fact names its sources; a page shows the date
// it was last checked. City facts sit next to national ones; where a city fact couldn't be sourced
// the page only shows the national rule (never a guess).

export const LANGS = ["en", "es", "fr", "de", "ja", "ko"] as const;
export type Lang = (typeof LANGS)[number];
export const isLang = (x: string): x is Lang => (LANGS as readonly string[]).includes(x);

/** One string in every guide language. English is the reference; the others are translations of it. */
export type Text = Record<Lang, string>;
/** Fact text: English always; a missing translation falls back to English on that page. */
export type FactText = { en: string } & Partial<Text>;

export const CITIES = {
  beijing: { adcode: "110000", zh: "北京", name: { en: "Beijing", es: "Pekín", fr: "Pékin", de: "Peking", ja: "北京", ko: "베이징" } },
  shanghai: { adcode: "310000", zh: "上海", name: { en: "Shanghai", es: "Shanghái", fr: "Shanghai", de: "Shanghai", ja: "上海", ko: "상하이" } },
  xian: { adcode: "610100", zh: "西安", name: { en: "Xi'an", es: "Xi'an", fr: "Xi'an", de: "Xi'an", ja: "西安", ko: "시안" } },
} satisfies Record<string, { adcode: string; zh: string; name: Text }>;
export type CityId = keyof typeof CITIES;
export const CITY_IDS = Object.keys(CITIES) as CityId[];

export const TOPICS = ["payment", "transport", "mobile-data", "hotel-check-in"] as const;
export type TopicId = (typeof TOPICS)[number];

export type Source = {
  title: string;
  publisher: string;
  url: string;
  /** Publication date if the source shows one (YYYY-MM-DD). */
  published?: string;
  kind: "official" | "media";
};

/** One fact. `src` are keys of the topic's `sources`; at least one is required. */
export type Fact = {
  applies: "national" | CityId; text: FactText;
  /** Sources that state this fact (for a checked fact: only the ones that were confirmed to). */
  src: string[];
  /**
   * Date someone read the cited pages and confirmed they state this text (YYYY-MM-DD).
   * Unset = draft: shown on preview/local builds only, never on production.
   */
  checked?: string;
  /** For reviewers only (conflicts, dates to recheck); shown on draft builds, never in production. */
  note?: string;
};

export type Section = { key: string; title: Text; facts: Fact[] };

export type TopicContent = {
  /** Date every fact on the topic was last checked against its sources. Shown on the page. */
  checked: string;
  sources: Record<string, Source>;
  sections: Section[];
  /** Where the app helps with this topic, shown as the call to action. */
  appPath: string;
};
