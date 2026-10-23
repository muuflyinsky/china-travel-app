export const config = {
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
  airaloRef: process.env.AIRALO_REF ?? "",
};

export const demo = {
  ai: !config.anthropicKey,
  maps: !config.amapKey,
};
