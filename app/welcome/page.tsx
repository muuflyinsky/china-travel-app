// What HaodeGo is, for people who find it on the web. Server-rendered so search engines can read it.
// Positioning (Veer, 2026-11-04): one calm place for the whole trip, not any single feature.
// Redesign (Veer, 2026-11-05): less text, more motion and imagery, light mode only; no new logo or
// illustrations, so the visuals are the app's real screens and its large Chinese show-cards.
// Every claim is something the app does today (docs/SPEC.md); no ratings, reviews or counts.
// Motion lives in globals.css (.site-*), CSS only, and stops under prefers-reduced-motion.
import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck, PlaneLanding, Compass, PlaneTakeoff, UserX, Smartphone, BadgeX } from "lucide-react";
import { SiteFrame, OpenAppCta } from "@/components/site/SiteFrame";
import { GUIDES, SITE_URL } from "@/lib/site";

const title = "HaodeGo: the China travel app for visa, payments, menus and getting around";
const description =
  "Everything you need for a trip to mainland China in one app: visa-free check, Alipay and WeChat Pay setup, menus in your language, taxi cards, metro routes and translation. Free to start, no account.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/welcome" },
  openGraph: { title, description, url: "/welcome", siteName: "HaodeGo", type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

/** Real App Store screens, shown one after another in the hero phone. */
const SCREENS = [
  { src: "/site/04-explore.webp", alt: "Explore: top picks in Shanghai with a taxi card and route for each" },
  { src: "/site/05-route.webp", alt: "Route: bus and metro options with fares, stop names in pinyin and Chinese" },
  { src: "/site/01-menu-results.webp", alt: "Eat: a Chinese menu read into English, each dish checked for the traveller’s allergies" },
  { src: "/site/03-order-card.webp", alt: "Order card in large Chinese for the waiter" },
  { src: "/site/06-talk.webp", alt: "Talk: English translated into Chinese with pinyin" },
];

const CHIPS = [
  { label: "Taxi card in Chinese", pos: "left-0 top-[14%]" },
  { label: "Menus in your language", pos: "right-0 top-[34%]" },
  { label: "Routes with fares", pos: "left-[2%] top-[58%]" },
  { label: "Alipay in one tap", pos: "right-[4%] top-[78%]" },
];

const STEPS = [
  { Icon: CalendarCheck, when: "Before you go", line: "Visa check, payments, data and apps." },
  { Icon: PlaneLanding, when: "The day you land", line: "Your hotel address, ready for the driver." },
  { Icon: Compass, when: "Every day", line: "Menus, routes, taxis, paying and talking." },
  { Icon: PlaneTakeoff, when: "Leaving", line: "Airport on time, tax refund back." },
];

const TRUST = [
  { Icon: UserX, text: "No account" },
  { Icon: Smartphone, text: "Your trip stays on your phone" },
  { Icon: BadgeX, text: "No ads" },
];

const FAQ = [
  { q: "Is HaodeGo free?", a: "You can start for free: open haodego.com in your phone’s browser, with no account to create. The allergy check, allergy card and emergency help are always free." },
  { q: "Is there an iPhone app?", a: "An iPhone app is on its way to the App Store. Until then, open haodego.com in Safari and add it to your Home Screen." },
  { q: "Does it work without internet?", a: "No. Reading menus, maps and translation need a connection, so set up a travel eSIM or a local SIM card first." },
  { q: "Can I rely on the allergy check?", a: "Use it as a guide, not a guarantee. Ingredients are inferred from common recipes, and a severe allergy never gets a green answer. Always show your allergy card and confirm with staff." },
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
        operatingSystem: "Any (web browser)",
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

      {/* Hero: one promise, one button, the app itself moving through the trip */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="site-glow pointer-events-none absolute inset-x-0 top-0 h-[560px]" />
        <div className="relative mx-auto grid max-w-5xl items-center gap-10 px-gutter pt-10 pb-6 md:grid-cols-[1.1fr_1fr] md:pt-20 md:pb-16">
          <div className="site-rise">
            <h1 className="text-large-title text-balance md:text-hero">Everything you need in China, in one app.</h1>
            <p className="mt-4 text-body text-muted text-pretty md:text-title md:font-normal">One calm place for the whole trip. Clear answers, no hunting around.</p>
            <div className="mt-8"><OpenAppCta where="hero" /></div>
          </div>
          <div className="site-rise relative mx-auto h-[500px] w-full max-w-[380px] md:h-[600px]" style={{ animationDelay: "150ms" }}>
            <div className="site-phone absolute left-1/2 top-0 h-[480px] w-[222px] -translate-x-1/2 overflow-hidden rounded-[36px] border-[7px] border-ink bg-card shadow-float md:h-[574px] md:w-[264px]">
              {SCREENS.map((s, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={s.src} src={s.src} alt={s.alt} width={660} height={1434} loading={i === 0 ? "eager" : "lazy"}
                  fetchPriority={i === 0 ? "high" : undefined}
                  className="site-screen absolute inset-0 h-full w-full object-cover object-top" style={{ animationDelay: `${i * 3 - 0.6}s` }} />
              ))}
            </div>
            {CHIPS.map((c, i) => (
              <span key={c.label} className={`site-chip absolute ${c.pos} rounded-full border border-line bg-card px-3 py-2 text-footnote font-semibold shadow-bar md:text-subhead`}
                style={{ animationDelay: `${i * 0.8}s` }}>
                {c.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* The signature moment: a card the driver can read */}
      <section className="mx-auto mt-section max-w-5xl px-gutter md:mt-20">
        <div className="site-reveal grid items-center gap-8 overflow-hidden rounded-[28px] bg-cobalt p-6 text-white md:grid-cols-2 md:p-12">
          <div>
            <h2 className="text-large-title">Show this. They’ll understand.</h2>
            <p className="mt-3 text-body text-white/80">Large Chinese cards for drivers, waiters and shop staff, with your language underneath.</p>
          </div>
          <div className="site-card rounded-card bg-card p-6 text-ink shadow-float">
            <p lang="zh-CN" className="zh text-title text-muted">师傅您好，请带我去：</p>
            <p lang="zh-CN" className="zh mt-1 text-display-zh">豫园</p>
            <p lang="zh-CN" className="zh mt-2 text-headline">地址：上海市黄浦区福佑路168号</p>
            <p className="mt-4 border-t border-line pt-3 text-subhead text-muted">Hello driver, please take me to: Yu Garden</p>
          </div>
        </div>
      </section>

      {/* The trip in four steps */}
      <section className="mx-auto mt-section max-w-5xl px-gutter md:mt-20">
        <h2 className="site-reveal text-large-title text-balance">From planning to flying home</h2>
        <ol className="mt-8 grid grid-cols-2 gap-stack lg:grid-cols-4">
          {STEPS.map(({ Icon, when, line }) => (
            <li key={when} className="site-reveal rounded-card border border-line bg-card p-card">
              <span className="grid h-12 w-12 place-items-center rounded-control bg-cobalt-soft text-cobalt"><Icon className="h-6 w-6" aria-hidden /></span>
              <h3 className="mt-4 text-headline">{when}</h3>
              <p className="mt-1 text-subhead text-muted text-pretty">{line}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Real screens, drifting past */}
      <section className="mt-section overflow-hidden md:mt-20" aria-label="Screens from the app">
        <ul className="site-marquee flex w-max gap-stack py-2">
          {[...SCREENS, ...SCREENS].map((s, i) => (
            <li key={i} aria-hidden={i >= SCREENS.length || undefined} className="w-[180px] shrink-0 md:w-[220px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.src} alt={i < SCREENS.length ? s.alt : ""} width={660} height={1434} loading="lazy" className="w-full rounded-[22px] border border-line" />
            </li>
          ))}
        </ul>
      </section>

      {/* Trust, in one row */}
      <section className="mx-auto mt-section max-w-5xl px-gutter md:mt-16">
        <ul className="site-reveal flex flex-wrap justify-center gap-x-8 gap-y-3 text-headline">
          {TRUST.map(({ Icon, text }) => (
            <li key={text} className="flex items-center gap-2"><Icon className="h-5 w-5 text-cobalt" aria-hidden />{text}</li>
          ))}
        </ul>
      </section>

      {/* FAQ */}
      <section className="mx-auto mt-section max-w-3xl px-gutter md:mt-20">
        <h2 className="text-title">Questions</h2>
        <div className="mt-4 divide-y divide-line rounded-card border border-line bg-card">
          {FAQ.map((f) => (
            <details key={f.q} className="group px-4">
              <summary className="flex min-h-control cursor-pointer list-none items-center justify-between gap-3 py-3 text-headline [&::-webkit-details-marker]:hidden">
                {f.q}<span aria-hidden className="text-muted transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="pb-4 text-body text-muted text-pretty">{f.a}</p>
            </details>
          ))}
        </div>
        <p className="mt-4 text-subhead text-muted">
          More answers in the guides:{" "}
          {GUIDES.map((g, i) => (
            <span key={g.href}>{i > 0 && " · "}<Link href={g.href} className="font-semibold text-cobalt">{g.title.split(":")[0]}</Link></span>
          ))}
        </p>
      </section>

      {/* Closing call to action */}
      <section className="mx-auto mt-section max-w-5xl px-gutter md:mt-20">
        <div className="site-reveal rounded-[28px] bg-ink p-8 text-center text-porcelain md:p-14">
          <h2 className="text-large-title text-balance">Start planning now. It’s in your pocket when you land.</h2>
          <a href="/" data-cta="closing" className="mt-8 inline-flex min-h-control items-center justify-center rounded-control bg-card px-8 text-headline text-ink">Open HaodeGo</a>
          <p className="mt-3 text-subhead opacity-70">Free to start · no account</p>
        </div>
      </section>
    </SiteFrame>
  );
}
