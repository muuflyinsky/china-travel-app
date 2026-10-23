import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Menu photos are sent as base64 to /api/menu
  experimental: { serverActions: { bodySizeLimit: "8mb" } },
};

export default nextConfig;
