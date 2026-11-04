// What HaodeGo is, for people who find it on the web. Server-rendered so search engines can read it.
// Positioning (Veer, 2026-11-04): one calm place for the whole trip, not any single feature.
// Every claim here is something the app does today (docs/SPEC.md); no ratings, reviews or counts.
import type { Metadata } from "next";
import Link from "next/link";
import { SiteFrame, OpenAppCta } from "@/components/site/SiteFrame";
import { GUIDES, SITE_URL } from "@/lib/site";

const title = "HaodeGo: the China travel app for visa, payments, menus and getting around";
const description =
  "Everything you need for a trip to mainland China in one app: visa-free check, Alipay and WeChat Pay setup, menus in your language, taxi cards, metro routes and translation. Free, no account.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/welcome" },
  openGraph: { title, description, url: "/welcome", siteName: "HaodeGo", type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

const STAGES: { when: string; items: string[] }[] = [
  {
    when: "Before you go",
    items: [
      "Check if your passport can enter visa-free, and for how long.",
      "Fill in the arrival card, set up Alipay and WeChat Pay, sort out mobile data and the apps to install.",
      "Know when train tickets go on sale and which sights need booking ahead.",
    ],
  },
  {
    when: "The day you land",
    items: [
      "Your hotel’s name and address in large Chinese, ready to show the taxi driver.",
      "Confirm your entry date and see how many days you may stay.",
    ],
  },
  {
    when: "Every day in China",
    items: [
      "Photograph any menu: every dish in your language, checked against your allergies and diet.",
      "Search places in English or pinyin. Metro and bus routes with fares, a taxi card, or one tap to DiDi.",
      "Your Alipay pay code in one tap, a price converter, and two-way voice translation.",
    ],
  },
  {
    when: "Leaving",
    items: [
      "Get to the airport on time.",
      "Claim your tax refund: what to do and where the counter is.",
    ],
  },
];

const SHOTS = [
  { src: "/site/04-explore.webp", alt: "HaodeGo Explore screen: top picks in Shanghai with Yu Garden, a tickets button, taxi card and route", caption: "Top picks in any Chinese city, each with a taxi card and a route." },
  { src: "/site/05-route.webp", alt: "Route screen: bus routes with fares, stop names in pinyin and Chinese, and a taxi estimate", caption: "Routes with fares, stop names in pinyin and Chinese, and a taxi estimate." },
  { src: "/site/01-menu-results.webp", alt: "Eat screen: a Shanghai menu read into English, each dish checked for a peanut and sesame allergy", caption: "Any menu in your language. Set an allergy or diet and each dish gets one clear answer." },
  { src: "/site/03-order-card.webp", alt: "Order card in large Chinese for the waiter, with buttons they can tap to reply", caption: "Show the waiter what you’d like, in large Chinese. They tap to reply." },
  { src: "/site/06-talk.webp", alt: "Talk screen: English translated into Chinese with pinyin", caption: "Two-way translation with voice and pinyin." },
];

const CLEAR = [
  { h: "One clear answer", p: "Each screen answers the question you have right now, without a wall of text or ten tabs to compare." },
  { h: "Sources and dates where it matters", p: "Visa-free rules and tax refund counters say where they come from and when we last checked them." },
  { h: "Chinese for the people you meet", p: "Cards in large Chinese for taxi drivers, waiters and shop staff, with buttons they can tap to answer you." },
  { h: "In your language", p: "English, Español, Français, Deutsch, 日本語 and 한국어. Menus are read into 15 languages." },
];

const FAQ = [
  { q: "Is HaodeGo free?", a: "Yes. Open haodego.com in your phone’s browser and start; there’s no account to create." },
  { q: "Is there an iPhone app?", a: "An iPhone app is on its way to the App Store. Until then, open haodego.com in Safari and add it to your Home Screen." },
  { q: "Which cities does it cover?", a: "All of mainland China: search, routes and taxi cards work in any city, and top picks cover the most-visited ones." },
  { q: "Does it work without internet?", a: "No. Reading menus, maps and translation need a connection, so set up a travel eSIM or a local SIM card before you rely on it." },
  { q: "Can I rely on the allergy check?", a: "Use it as a guide, not a guarantee. Ingredients are inferred from common recipes, and a severe allergy never gets a green answer. Always show your allergy card and confirm with staff." },
  { q: "What happens to my information?", a: "Your allergies, travel dates and hotel stay on your phone. Menu photos are sent to the AI service to be read, then discarded. There are no ads." },
  { q: "I have an Android phone.", a: "Use HaodeGo in Chrome or any other browser; everything works the same." },
];

export default function WelcomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: "HaodeGo",
        alternateName: "HaodeGo: China Travel Buddy",
        url: SITE_URL,
        applicationCategory: "TravelApplication",
        operatingSystem: "Any (web browser), iOS",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        description,
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
    ],
  };
  return (
    <SiteFrame>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="mx-auto grid max-w-5xl items-center gap-8 px-gutter pt-8 pb-4 md:grid-cols-[1.15fr_1fr] md:pt-16">
        <div>
          <p className="text-subhead font-semibold text-cobalt">China travel app</p>
          <h1 className="mt-2 text-large-title text-balance md:text-hero">Everything you need in China, in one app.</h1>
          <p className="mt-4 text-body text-muted text-pretty">
            Visa, payments, menus, taxis, metro, hotels and translation, with clear answers in your language.
            No more piecing your trip together from ten apps and twenty blog posts.
          </p>
          <div className="mt-6"><OpenAppCta where="hero" /></div>
          <div className="mt-8 hidden items-center gap-4 rounded-card border border-line bg-card p-card md:flex">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/site/qr-haodego.svg" alt="QR code for haodego.com" width={96} height={96} className="rounded-control bg-white p-1" />
            <p className="text-subhead text-muted"><span className="block font-semibold text-ink">On a computer?</span>Scan with your phone’s camera to open HaodeGo there.</p>
          </div>
        </div>
        <div className="relative mx-auto flex w-full max-w-sm justify-center md:max-w-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/site/01-menu-results.webp" alt="" width={660} height={1434} className="absolute left-0 top-10 hidden w-[44%] -rotate-6 rounded-[28px] border border-line shadow-float md:block" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/site/05-route.webp" alt="" width={660} height={1434} className="absolute right-0 top-10 hidden w-[44%] rotate-6 rounded-[28px] border border-line shadow-float md:block" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/site/04-explore.webp" alt="HaodeGo showing top picks in Shanghai, each with tickets, a taxi card and a route" width={660} height={1434} fetchPriority="high"
            className="relative w-[62%] rounded-[32px] border border-line shadow-float md:w-[50%]" />
        </div>
      </section>

      {/* The trip, start to finish */}
      <section className="mx-auto mt-section max-w-5xl px-gutter md:mt-16">
        <h2 className="text-title">From planning to flying home</h2>
        <p className="mt-2 max-w-2xl text-body text-muted">
          The home screen follows your trip, so what you need today is at the top: preparation before you fly, the way to your hotel the day you land, then food, getting around and paying.
        </p>
        <ol className="mt-6 grid gap-stack sm:grid-cols-2 lg:grid-cols-4">
          {STAGES.map((s, i) => (
            <li key={s.when} className="rounded-card border border-line bg-card p-card">
              <p className="text-footnote font-semibold text-cobalt">{i + 1}</p>
              <h3 className="mt-1 text-headline">{s.when}</h3>
              <ul className="mt-2 space-y-2 text-subhead text-muted">
                {s.items.map((it) => <li key={it}>{it}</li>)}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      {/* Real screens */}
      <section className="mt-section md:mt-16">
        <div className="mx-auto max-w-5xl px-gutter">
          <h2 className="text-title">See it working</h2>
          <p className="mt-2 text-body text-muted">Real screens from the app, with live map and AI data.</p>
        </div>
        <ul className="mx-auto mt-6 flex max-w-5xl snap-x snap-mandatory gap-stack overflow-x-auto px-gutter pb-2 lg:grid lg:grid-cols-5 lg:overflow-visible">
          {SHOTS.map((s) => (
            <li key={s.src} className="w-[62%] shrink-0 snap-start sm:w-[38%] lg:w-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.src} alt={s.alt} width={660} height={1434} loading="lazy" className="w-full rounded-[24px] border border-line" />
              <p className="mt-2 text-subhead text-muted">{s.caption}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Clear */}
      <section className="mx-auto mt-section max-w-5xl px-gutter md:mt-16">
        <h2 className="text-title">Clear, so you don’t have to double-check</h2>
        <ul className="mt-6 grid gap-stack sm:grid-cols-2">
          {CLEAR.map((c) => (
            <li key={c.h} className="rounded-card border border-line bg-card p-card">
              <h3 className="text-headline">{c.h}</h3>
              <p className="mt-1 text-subhead text-muted">{c.p}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Trust */}
      <section className="mx-auto mt-section max-w-5xl px-gutter md:mt-16">
        <div className="rounded-card bg-cobalt-soft p-card md:p-8">
          <h2 className="text-title">Your trip stays on your phone</h2>
          <ul className="mt-3 grid gap-2 text-body sm:grid-cols-2">
            <li>No account, no sign-up.</li>
            <li>Allergies, travel dates and your hotel are saved only on your phone.</li>
            <li>No ads.</li>
            <li>
              Hotel, train and ticket links are affiliate links: that’s how HaodeGo is paid for, at no extra cost to you.{" "}
              <Link href="/privacy" className="font-semibold text-cobalt">Privacy</Link>
            </li>
          </ul>
        </div>
      </section>

      {/* Guides */}
      <section className="mx-auto mt-section max-w-5xl px-gutter md:mt-16">
        <h2 className="text-title">Guides</h2>
        <ul className="mt-6 grid gap-stack md:grid-cols-3">
          {GUIDES.map((g) => (
            <li key={g.href}>
              <Link href={g.href} className="block h-full rounded-card border border-line bg-card p-card">
                <span className="block text-headline text-cobalt">{g.title}</span>
                <span className="mt-1 block text-subhead text-muted">{g.blurb}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* FAQ */}
      <section className="mx-auto mt-section max-w-3xl px-gutter md:mt-16">
        <h2 className="text-title">Questions</h2>
        <div className="mt-4 divide-y divide-line rounded-card border border-line bg-card">
          {FAQ.map((f) => (
            <details key={f.q} className="group px-4">
              <summary className="flex min-h-control cursor-pointer list-none items-center justify-between gap-3 py-3 text-headline [&::-webkit-details-marker]:hidden">
                {f.q}<span aria-hidden className="text-muted transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="pb-4 text-body text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-section max-w-5xl px-gutter md:mt-16">
        <div className="rounded-card border border-line bg-card p-card text-center md:p-10">
          <h2 className="text-title">Ready when you are</h2>
          <p className="mx-auto mt-2 max-w-xl text-body text-muted">Start planning now, and the same app is in your pocket when you land.</p>
          <div className="mt-6 flex justify-center"><OpenAppCta where="footer" /></div>
        </div>
      </section>
    </SiteFrame>
  );
}
