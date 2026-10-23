"use client";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { App, Page, Navbar, Tabbar, TabbarLink } from "konsta/react";
import { House, UtensilsCrossed, Navigation, BedDouble, Languages } from "lucide-react";
import { useEffect, useState } from "react";

// Five top-level sections (iOS HIG: 2–5 tabs). Trip prep lives on Today.
const TABS = [
  { href: "/", label: "Today", Icon: House },
  { href: "/menu", label: "Eat", Icon: UtensilsCrossed },
  { href: "/go", label: "Go", Icon: Navigation },
  { href: "/stay", label: "Stay", Icon: BedDouble },
  { href: "/talk", label: "Talk", Icon: Languages },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => { setDark(mq.matches); document.documentElement.classList.toggle("dark", mq.matches); };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return <App theme="ios" dark={dark} safeAreas>{children}</App>;
}

export function Screen({ title, right, children, tabs = true }: { title: string; right?: React.ReactNode; children: React.ReactNode; tabs?: boolean }) {
  const path = usePathname();
  return (
    <Page colors={{ bgIos: "bg-porcelain" }}>
      <Navbar large transparent centerTitle title={title} right={right} />
      <div className="content">{children}</div>
      {tabs && (
        <Tabbar
          labels
          icons
          className="fixed! bottom-0 left-0 z-20"
          colors={{ bgIos: "bg-gradient-to-t from-porcelain via-porcelain/85 to-transparent" }}
          innerClassName="bg-card/95! backdrop-blur-xl rounded-full border border-line shadow-[0_8px_24px_rgb(26_31_46/0.12)]"
        >
          {TABS.map(({ href, label, Icon }) => {
            const active = href === "/" ? path === "/" : path.startsWith(href);
            return (
              <TabbarLink
                key={href}
                active={active}
                label={label}
                icon={<Icon className="h-6 w-6" strokeWidth={active ? 2.25 : 1.75} aria-hidden />}
                linkProps={{ component: NextLink, href, "aria-current": active ? "page" : undefined }}
              />
            );
          })}
        </Tabbar>
      )}
    </Page>
  );
}

/** Small neutral notice used once per screen when running on sample data. */
export function DemoNote({ show, what }: { show?: boolean; what: string }) {
  if (!show) return null;
  return (
    <p className="mx-4 my-2 rounded-xl bg-cobalt-soft px-3 py-2 text-[13px] text-cobalt">
      Sample data. Add <code className="font-mono">{what}</code> for live results.
    </p>
  );
}
