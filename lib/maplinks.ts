// Deep links that open the native map app with turn-by-turn navigation.
// Coordinates are GCJ-02, which both Amap and Apple Maps (China region) expect.
export function amapNav(to: { location: string; name: string }, mode: "bus" | "car" | "walk", from?: { location: string; name: string }) {
  const qs = new URLSearchParams({
    to: `${to.location},${to.name}`, mode, policy: "1", src: "chinatravelguide", coordinate: "gaode", callnative: "1",
  });
  if (from) qs.set("from", `${from.location},${from.name}`);
  return `https://uri.amap.com/navigation?${qs}`;
}

export function appleNav(to: { location: string; name: string }, mode: "r" | "d" | "w") {
  const [lng, lat] = to.location.split(",");
  return `https://maps.apple.com/?daddr=${lat},${lng}&q=${encodeURIComponent(to.name)}&dirflg=${mode}`;
}
