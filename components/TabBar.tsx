"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", ico: "🏠", label: "Home" },
  { href: "/menu", ico: "🍜", label: "Menu" },
  { href: "/go", ico: "🧭", label: "Go" },
  { href: "/stay", ico: "🏨", label: "Stay" },
  { href: "/talk", ico: "💬", label: "Talk" },
  { href: "/essentials", ico: "🧳", label: "Essentials" },
];

export function TabBar() {
  const path = usePathname();
  return (
    <nav className="tabbar">
      {TABS.map((t) => (
        <Link key={t.href} href={t.href} className={(t.href === "/" ? path === "/" : path.startsWith(t.href)) ? "active" : ""}>
          <span className="ico" aria-hidden>{t.ico}</span>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
