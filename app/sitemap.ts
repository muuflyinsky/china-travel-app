import type { MetadataRoute } from "next";
import { PUBLIC_PAGES, SITE } from "@/lib/seo";
import { guideUrls } from "@/lib/guides";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...PUBLIC_PAGES.map((p) => ({
      url: `${SITE}${p === "/" ? "" : p}`,
      changeFrequency: "weekly" as const,
      priority: p === "/" ? 1 : 0.7,
    })),
    ...guideUrls().map((g) => ({ url: g.url, alternates: { languages: g.languages }, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
