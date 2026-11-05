import type { MetadataRoute } from "next";
import { PUBLIC_PAGES, SITE } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PAGES.map((p) => ({
    url: `${SITE}${p === "/" ? "" : p}`,
    changeFrequency: "weekly",
    priority: p === "/" ? 1 : 0.7,
  }));
}
