export const config = {
  anthropicKey: process.env.ANTHROPIC_API_KEY ?? "",
  model: process.env.CLAUDE_MODEL || "claude-opus-5-5",
  amapKey: process.env.AMAP_KEY ?? "",
  trip: {
    allianceId: process.env.TRIP_ALLIANCE_ID ?? "",
    sid: process.env.TRIP_SID ?? "",
    host: process.env.TRIP_HOST || "www.trip.com",
  },
  fliggyPid: process.env.FLIGGY_PID ?? "",
  airaloRef: process.env.AIRALO_REF ?? "",
};

export const demo = {
  ai: !config.anthropicKey,
  maps: !config.amapKey,
};
