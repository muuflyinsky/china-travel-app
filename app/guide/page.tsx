// Index of the website guides (lib/site.ts GUIDES).
import type { Metadata } from "next";
import Link from "next/link";
import { SiteFrame, Prose } from "@/components/site/SiteFrame";
import { GUIDES } from "@/lib/site";

const title = "China travel guides: clear answers before and during your trip";
const description = "Short, checked guides for travelling in mainland China: what to sort out before you go, the online arrival card, and the departure tax refund.";

export const metadata: Metadata = {
  title: `${title} | HaodeGo`,
  description,
  alternates: { canonical: "/guide" },
  openGraph: { title, description, url: "/guide", siteName: "HaodeGo", type: "website" },
};

export default function GuideIndex() {
  return (
    <SiteFrame>
      <Prose>
        <h1 className="pt-8 text-large-title">China travel guides</h1>
        <p className="mt-3 text-body text-muted">Short answers to the questions every visitor has, with where each fact comes from and when we last checked it.</p>
        <ul className="mt-6 space-y-stack">
          {GUIDES.map((g) => (
            <li key={g.href}>
              <Link href={g.href} className="block rounded-card border border-line bg-card p-card">
                <span className="block text-headline text-cobalt">{g.title}</span>
                <span className="mt-1 block text-subhead text-muted">{g.blurb}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Prose>
    </SiteFrame>
  );
}
