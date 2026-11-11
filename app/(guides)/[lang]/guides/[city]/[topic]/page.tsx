import Link from "next/link";
import { notFound } from "next/navigation";
import { CITIES, CITY_IDS, TOPICS, cityGuide, cityName, cityTopics, guidePath, hasGuide, isLang, type CityId, type Lang, type TopicId } from "@/lib/guides";
import { formatDate, guideMeta } from "@/lib/guides/meta";
import { AppCta, GuideFooter, GuideHeader, JsonLd, topicKey } from "@/components/guides/Chrome";
import { SITE } from "@/lib/seo";
import { fmt, getDict } from "@/lib/i18n";

export const dynamicParams = false;
// [city] has no layout, so its params don't flow down: list city and topic together here.
export const generateStaticParams = () =>
  CITY_IDS.flatMap((city) => TOPICS.filter((t) => hasGuide(city, t)).map((topic) => ({ city, topic })));

type P = { params: Promise<{ lang: string; city: string; topic: string }> };
const valid = (lang: string, city: string, topic: string): [Lang, CityId, TopicId] | null =>
  isLang(lang) && city in CITIES && (TOPICS as readonly string[]).includes(topic) ? [lang, city as CityId, topic as TopicId] : null;

export async function generateMetadata({ params }: P) {
  const p = valid(...Object.values(await params) as [string, string, string]);
  if (!p) return {};
  const [lang, city, topic] = p;
  const t = getDict(lang).guides.topics[topicKey(topic)];
  const name = cityName(city, lang);
  return guideMeta(lang, fmt(t.title, { city: name }), fmt(t.desc, { city: name }), { city, topic, noindex: cityGuide(city, topic).draft });
}

export default async function GuidePage({ params }: P) {
  const { lang: l, city: c, topic: tp } = await params;
  const p = valid(l, c, tp);
  if (!p) notFound();
  const [lang, city, topic] = p;
  const g = cityGuide(city, topic);
  if (!g.sections.length) notFound();
  const t = getDict(lang).guides;
  const name = cityName(city, lang);
  const title = fmt(t.topics[topicKey(topic)].title, { city: name });
  const desc = fmt(t.topics[topicKey(topic)].desc, { city: name });
  const url = SITE + guidePath(lang, city, topic);

  return (
    <>
      <GuideHeader lang={lang} city={city} topic={topic} />
      <main className="mx-auto max-w-3xl px-gutter pt-section">
        <nav aria-label="Breadcrumb" className="text-footnote text-muted">
          <Link href={guidePath(lang)} className="text-cobalt">{t.allGuides}</Link> › <Link href={guidePath(lang, city)} className="text-cobalt">{name}</Link>
        </nav>
        <h1 className="mt-2 text-large-title">{title}</h1>
        <p className="mt-2 text-body text-muted">{desc}</p>
        <p className="mt-2 text-footnote text-muted">
          <time dateTime={g.checked}>{fmt(t.checked, { date: formatDate(g.checked, lang) })}</time>
          {lang !== "en" && <> · {t.translated}</>}
        </p>
        {g.draft && (
          // Reviewer-only (never on production builds), so English and not translated.
          <p className="mt-stack rounded-card border border-dashed border-line bg-card p-card text-subhead">
            <strong>Draft for review.</strong> Facts marked “unverified” aren’t confirmed against their sources yet; check them against the cited pages and set
            <code> checked</code> in lib/guides/content before they appear on the live site.
          </p>
        )}

        {g.sections.map((s) => (
          <section key={s.key} className="mt-section">
            <h2 className="text-title">{s.title[lang]}</h2>
            <ul className="mt-stack space-y-3">
              {s.facts.map((f, i) => {
                const text = f.text[lang] ?? f.text.en;
                return (
                  <li key={i} lang={f.text[lang] ? undefined : "en"}
                    className={`rounded-card border bg-card p-card text-body ${f.draft ? "border-dashed border-line" : "border-line"}`}>
                    {f.applies !== "national" && <span className="mr-2 rounded-control bg-cobalt-soft px-2 py-0.5 text-footnote font-semibold text-cobalt">{fmt(t.inCity, { city: name })}</span>}
                    {text}
                    {f.refs.map((n) => <sup key={n} className="ml-0.5"><a href={`#src-${n}`} className="text-cobalt">[{n}]</a></sup>)}
                    {f.draft && <span className="ml-2 text-footnote text-muted">(unverified)</span>}
                    {f.draft && f.note && <span className="mt-1 block text-footnote text-muted">Reviewer note: {f.note}</span>}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        <AppCta lang={lang} href={g.appPath} />

        <section className="mt-section">
          <h2 className="text-headline">{fmt(t.moreGuides, { city: name })}</h2>
          <ul className="mt-2 space-y-1 text-subhead">
            {cityTopics(city).filter((x) => x !== topic).map((x) => (
              <li key={x}><Link href={guidePath(lang, city, x)} className="text-cobalt">{fmt(t.topics[topicKey(x)].title, { city: name })}</Link></li>
            ))}
          </ul>
        </section>

        <section className="mt-section">
          <h2 className="text-headline">{t.sources}</h2>
          <ol className="mt-2 space-y-2 text-footnote text-muted">
            {g.sources.map((s) => (
              <li key={s.n} id={`src-${s.n}`} className="scroll-mt-4">
                [{s.n}] {s.publisher}: <a href={s.url} rel="nofollow noopener" target="_blank" className="break-words text-cobalt">{s.title}</a>
                {s.published && <> ({s.published})</>}
              </li>
            ))}
          </ol>
        </section>
      </main>
      <GuideFooter lang={lang} />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Article", headline: title, description: desc, inLanguage: lang, dateModified: g.checked,
            mainEntityOfPage: url, author: { "@type": "Organization", name: "HaodeGo", url: SITE },
            publisher: { "@type": "Organization", name: "HaodeGo", url: SITE },
            citation: g.sources.map((s) => s.url),
          },
          {
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: t.allGuides, item: SITE + guidePath(lang) },
              { "@type": "ListItem", position: 2, name, item: SITE + guidePath(lang, city) },
              { "@type": "ListItem", position: 3, name: title, item: url },
            ],
          },
        ],
      }} />
    </>
  );
}
