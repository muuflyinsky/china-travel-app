"use client";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { App, Page, Navbar, Tabbar, TabbarLink } from "konsta/react";
import { House, UtensilsCrossed, Compass, BedDouble, Languages, ChevronLeft, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { useT } from "./useT";
import { useProfile } from "./useProfile";
import { fmt, UI_DICTS } from "@/lib/i18n";

// Five top-level sections (iOS HIG: 2–5 tabs, always visible). Settings and Emergency are pushed
// screens with a back button; Pay, Mobile data and Before you go live inside Today.
const TABS = [
  { href: "/", key: "today", Icon: House },
  { href: "/menu", key: "eat", Icon: UtensilsCrossed },
  { href: "/explore", key: "go", Icon: Compass },
  { href: "/stay", key: "stay", Icon: BedDouble },
  { href: "/talk", key: "talk", Icon: Languages },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false);
  const [profile] = useProfile();
  // <html lang> follows the UI language, so screen readers, hyphenation and CJK fonts are right.
  useEffect(() => { document.documentElement.lang = profile.lang in UI_DICTS ? profile.lang : "en"; }, [profile.lang]);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => { setDark(mq.matches); document.documentElement.classList.toggle("dark", mq.matches); };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  // One centred column on every screen size, so navbar, content and tab bar always line up.
  return (
    <App theme="ios" dark={dark} safeAreas className="app-column">
      {children}
    </App>
  );
}

export function SettingsButton() {
  const t = useT();
  return (
    <NextLink href="/settings" aria-label={t.common.settings} className="grid h-touch w-touch shrink-0 place-items-center rounded-full border border-line bg-card text-cobalt">
      <Settings className="h-5 w-5" />
    </NextLink>
  );
}

/**
 * Top-level screens put the large title and Settings on one row that scrolls away with the
 * content (App Store style), instead of a 44px bar above a 52px title: content starts ~56px
 * higher. Pushed screens (back) keep the standard iOS navigation bar.
 */
export function Screen({ title, right, children, back }: { title: string; right?: React.ReactNode; children: React.ReactNode; back?: boolean }) {
  const path = usePathname();
  const router = useRouter();
  const t = useT();
  return (
    <Page colors={{ bgIos: "bg-porcelain" }}>
      {back ? (
        <Navbar
          large
          centerTitle
          title={title}
          left={
            <button onClick={() => (history.length > 1 ? router.back() : router.push("/"))} className="flex min-h-11 items-center pr-2 text-body text-cobalt">
              <ChevronLeft className="h-6 w-6" aria-hidden />{t.common.back}
            </button>
          }
          right={right}
        />
      ) : (
        <>
          <div className="status-scrim" aria-hidden />
          <header className="flex min-h-[52px] items-center gap-3 px-gutter pt-[max(12px,env(safe-area-inset-top))] pb-2">
            <h1 className="min-w-0 flex-1 truncate text-large-title">{title}</h1>
            {right ?? <SettingsButton />}
          </header>
        </>
      )}
      <div className="content px-4">{children}</div>
      <Tabbar
        labels
        icons
        className="tabbar-fixed z-20"
        colors={{ bgIos: "bg-gradient-to-t from-porcelain via-porcelain/85 to-transparent" }}
        innerClassName="bg-card/95! backdrop-blur-xl rounded-full border border-line shadow-bar"
      >
        {TABS.map(({ href, key, Icon }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <TabbarLink
              key={href}
              active={active}
              label={t.tabs[key]}
              icon={<Icon className="h-6 w-6" strokeWidth={active ? 2.25 : 1.75} aria-hidden />}
              linkProps={{ component: NextLink, href, "aria-current": active ? "page" : undefined }}
            />
          );
        })}
      </Tabbar>
    </Page>
  );
}

/** Small neutral notice used once per screen when running on sample data. */
export function DemoNote({ show, what }: { show?: boolean; what: string }) {
  const t = useT();
  if (!show) return null;
  return <p className="rounded-control bg-cobalt-soft px-3 py-2 text-footnote text-cobalt">{fmt(t.common.sampleData, { what })}</p>;
}
