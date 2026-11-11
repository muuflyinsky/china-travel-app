import Link from "next/link";
import { notFound } from "next/navigation";
import { CITIES, CITY_IDS, TOPICS, cityName, cityTopics, guidePath, indexable, isLang, type CityId } from "@/lib/guides";
import { guideMeta } from "@/lib/guides/meta";
import { GuideFooter, GuideHeader, topicKey } from "@/components/guides/Chrome";
import { fmt, getDict } from "@/lib/i18n";

export const dynamicParams = false;
export const generateStaticParams = () => CITY_IDS.filter((c) => cityTopics(c).length > 0).map((city) => ({ city }));

type P = { params: Promise<{ lang: string; city: string }> };
const isCity = (c: string): c is CityId => c in CITIES;

export async function generateMetadata({ params }: P) {
  const { lang, city } = await params;
  if (!isLang(lang) || !isCity(city)) return {};
  const t = getDict(lang).guides;
  const name = cityName(city, lang);
  return guideMeta(lang, fmt(t.cityTitle, { city: name }), fmt(t.cityIntro, { city: name }), { city, noindex: !TOPICS.some((t) => indexable(city, t)) });
}

export default async function CityGuides({ params }: P) {
  const { lang, city } = await params;
  if (!isLang(lang) || !isCity(city)) notFound();
  const topics = cityTopics(city);
  if (!topics.length) notFound();
  const t = getDict(lang).guides;
  const name = cityName(city, lang);
  return (
    <>
      <GuideHeader lang={lang} city={city} />
      <main className="mx-auto max-w-3xl px-gutter pt-section">
        <h1 className="text-large-title">{fmt(t.cityTitle, { city: name })}</h1>
        <p className="mt-2 text-body text-muted">{fmt(t.cityIntro, { city: name })}</p>
        <ul className="mt-section divide-y divide-line overflow-hidden rounded-card border border-line bg-card">
          {topics.map((tp) => (
            <li key={tp}>
              <Link href={guidePath(lang, city, tp)} className="block min-h-touch px-4 py-3">
                <span className="block text-headline text-cobalt">{fmt(t.topics[topicKey(tp)].title, { city: name })}</span>
                <span className="block text-subhead text-muted">{fmt(t.topics[topicKey(tp)].desc, { city: name })}</span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <GuideFooter lang={lang} />
    </>
  );
}
