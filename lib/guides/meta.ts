import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/seo";
import { guidePath, languageAlternates, type CityId, type Lang, type TopicId } from "./index";

/** Metadata for a guide page: canonical in its own language, hreflang to the others. */
export function guideMeta(lang: Lang, title: string, description: string, opts: { city?: CityId; topic?: TopicId; noindex?: boolean } = {}): Metadata {
  const path = guidePath(lang, opts.city, opts.topic);
  return {
    title, description,
    alternates: { canonical: path, languages: languageAlternates(opts.city, opts.topic) },
    openGraph: { title, description, siteName: SITE_NAME, url: path, type: "article", locale: lang },
    twitter: { card: "summary", title, description },
    ...(opts.noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

export const formatDate = (iso: string, lang: Lang) =>
  new Intl.DateTimeFormat(lang, { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
