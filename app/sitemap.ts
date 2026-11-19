import type { MetadataRoute } from "next";
import { PUBLIC_PAGES, SITE } from "@/lib/seo";
import { SITE_PAGES } from "@/lib/site";
import { guideUrls } from "@/lib/guides";

// The app's public screens (lib/seo.ts), the website pages (/welcome, /guide/*) and the city
// guides in 6 languages (/{lang}/guides/…, only pages with checked facts).
export default function sitemap(): MetadataRoute.Sitemap {
  const app: MetadataRoute.Sitemap = PUBLIC_PAGES.map((p) => ({
    url: `${SITE}${p === "/" ? "" : p}`,
    changeFrequency: "weekly",
    priority: p === "/" ? 1 : 0.7,
  }));
  const site: MetadataRoute.Sitemap = SITE_PAGES.map((p) => ({ url: `${SITE}${p.path}`, lastModified: p.updated, priority: 0.8 }));
  const guides: MetadataRoute.Sitemap = guideUrls().map((g) => ({ url: g.url, alternates: { languages: g.languages }, changeFrequency: "monthly", priority: 0.6 }));
  return [...app, ...site, ...guides];
}
