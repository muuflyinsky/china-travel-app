import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

// Website pages resolve canonical and share URLs against the www origin (lib/site.ts SITE_URL).
export const metadata: Metadata = { metadataBase: new URL(SITE_URL) };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
