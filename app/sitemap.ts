import type { MetadataRoute } from "next";
import { SITE_PAGES, SITE_URL } from "@/lib/site";

// Only the server-rendered website pages: the app's own screens are built in the browser and have
// nothing for a search engine to read.
export default function sitemap(): MetadataRoute.Sitemap {
  return SITE_PAGES.map((p) => ({ url: `${SITE_URL}${p.path}`, lastModified: p.updated }));
}
