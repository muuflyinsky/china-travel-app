import type { MetadataRoute } from "next";
import { PUBLIC_PAGES, SITE } from "@/lib/seo";
import { SITE_PAGES } from "@/lib/site";

// The app's public screens (lib/seo.ts) and the server-rendered website pages (/welcome, /guide/*).
export default function sitemap(): MetadataRoute.Sitemap {
  const app: MetadataRoute.Sitemap = PUBLIC_PAGES.map((p) => ({
    url: `${SITE}${p === "/" ? "" : p}`,
    changeFrequency: "weekly",
    priority: p === "/" ? 1 : 0.7,
  }));
  const site: MetadataRoute.Sitemap = SITE_PAGES.map((p) => ({ url: `${SITE}${p.path}`, lastModified: p.updated, priority: 0.8 }));
  return [...app, ...site];
}
