// "What to sort out before your first trip to China": the checklist from the app's Before-you-go
// screen (lib/i18n/en.ts prepare / pay / esim / sos) written out as one page. Country lists and
// counts are deliberately left out until lib/visa.ts is checked line by line against the NIA lists.
import type { Metadata } from "next";
import Link from "next/link";
import { GuidePage, G } from "@/components/site/GuidePage";
import { en } from "@/lib/i18n/en";

const PATH = "/guide/first-trip-to-china";
const title = "First trip to China: what to sort out before you go";
const description =
  "A clear checklist for a first trip to mainland China: visa-free entry, the online arrival card, Alipay and WeChat Pay, mobile data, which apps to install, trains, sights and emergency numbers.";

export const metadata: Metadata = {
  title: `${title} | HaodeGo`,
  description,
  alternates: { canonical: PATH },
  openGraph: { title, description, url: PATH, siteName: "HaodeGo", type: "article" },
};

const APPS: { name: string; key: keyof typeof en.prepare.appsWhy }[] = [
  { name: "Alipay", key: "alipay" },
  { name: "WeChat", key: "wechat" },
  { name: "Amap (Gaode Maps)", key: "amap" },
  { name: "DiDi", key: "didi" },
  { name: "Trip.com", key: "tripcom" },
  { name: "China Railway 12306", key: "rail12306" },
];

export default function FirstTripGuide() {
  const p = en.prepare, pay = en.pay, esim = en.esim, sos = en.sos;
  return (
    <GuidePage
      path={PATH}
      title={title}
      intro="Most of a smooth trip to China is decided before you leave home: how you get in, how you pay and how you stay online. Here is everything to sort out, in the order that matters."
      checked="4 November 2026"
      appHelps="HaodeGo turns this list into your own: it checks your passport for visa-free entry, walks you through Alipay and WeChat Pay, and once you land shows the taxi card, menus, routes and payments you need that day."
      sources={[
        { name: "National Immigration Administration (NIA)", url: "https://en.nia.gov.cn" },
      ]}
    >
      <nav aria-label="On this page" className="rounded-card border border-line bg-card p-card text-subhead">
        <p className="font-semibold">On this page</p>
        <ol className="mt-2 grid list-decimal gap-1 pl-5 text-cobalt sm:grid-cols-2">
          <li><a href="#entry">Visa and entry</a></li>
          <li><a href="#pay">Payments</a></li>
          <li><a href="#data">Mobile data</a></li>
          <li><a href="#apps">Apps to install</a></li>
          <li><a href="#book">Trains and sights</a></li>
          <li><a href="#food">Food</a></li>
          <li><a href="#good">Good to know</a></li>
          <li><a href="#sos">Emergency numbers</a></li>
        </ol>
      </nav>

      <G h="1. Visa and entry" id="entry">
        <p>
          Many countries can now visit China visa-free for up to 30 days, some under a one-way policy that currently runs until 31 December 2026 and some under mutual agreements.
          Other passports can use 240-hour (10-day) visa-free transit when flying on to a third country. Which applies depends on your passport.
        </p>
        <p>{p.rulesChange} <a href="https://en.nia.gov.cn" rel="noopener" className="font-semibold text-cobalt">{p.nia}</a></p>
        <p>
          Before you land, fill in the arrival card online: it’s free.{" "}
          <Link href="/guide/china-arrival-card" className="font-semibold text-cobalt">How to fill in the arrival card</Link>
        </p>
        <p>{p.stayHint.replace("Settings", "HaodeGo’s Settings")}</p>
      </G>

      <G h="2. Payments: Alipay and WeChat Pay" id="pay">
        <p>{p.moneyBody}</p>
        <div className="rounded-card border border-line bg-card p-card">
          <h3 className="text-headline">Alipay</h3>
          <ol className="mt-2 list-decimal space-y-1 pl-5">{pay.alipaySteps.map((s) => <li key={s}>{s}</li>)}</ol>
        </div>
        <div className="rounded-card border border-line bg-card p-card">
          <h3 className="text-headline">WeChat Pay</h3>
          <ol className="mt-2 list-decimal space-y-1 pl-5">{pay.wechatSteps.map((s) => <li key={s}>{s}</li>)}</ol>
        </div>
        <p>{pay.feeNote}</p>
        <p>{pay.cashNote}</p>
      </G>

      <G h="3. Mobile data" id="data">
        <p>Chinese networks block Google, WhatsApp, Instagram and Gmail. A travel eSIM roams through a partner network, so your usual apps keep working. Install it before you fly and switch it on when you land.</p>
        <p>{esim.tips}</p>
        <p><span className="font-semibold">{esim.localTitle}:</span> {esim.localBody}</p>
      </G>

      <G h="4. Apps to install before you fly" id="apps">
        <p>Install these at home and finish each app’s phone-number verification there; it’s harder once you’re in China.</p>
        <ul className="divide-y divide-line rounded-card border border-line bg-card">
          {APPS.map((a) => (
            <li key={a.key} className="px-4 py-3">
              <span className="block text-headline">{a.name}</span>
              <span className="block text-subhead text-muted">{p.appsWhy[a.key]}</span>
            </li>
          ))}
        </ul>
      </G>

      <G h="5. Trains and sights" id="book">
        <p>{p.bookNote}</p>
        <p>{p.sightsBody}</p>
      </G>

      <G h="6. Food" id="food">
        <p>Most menus are only in Chinese, and many restaurants use a QR code on the table instead of a printed menu. A camera translator gives you literal dish names; it won’t tell you what’s usually in a dish.</p>
        <p>If you have a food allergy or follow a diet, carry a card in Chinese that names what you can’t eat, show it before you order, and confirm with staff. Ingredients such as peanut oil, sesame oil and soy sauce are common and not always visible.</p>
      </G>

      <G h="7. Good to know" id="good">
        <ul className="list-disc space-y-1 pl-5">{Object.values(p.goodItems).map((s) => <li key={s}>{s}</li>)}</ul>
      </G>

      <G h="8. Emergency numbers" id="sos">
        <ul className="divide-y divide-line rounded-card border border-line bg-card">
          {([["110", sos.numbers.police], ["120", sos.numbers.ambulance], ["119", sos.numbers.fire], ["122", sos.numbers.traffic], ["12345", sos.numbers.hotline]] as const).map(([n, label]) => (
            <li key={n} className="flex items-center justify-between gap-3 px-4 py-3">
              <span>{label}</span><a href={`tel:${n}`} className="text-headline text-cobalt">{n}</a>
            </li>
          ))}
        </ul>
        <p><span className="font-semibold">{sos.lost}:</span> {sos.lostBody}</p>
      </G>
    </GuidePage>
  );
}
