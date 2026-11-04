// Departure tax refund, from the same hand-checked data and wording as the app's /tax-refund screen
// (lib/tax-refund.ts, lib/i18n/en.ts `tax`). Only what an official source states is shown.
import type { Metadata } from "next";
import { GuidePage, G } from "@/components/site/GuidePage";
import { OG_IMAGE } from "@/lib/site";
import { en } from "@/lib/i18n/en";
import { fmt } from "@/lib/i18n";
import { SIGN_BLUE, TAX_CITIES, VERIFIED_ON, type Counter } from "@/lib/tax-refund";

const PATH = "/guide/china-tax-refund";
const title = "Tax refund in China: how to get about 11% back at the airport";
const description =
  "How tourists claim China’s departure tax refund: the ¥200 rule in Tax Free shops, the four steps at the airport, and where the refund counters are at Beijing, Shanghai and Guangzhou airports.";

export const metadata: Metadata = {
  title: `${title} | HaodeGo`,
  description,
  alternates: { canonical: PATH },
  openGraph: { title, description, url: PATH, siteName: "HaodeGo", type: "article", images: [OG_IMAGE] },
  twitter: { card: "summary_large_image", title, description, images: [OG_IMAGE] },
};

const x = en.tax;

/** "After security, turn right and walk about 200 m · near gate D83". Same rules as app/tax-refund. */
function where(c: Counter) {
  if (c.signs) return x.followSigns;
  const parts: string[] = [];
  if (c.walk) {
    parts.push(fmt(x.walk, { dir: x[c.walk.dir], m: c.walk.m }));
    if (c.walk.then) parts.push(fmt(x.thenWalk, { dir: x[c.walk.then.dir], m: c.walk.then.m }));
  } else parts.push(x.afterSecurity);
  if (c.floor) parts.push(fmt(x.floor, { n: c.floor }));
  if (c.gate) parts.push(fmt(c.opposite ? x.oppositeGate : x.nearGate, { gate: c.gate }));
  return parts.join(", ");
}

const longDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

function Sign({ zh, label }: { zh: string; label: string }) {
  return (
    <figure>
      <div className="flex aspect-[3/2] w-full flex-col items-center justify-center rounded-control text-white" style={{ background: SIGN_BLUE }} lang="zh-CN">
        <span className="zh text-title">{zh}</span>
        <span className="mt-1 font-serif text-headline tracking-wide">TAX FREE</span>
      </div>
      <figcaption className="mt-1.5 text-footnote text-muted">{label}</figcaption>
    </figure>
  );
}

export default function TaxRefundGuide() {
  return (
    <GuidePage
      path={PATH}
      title={title}
      intro={x.intro}
      checked={longDate(VERIFIED_ON)}
      appHelps="HaodeGo puts the tax refund steps on your home screen in the last days of your trip, with the counter at your airport and a card in Chinese to show customs."
      sources={[
        { name: "State Taxation Administration (国家税务总局)", url: "https://www.chinatax.gov.cn" },
        { name: "Shanghai Municipal Tax Service (counter locations published 15 July 2026)", url: "https://shanghai.chinatax.gov.cn" },
      ]}
    >
      <G h={x.signsTitle}>
        <div className="grid max-w-md grid-cols-2 gap-stack">
          <Sign zh="退税商店" label={x.signShop} />
          <Sign zh="离境退税代理" label={x.signCounter} />
        </div>
      </G>

      <G h="In the shop">
        <ul className="list-disc space-y-1 pl-5">{x.tips.map((t) => <li key={t}>{t}</li>)}</ul>
      </G>

      <G h={x.stepsTitle}>
        <ol className="space-y-stack">
          {x.steps.map((s, i) => (
            <li key={s.title} className="flex gap-3 rounded-card border border-line bg-card p-card">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-cobalt-soft text-headline text-cobalt">{i + 1}</span>
              <span><span className="block text-headline">{s.title}</span>{s.body && <span className="mt-0.5 block text-subhead text-muted">{s.body}</span>}</span>
            </li>
          ))}
        </ol>
        <p className="rounded-card border border-line bg-card p-card">
          <span className="block text-subhead text-muted">To customs:</span>
          <span className="zh mt-1 block text-title" lang="zh-CN">您好，我要办理离境退税</span>
          <span className="mt-1 block text-subhead text-muted">“Hello, I’d like to claim my departure tax refund.”</span>
        </p>
      </G>

      <G h={x.whereTitle}>
        {TAX_CITIES.map((c) => (
          <div key={c.adcode} className="rounded-card border border-line bg-card p-card">
            <h3 className="text-headline">{x.cities[c.adcode as keyof typeof x.cities]}</h3>
            {c.airports.map((a) => (
              <div key={a.code} className="mt-3">
                <p className="font-semibold">{a.en} ({a.code}) <span className="zh font-normal text-muted" lang="zh-CN">{a.zh}</span></p>
                <ul className="mt-1 space-y-1 text-subhead text-muted">
                  {a.counters.map((k, i) => (
                    <li key={i}>
                      {k.terminal && <span className="font-semibold text-ink">{k.terminal}: </span>}
                      {where(k)}{k.hours ? `. ${x.hours[k.hours]}.` : "."}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {c.serviceMap && <p className="mt-3 text-subhead">{x.shanghaiMap}</p>}
            {c.bagDropCheck && <p className="mt-3 text-subhead">{x.gzBagDrop}</p>}
          </div>
        ))}
        <p>{x.otherCities}</p>
      </G>
    </GuidePage>
  );
}
