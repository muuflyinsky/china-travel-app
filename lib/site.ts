// The website around the app: /welcome (what HaodeGo is) and /guide/* (answers travellers search for).
// These pages are server-rendered so search engines can read them; the app's own pages are not
// (they build everything from localStorage in the browser). The iOS app never links here.
// Copy is English only for now (workspace inbox/2026-11-04-website-官网方案.md); other languages get
// their own URLs (/de/welcome …) when they are written, never a half-translated page.

/** Canonical origin. Vercel currently redirects the bare domain to www; switch that the other way
 *  round (www → haodego.com) when this ships, so canonical URLs don't point at a redirect. */
export const SITE_URL = "https://haodego.com";

/** App Store listing (App Store Connect app 6829347376). Off until 1.0 is approved and live:
 *  showing a badge for an app you can't download would be untrue. */
export const APP_STORE_LIVE = false;
export const APP_STORE_ID = "6829347376";
export const APP_STORE_URL = `https://apps.apple.com/app/id${APP_STORE_ID}`;

export type GuideLink = { href: string; title: string; blurb: string };

export const GUIDES: GuideLink[] = [
  {
    href: "/guide/first-trip-to-china",
    title: "First trip to China: what to sort out before you go",
    blurb: "Entry, payments, mobile data, apps, trains and the small things nobody tells you.",
  },
  {
    href: "/guide/china-arrival-card",
    title: "China arrival card online: the free official form",
    blurb: "Fill it in on your phone before you land, and how to avoid the sites that charge for it.",
  },
  {
    href: "/guide/china-tax-refund",
    title: "Tax refund in China: how to get about 11% back at the airport",
    blurb: "What to do in the shop, the four steps at the airport, and where the counters are.",
  },
];

/** Every URL the sitemap lists, with the date its content was last checked. */
export const SITE_PAGES: { path: string; updated: string }[] = [
  { path: "/welcome", updated: "2026-11-04" },
  { path: "/guide", updated: "2026-11-04" },
  ...GUIDES.map((g) => ({ path: g.href, updated: "2026-11-04" })),
];
