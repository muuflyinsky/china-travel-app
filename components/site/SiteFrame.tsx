// Header and footer for the website pages (/welcome, /guide/*). Server-rendered, no app chrome.
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import { APP_STORE_LIVE, APP_STORE_URL } from "@/lib/site";

export function SiteFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="site min-h-full bg-porcelain text-ink">
      <header className="border-b border-line bg-card/90 backdrop-blur">
        <div className="mx-auto flex min-h-14 max-w-5xl items-center gap-3 px-gutter">
          <Link href="/welcome" className="flex min-h-touch items-center gap-2 text-headline">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.svg" alt="" width={28} height={28} className="rounded-[7px]" />
            HaodeGo
          </Link>
          <nav className="ml-auto flex items-center gap-1">
            <Link href="/guide" className="flex min-h-touch items-center px-3 text-subhead font-semibold text-cobalt">Guides</Link>
            <Link href="/" className="flex min-h-touch items-center rounded-control bg-cobalt px-4 text-subhead font-semibold text-white dark:text-[#12141c]">Open the app</Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="mt-section border-t border-line">
        <div className="mx-auto grid max-w-5xl gap-stack px-gutter py-8 text-subhead text-muted sm:grid-cols-[1fr_auto]">
          <div className="space-y-2">
            <p className="font-semibold text-ink">HaodeGo · China Travel Buddy</p>
            <p>Everything you need for a trip to mainland China, in one app, in your language. Free to use, no account.</p>
            <p className="text-footnote">Map data and place photos from Amap. Hotel, train and ticket links are affiliate links: we may earn a commission, at no extra cost to you.</p>
          </div>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 sm:flex-col">
            <li><Link href="/" className="font-semibold text-cobalt">Open HaodeGo</Link></li>
            {APP_STORE_LIVE && <li><a href={APP_STORE_URL} className="font-semibold text-cobalt">App Store</a></li>}
            <li><Link href="/guide" className="text-cobalt">Guides</Link></li>
            <li><Link href="/support" className="text-cobalt">Help & support</Link></li>
            <li><Link href="/privacy" className="text-cobalt">Privacy</Link></li>
          </ul>
        </div>
        <p className="mx-auto max-w-5xl px-gutter pb-8 text-footnote text-muted">© 2026 HaodeGo</p>
      </footer>
      <Analytics />
    </div>
  );
}

/** Narrow column for long-form guide text. */
export function Prose({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-2xl px-gutter">{children}</div>;
}

/** The one call to action: open the web app (and, once 1.0 is live, the App Store). */
export function OpenAppCta({ where }: { where: string }) {
  return (
    <div className="flex flex-wrap items-center gap-stack">
      <Link href="/" data-cta={where} className="inline-flex min-h-control items-center justify-center rounded-control bg-cobalt px-6 text-headline text-white dark:text-[#12141c]">
        Open HaodeGo, free
      </Link>
      {APP_STORE_LIVE ? (
        <a href={APP_STORE_URL} data-cta={`${where}-appstore`} className="inline-flex min-h-control items-center justify-center rounded-control border border-line bg-card px-5 text-headline">
          Get the iPhone app
        </a>
      ) : (
        <span className="text-subhead text-muted">Works in your phone’s browser. No download, no account.</span>
      )}
    </div>
  );
}
