import type { NextConfig } from "next";

/** App screens that lived at the root until iOS 1.1 and now live under /app. */
const MOVED = ["menu", "explore", "stay", "talk", "settings", "driver", "sos", "airport", "tax-refund", "pay-codes"];

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image (ignored by Vercel).
  output: "standalone",
  // Menu photos are sent as base64 to /api/menu
  experimental: { serverActions: { bodySizeLimit: "8mb" }, globalNotFound: true },
  async redirects() {
    return [
      // The website has "/", the app "/app" (iOS 1.1). The iOS app (1.0 loads "/", user agent from
      // capacitor.config.ts) goes straight to the app; not permanent, "/" stays the website for others.
      // Home-screen shortcuts made before 1.1 are sent on in app/(app)/layout.tsx (only the browser knows).
      { source: "/", has: [{ type: "header", key: "user-agent", value: ".*ChinaTravelBuddy-iOS.*" }], destination: "/app", permanent: false },
      // Old links, bookmarks and search results: same screen at its new address (query strings carry over).
      ...MOVED.map((p) => ({ source: `/${p}/:rest*`, destination: `/app/${p}/:rest*`, permanent: true })),
      ...MOVED.map((p) => ({ source: `/${p}`, destination: `/app/${p}`, permanent: true })),
      { source: "/welcome", destination: "/", permanent: true },
      // Screens merged long ago (SPEC v0.4), kept for old links.
      { source: "/go", destination: "/app/explore", permanent: true },
      { source: "/:old(essentials|prepare|pay|esim)", destination: "/app", permanent: true },
    ];
  },
};

export default nextConfig;
