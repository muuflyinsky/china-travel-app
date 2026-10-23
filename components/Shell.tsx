"use client";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { App, Page, Navbar, Tabbar, TabbarLink } from "konsta/react";
import { House, UtensilsCrossed, Navigation, BedDouble, Languages, ChevronLeft, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { useT } from "./useT";
import { fmt } from "@/lib/i18n";

// Five top-level sections (iOS HIG: 2–5 tabs). Settings, Pay, Mobile data, Before you go and
// Emergency are pushed screens with a back button.
const TABS = [
  { href: "/", key: "today", Icon: House },
  { href: "/menu", key: "eat", Icon: UtensilsCrossed },
  { href: "/go", key: "go", Icon: Navigation },
  { href: "/stay", key: "stay", Icon: BedDouble },
  { href: "/talk", key: "talk", Icon: Languages },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false);
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
    <NextLink href="/settings" aria-label={t.common.settings} className="grid h-11 w-11 place-items-center text-cobalt">
      <Settings className="h-6 w-6" />
    </NextLink>
  );
}

export function Screen({ title, right, children, back }: { title: string; right?: React.ReactNode; children: React.ReactNode; back?: boolean }) {
  const path = usePathname();
  const router = useRouter();
  const t = useT();
  return (
    <Page colors={{ bgIos: "bg-porcelain" }}>
      <Navbar
        large
        transparent={!back}
        centerTitle
        title={title}
        left={back ? (
          <button onClick={() => (history.length > 1 ? router.back() : router.push("/"))} className="flex min-h-11 items-center pr-2 text-[17px] text-cobalt">
            <ChevronLeft className="h-6 w-6" aria-hidden />{t.common.back}
          </button>
        ) : undefined}
        right={right ?? (back ? undefined : <SettingsButton />)}
      />
      <div className="content px-4">{children}</div>
      <Tabbar
        labels
        icons
        className="tabbar-fixed z-20"
        colors={{ bgIos: "bg-gradient-to-t from-porcelain via-porcelain/85 to-transparent" }}
        innerClassName="bg-card/95! backdrop-blur-xl rounded-full border border-line shadow-[0_8px_24px_rgb(26_31_46/0.12)]"
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
  return <p className="rounded-xl bg-cobalt-soft px-3 py-2 text-[13px] text-cobalt">{fmt(t.common.sampleData, { what })}</p>;
}
