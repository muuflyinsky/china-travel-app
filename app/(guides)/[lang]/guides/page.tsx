import Link from "next/link";
import { notFound } from "next/navigation";
import { CITY_IDS, LANGS, cityName, cityTopics, guidePath, isLang } from "@/lib/guides";
import { guideMeta } from "@/lib/guides/meta";
import { GuideFooter, GuideHeader, topicKey } from "@/components/guides/Chrome";
import { fmt, getDict } from "@/lib/i18n";

export const generateStaticParams = () => LANGS.map((lang) => ({ lang }));

type P = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: P) {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const t = getDict(lang).guides;
  const live = CITY_IDS.some((c) => cityTopics(c, false).length > 0);
  return guideMeta(lang, t.hubTitle, t.hubIntro, { noindex: !live });
}

export default async function GuidesHub({ params }: P) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getDict(lang).guides;
  const cities = CITY_IDS.filter((c) => cityTopics(c).length > 0);
  return (
    <>
      <GuideHeader lang={lang} />
      <main className="mx-auto max-w-3xl px-gutter pt-section">
        <h1 className="text-large-title">{t.hubTitle}</h1>
        <p className="mt-2 text-body text-muted">{t.hubIntro}</p>
        {cities.map((c) => (
          <section key={c} className="mt-section">
            <h2 className="text-title"><Link href={guidePath(lang, c)} className="text-ink">{fmt(t.cityTitle, { city: cityName(c, lang) })}</Link></h2>
            <ul className="mt-stack divide-y divide-line overflow-hidden rounded-card border border-line bg-card">
              {cityTopics(c).map((tp) => (
                <li key={tp}>
                  <Link href={guidePath(lang, c, tp)} className="block min-h-touch px-4 py-3">
                    <span className="block text-body text-cobalt">{fmt(t.topics[topicKey(tp)].title, { city: cityName(c, lang) })}</span>
                    <span className="block text-footnote text-muted">{fmt(t.topics[topicKey(tp)].desc, { city: cityName(c, lang) })}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
      <GuideFooter lang={lang} />
    </>
  );
}
