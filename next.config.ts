import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image (ignored by Vercel).
  output: "standalone",
  // Menu photos are sent as base64 to /api/menu
  experimental: { serverActions: { bodySizeLimit: "8mb" } },
};

export default nextConfig;
