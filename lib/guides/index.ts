import { CITIES, CITY_IDS, LANGS, TOPICS, type CityId, type Fact, type Lang, type Source, type TopicContent, type TopicId } from "./types";
import { SITE } from "@/lib/seo";
import { payment } from "./content/payment";
import { transport } from "./content/transport";
import { mobileData } from "./content/mobile-data";
import { hotelCheckIn } from "./content/hotel-check-in";

export * from "./types";

export const CONTENT: Record<TopicId, TopicContent> = {
  payment, transport, "mobile-data": mobileData, "hotel-check-in": hotelCheckIn,
};

export const guidePath = (lang: Lang, city?: CityId, topic?: TopicId) =>
  `/${lang}/guides${city ? `/${city}` : ""}${topic ? `/${topic}` : ""}`;

/** hreflang links for one page in every language, plus x-default (English). */
export function languageAlternates(city?: CityId, topic?: TopicId) {
  const langs: Record<string, string> = {};
  for (const l of LANGS) langs[l] = guidePath(l, city, topic);
  langs["x-default"] = guidePath("en", city, topic);
  return langs;
}

/**
 * Facts whose sources nobody has opened yet show on preview and local builds (marked, noindex) so they
 * can be reviewed, and never on production.
 */
export const SHOW_DRAFTS = process.env.VERCEL_ENV !== "production";
const isVerified = (_c: TopicContent, f: Fact) => Boolean(f.checked);

export type NumberedSource = Source & { n: number };
export type CityGuide = {
  checked: string;
  appPath: string;
  sections: { key: string; title: TopicContent["sections"][number]["title"]; facts: (Fact & { refs: number[]; draft: boolean })[] }[];
  sources: NumberedSource[];
  /** Some facts on the page aren't verified yet (preview builds only). */
  draft: boolean;
  /** Checked facts specific to this city. Without any, the page repeats the national rules: noindex. */
  cityFacts: number;
};

/**
 * The page for one city and topic: the city's own facts first in each section, then the national ones.
 * Sources are numbered in order of first use, so the list at the bottom matches the [n] marks.
 */
export function cityGuide(city: CityId, topic: TopicId, drafts = SHOW_DRAFTS): CityGuide {
  const c = CONTENT[topic];
  const shown = (f: Fact) => drafts || isVerified(c, f);
  const order: string[] = [];
  const ref = (id: string) => {
    if (!c.sources[id]) throw new Error(`guides/${topic}: unknown source ${id}`);
    if (!order.includes(id)) order.push(id);
    return order.indexOf(id) + 1;
  };
  const sections = c.sections
    .map((s) => ({
      key: s.key,
      title: s.title,
      facts: [...s.facts.filter((f) => f.applies === city), ...s.facts.filter((f) => f.applies === "national")]
        .filter(shown)
        .map((f) => ({ ...f, refs: f.src.map(ref).sort((a, b) => a - b), draft: !isVerified(c, f) })),
    }))
    .filter((s) => s.facts.length > 0);
  return {
    checked: c.checked, appPath: c.appPath, sections,
    sources: order.map((id, i) => ({ ...c.sources[id], n: i + 1 })),
    draft: sections.some((s) => s.facts.some((f) => f.draft)),
    cityFacts: sections.reduce((n, s) => n + s.facts.filter((f) => f.applies === city && !f.draft).length, 0),
  };
}

/** A page exists when it has at least one fact to show on this build. */
export const hasGuide = (city: CityId, topic: TopicId, drafts = SHOW_DRAFTS) => cityGuide(city, topic, drafts).sections.length > 0;
export const cityTopics = (city: CityId, drafts = SHOW_DRAFTS) => TOPICS.filter((t) => hasGuide(city, t, drafts));
/** Worth indexing: checked facts only, and at least one of them about this city. */
export const indexable = (city: CityId, topic: TopicId) => cityGuide(city, topic, false).cityFacts > 0;
const indexableTopics = (city: CityId) => TOPICS.filter((t) => indexable(city, t));

/** Every indexable guide URL (verified facts only, whatever the build), for the sitemap. */
export function guideUrls() {
  const out: { url: string; languages: Record<string, string> }[] = [];
  const abs = (m: Record<string, string>) => Object.fromEntries(Object.entries(m).map(([k, v]) => [k, SITE + v]));
  const cities = CITY_IDS.filter((c) => indexableTopics(c).length > 0);
  if (!cities.length) return out;
  for (const l of LANGS) {
    out.push({ url: SITE + guidePath(l), languages: abs(languageAlternates()) });
    for (const c of cities) {
      out.push({ url: SITE + guidePath(l, c), languages: abs(languageAlternates(c)) });
      for (const t of indexableTopics(c)) out.push({ url: SITE + guidePath(l, c, t), languages: abs(languageAlternates(c, t)) });
    }
  }
  return out;
}

export const cityName = (c: CityId, l: Lang) => CITIES[c].name[l];
