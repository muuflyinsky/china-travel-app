import Link from "next/link";
import { LANGS, guidePath, type CityId, type Lang, type TopicId } from "@/lib/guides";
import { getDict } from "@/lib/i18n";

const LANG_NAMES: Record<Lang, string> = { en: "English", es: "Español", fr: "Français", de: "Deutsch", ja: "日本語", ko: "한국어" };

/** Server-only header for the guide pages: brand, breadcrumb back to the guides, language links. */
export function GuideHeader({ lang, city, topic }: { lang: Lang; city?: CityId; topic?: TopicId }) {
  const t = getDict(lang).guides;
  return (
    <header className="border-b border-line bg-card">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-4 gap-y-2 px-gutter py-3">
        <Link href="/" className="text-headline text-ink">HaodeGo</Link>
        <Link href={guidePath(lang)} className="text-subhead font-semibold text-cobalt">{t.allGuides}</Link>
        <nav aria-label={t.language} className="ml-auto flex flex-wrap gap-x-3 gap-y-1 text-footnote">
          {LANGS.map((l) => (
            <Link key={l} href={guidePath(l, city, topic)} hrefLang={l} lang={l} aria-current={l === lang ? "page" : undefined}
              className={l === lang ? "font-semibold text-ink" : "text-cobalt"}>{LANG_NAMES[l]}</Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function GuideFooter({ lang }: { lang: Lang }) {
  const t = getDict(lang).guides;
  return (
    <footer className="mx-auto max-w-3xl px-gutter pt-section pb-12 text-footnote text-muted">
      <p>{t.disclaimer}</p>
      <p className="mt-2">© HaodeGo · <Link href="/privacy" className="text-cobalt">Privacy</Link> · <Link href="/support" className="text-cobalt">Support</Link></p>
    </footer>
  );
}

/** Cobalt app call to action (not gold: this isn't a booking link). */
export function AppCta({ lang, href }: { lang: Lang; href: string }) {
  const t = getDict(lang).guides;
  return (
    <aside className="mt-section rounded-card border border-line bg-cobalt-soft p-card">
      <h2 className="text-headline">{t.appTitle}</h2>
      <p className="mt-1 text-subhead text-muted">{t.appBody}</p>
      <Link href={href} className="mt-stack inline-flex min-h-control items-center rounded-control bg-cobalt px-5 text-subhead font-semibold text-white">{t.openApp}</Link>
    </aside>
  );
}

export const topicKey = (t: TopicId) => (t === "mobile-data" ? "mobileData" : t === "hotel-check-in" ? "hotelCheckIn" : t);

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
