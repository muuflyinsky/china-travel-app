import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";

// Crawlers may read everything except API routes and the per-device settings screen.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/settings"] },
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
