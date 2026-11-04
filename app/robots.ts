import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Crawlers may read everything except API routes and the per-device settings screen.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/settings"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
