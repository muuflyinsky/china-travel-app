export const config = {
  // Primary AI: any OpenAI-compatible endpoint (default: Alibaba Cloud Model Studio). Model Studio
  // keys only work in the region they were created in, so without AI_BASE_URL both the
  // international (Singapore) and the mainland (Beijing) endpoints are tried. AI_BASE_URL may list
  // several endpoints, comma-separated.
  ai: {
    baseUrls: process.env.AI_BASE_URL
      ? process.env.AI_BASE_URL.split(",").map((u) => u.trim().replace(/\/$/, "")).filter(Boolean)
      : ["https://dashscope-intl.aliyuncs.com/compatible-mode/v1", "https://dashscope.aliyuncs.com/compatible-mode/v1"],
    // Pasted keys often carry a trailing newline or quotes, which the API rejects as invalid.
    key: (process.env.AI_API_KEY ?? "").trim().replace(/^["']|["']$/g, ""),
    visionModel: process.env.AI_MODEL_VISION || "qwen-vl-max",
    textModel: process.env.AI_MODEL_TEXT || "qwen-plus",
  },
  // Optional alternative: Claude, used only when AI_API_KEY is not set.
  anthropicKey: process.env.ANTHROPIC_API_KEY ?? "",
  model: process.env.CLAUDE_MODEL || "claude-opus-5-5",
  amapKey: process.env.AMAP_KEY ?? "",
  trip: {
    allianceId: process.env.TRIP_ALLIANCE_ID ?? "",
    sid: process.env.TRIP_SID ?? "",
    // Placement id from the affiliate dashboard link (e.g. D20512235); sent unchanged on every link.
    sub3: process.env.TRIP_SUB3 ?? "",
    host: process.env.TRIP_HOST || "www.trip.com",
  },
  fliggyPid: process.env.FLIGGY_PID ?? "",
  /** Affiliate tracking links per eSIM provider, e.g. ESIM_AIRALO_URL=https://airalo.pxf.io/… */
  esimUrl: (id: string) => process.env[`ESIM_${id.toUpperCase()}_URL`] ?? "",
};

export const aiProvider: "openai" | "anthropic" | null = config.ai.key ? "openai" : config.anthropicKey ? "anthropic" : null;

/**
 * Sample data is for development only. In production a missing key means the feature is
 * unavailable (the API answers 503 and logs it); set ALLOW_SAMPLE_DATA=1 for a public demo.
 */
export const sampleAllowed = process.env.NODE_ENV !== "production" || process.env.ALLOW_SAMPLE_DATA === "1";

export const demo = {
  ai: !aiProvider && sampleAllowed,
  maps: !config.amapKey && sampleAllowed,
};
