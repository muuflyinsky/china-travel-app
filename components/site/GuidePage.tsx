// Frame for a /guide/* article: breadcrumb, title, "last checked" line, body, and how HaodeGo helps.
import Link from "next/link";
import { SiteFrame, Prose, OpenAppCta } from "./SiteFrame";
import { GUIDES } from "@/lib/site";

export function GuidePage({ title, intro, checked, appHelps, sources, path, children }: {
  title: string; intro: string; checked: string; appHelps: string; path: string;
  sources: { name: string; url: string }[]; children: React.ReactNode;
}) {
  const others = GUIDES.filter((g) => g.href !== path);
  return (
    <SiteFrame>
      <Prose>
        <nav aria-label="Breadcrumb" className="pt-6 text-footnote text-muted">
          <Link href="/welcome" className="text-cobalt">HaodeGo</Link> › <Link href="/guide" className="text-cobalt">Guides</Link>
        </nav>
        <article>
          <h1 className="mt-3 text-large-title text-balance">{title}</h1>
          <p className="mt-3 text-body text-muted text-pretty">{intro}</p>
          <p className="mt-2 text-footnote text-muted">Last checked {checked}</p>
          <div className="guide-body mt-6">{children}</div>
          <aside className="mt-section rounded-card bg-cobalt-soft p-card">
            <p className="text-headline">HaodeGo has this for you</p>
            <p className="mt-1 text-body">{appHelps}</p>
            <div className="mt-4"><OpenAppCta where={`guide${path.replace("/guide", "")}`} /></div>
          </aside>
          {sources.length > 0 && (
            <section className="mt-section">
              <h2 className="text-subhead font-semibold text-muted">Sources</h2>
              <ul className="mt-2 space-y-1 text-footnote">
                {sources.map((s) => <li key={s.url}><a href={s.url} rel="noopener" className="text-cobalt underline">{s.name}</a></li>)}
              </ul>
            </section>
          )}
        </article>
        <section className="mt-section">
          <h2 className="text-subhead font-semibold text-muted">More guides</h2>
          <ul className="mt-2 space-y-stack">
            {others.map((g) => (
              <li key={g.href}><Link href={g.href} className="block rounded-card border border-line bg-card p-card text-headline text-cobalt">{g.title}</Link></li>
            ))}
          </ul>
        </section>
      </Prose>
    </SiteFrame>
  );
}

/** A section heading plus its text, with consistent spacing inside a guide. */
export function G({ h, id, children }: { h: string; id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-section scroll-mt-4 first:mt-0">
      <h2 className="text-title">{h}</h2>
      <div className="mt-2 space-y-stack text-body">{children}</div>
    </section>
  );
}
