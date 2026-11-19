import type { Metadata } from "next";

// The app's home (Today). Since iOS 1.1 the app lives under /app and the website has "/";
// each screen below sets its own canonical with pageMeta (lib/seo.ts).
export const metadata: Metadata = {
  alternates: { canonical: "/app" },
  openGraph: { title: "HaodeGo: China Travel Buddy", siteName: "HaodeGo", url: "/app", type: "website" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
