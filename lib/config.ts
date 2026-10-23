const DASHSCOPE_INTL = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";
const DASHSCOPE_CN = "https://dashscope.aliyuncs.com/compatible-mode/v1";

/** A Model Studio URL for one region also gets the other region as a fallback for the key. */
function withOtherRegion(urls: string[]) {
  const out = [...urls];
  if (urls.includes(DASHSCOPE_INTL) && !urls.includes(DASHSCOPE_CN)) out.push(DASHSCOPE_CN);
  if (urls.includes(DASHSCOPE_CN) && !urls.includes(DASHSCOPE_INTL)) out.push(DASHSCOPE_INTL);
  return out;
}

export const config = {
  // Primary AI: any OpenAI-compatible endpoint (default: Alibaba Cloud Model Studio). Model Studio
  // keys only work in the region they were created in, so without AI_BASE_URL both the
  // international (Singapore) and the mainland (Beijing) endpoints are tried. AI_BASE_URL may list
  // several endpoints, comma-separated.
  ai: {
    baseUrls: withOtherRegion(process.env.AI_BASE_URL
      ? process.env.AI_BASE_URL.split(",").map((u) => u.trim().replace(/\/$/, "")).filter(Boolean)
      : [DASHSCOPE_INTL, DASHSCOPE_CN]),
    // Pasted keys often carry a trailing newline or quotes, which the API rejects as invalid.
    key: (process.env.AI_API_KEY ?? "").trim().replace(/^["']|["']$/g, ""),
    // Tried in order until one exists for this key (names differ by region and get retired).
    visionModels: [...new Set([process.env.AI_MODEL_VISION || "qwen3-vl-plus", "qwen3-vl-plus", "qwen-vl-max", "qwen-vl-max-latest", "qwen3-vl-flash", "qwen-vl-plus"])],
    textModels: [...new Set([process.env.AI_MODEL_TEXT || "qwen-plus", "qwen-plus", "qwen-plus-latest", "qwen3.6-flash", "qwen-turbo"])],
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
