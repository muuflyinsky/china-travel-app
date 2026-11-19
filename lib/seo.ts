import type { Metadata } from "next";

/** The address search engines should index; haodego.com redirects here. */
export const SITE = "https://www.haodego.com";
export const SITE_NAME = "HaodeGo";

/**
 * Title, description, canonical and link-preview tags for one public page.
 * Each page sets its own openGraph so the root's og:url ("/") isn't inherited everywhere.
 */
export function pageMeta(path: string, title: string, description: string, opts: { noindex?: boolean } = {}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, siteName: SITE_NAME, url: path, type: "website" },
    twitter: { card: "summary", title, description },
    ...(opts.noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

/** Public app pages, for the sitemap. Settings and the old redirect paths are left out. */
export const PUBLIC_PAGES = ["/", "/explore", "/menu", "/stay", "/talk", "/driver", "/airport", "/sos", "/tax-refund", "/support", "/privacy"] as const;
