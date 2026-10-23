import { pinyin } from "pinyin-pro";
import { config, demo } from "./config";
import * as mock from "./demo";

// Amap (高德) Web Service API. Docs: https://lbs.amap.com/api/webservice/summary
const BASE = "https://restapi.amap.com";

export type Place = {
  id: string;
  name: string;
  pinyin: string;
  address: string;
  city: string;
  citycode: string;
  location: string; // "lng,lat" GCJ-02
  type: string;
  tel?: string;
  rating?: string;
  cost?: string;
  photo?: string;
  distance?: string;
};

async function amap<T>(path: string, params: Record<string, string | undefined>): Promise<T> {
  const qs = new URLSearchParams({ key: config.amapKey });
  for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
  const res = await fetch(`${BASE}${path}?${qs}`, { next: { revalidate: 300 } });
  const data = await res.json();
  if (data.status !== "1") throw new Error(`Amap ${path}: ${data.info ?? "error"} (${data.infocode ?? ""})`);
  return data as T;
}

export function py(s: string) {
  return pinyin(s, { toneType: "none", type: "array" })
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
    .replace(/\s+([^A-Za-z])/g, "$1");
}

type RawPoi = {
  id: string; name: string; address: string | []; location: string; type: string;
  cityname: string; citycode: string; adname: string; distance?: string;
  business?: { tel?: string; rating?: string; cost?: string };
  photos?: { url: string }[];
};

function toPlace(p: RawPoi): Place {
  const address = Array.isArray(p.address) ? "" : p.address;
  return {
    id: p.id,
    name: p.name,
    pinyin: py(p.name),
    address: [p.cityname, p.adname, address].filter(Boolean).join(""),
    city: p.cityname,
    citycode: p.citycode,
    location: p.location,
    type: p.type,
    tel: p.business?.tel,
    rating: p.business?.rating,
    cost: p.business?.cost,
    photo: p.photos?.[0]?.url,
    distance: p.distance,
  };
}

export async function searchPlaces(q: { keywords?: string; city?: string; around?: string; types?: string; page?: number }) {
  if (demo.maps) return mock.places(q.keywords, q.types);
  const fields = { show_fields: "business,photos", page_size: "20", page_num: String(q.page ?? 1) };
  const data = q.around
    ? await amap<{ pois: RawPoi[] }>("/v5/place/around", {
        location: q.around, keywords: q.keywords, types: q.types, radius: "5000", sortrule: "distance", ...fields,
      })
    : await amap<{ pois: RawPoi[] }>("/v5/place/text", {
        keywords: q.keywords, types: q.types, region: q.city, city_limit: q.city ? "true" : undefined, ...fields,
      });
  return data.pois.map(toPlace);
}

export async function reverseGeocode(location: string) {
  if (demo.maps) return mock.regeo;
  const d = await amap<{ regeocode: { formatted_address: string; addressComponent: { city: string | []; province: string; citycode: string; adcode: string } } }>(
    "/v3/geocode/regeo", { location },
  );
  const c = d.regeocode.addressComponent;
  return {
    address: d.regeocode.formatted_address,
    city: Array.isArray(c.city) ? c.province : c.city, // municipalities return [] for city
    citycode: c.citycode,
    adcode: c.adcode,
  };
}

export type RouteOption = {
  mode: "transit" | "walking" | "driving";
  minutes: number;
  meters: number;
  priceCny?: number;
  summary: string;
  steps: { kind: "walk" | "subway" | "bus" | "rail" | "drive"; text: string; zh?: string }[];
};

type Transit = {
  cost: { duration: string; transit_fee?: string }; distance: string;
  segments: {
    walking?: { distance: string };
    bus?: { buslines: { name: string; type: string; departure_stop: { name: string }; arrival_stop: { name: string }; via_num: string }[] };
    railway?: { name: string; departure_stop: { name: string }; arrival_stop: { name: string } };
  }[];
};

function lineLabel(name: string) {
  // "地铁2号线(浦东国际机场--徐泾东)" -> "Metro Line 2"
  const m = name.match(/地铁(\d+)号线/);
  if (m) return `Metro Line ${m[1]}`;
  return py(name.replace(/\(.*\)/, ""));
}

export async function planRoutes(o: { origin: string; destination: string; citycode: string; destCitycode?: string }): Promise<RouteOption[]> {
  if (demo.maps) return mock.routes;
  const out: RouteOption[] = [];
  const [transit, walking, driving] = await Promise.allSettled([
    amap<{ route: { transits: Transit[] } }>("/v5/direction/transit/integrated", {
      origin: o.origin, destination: o.destination, city1: o.citycode, city2: o.destCitycode ?? o.citycode, show_fields: "cost", AlternativeRoute: "3",
    }),
    amap<{ route: { paths: { distance: string; cost: { duration: string } }[] } }>("/v5/direction/walking", {
      origin: o.origin, destination: o.destination, show_fields: "cost",
    }),
    amap<{ route: { taxi_cost?: string; paths: { distance: string; cost: { duration: string } }[] } }>("/v5/direction/driving", {
      origin: o.origin, destination: o.destination, show_fields: "cost",
    }),
  ]);

  if (transit.status === "fulfilled") {
    for (const t of transit.value.route.transits.slice(0, 3)) {
      const steps: RouteOption["steps"] = [];
      for (const s of t.segments) {
        if (s.walking && +s.walking.distance > 0) steps.push({ kind: "walk", text: `Walk ${s.walking.distance} m` });
        for (const b of s.bus?.buslines.slice(0, 1) ?? []) {
          const subway = b.type.includes("地铁");
          steps.push({
            kind: subway ? "subway" : "bus",
            text: `${lineLabel(b.name)}: ${py(b.departure_stop.name)} → ${py(b.arrival_stop.name)} (${+b.via_num + 1} stops)`,
            zh: `${b.name.replace(/\(.*\)/, "")}：${b.departure_stop.name} → ${b.arrival_stop.name}`,
          });
        }
        if (s.railway?.name) {
          steps.push({ kind: "rail", text: `Train ${s.railway.name}: ${py(s.railway.departure_stop.name)} → ${py(s.railway.arrival_stop.name)}`, zh: s.railway.name });
        }
      }
      out.push({
        mode: "transit",
        minutes: Math.round(+t.cost.duration / 60),
        meters: +t.distance,
        priceCny: t.cost.transit_fee ? +t.cost.transit_fee : undefined,
        summary: steps.filter((x) => x.kind !== "walk").map((x) => x.text.split(":")[0]).join(" → ") || "Walk",
        steps,
      });
    }
  }
  if (walking.status === "fulfilled" && walking.value.route.paths[0]) {
    const p = walking.value.route.paths[0];
    if (+p.distance < 5000) out.push({ mode: "walking", minutes: Math.round(+p.cost.duration / 60), meters: +p.distance, summary: "Walk", steps: [] });
  }
  if (driving.status === "fulfilled" && driving.value.route.paths[0]) {
    const p = driving.value.route.paths[0];
    out.push({
      mode: "driving", minutes: Math.round(+p.cost.duration / 60), meters: +p.distance,
      priceCny: driving.value.route.taxi_cost ? Math.round(+driving.value.route.taxi_cost) : undefined,
      summary: "Taxi / DiDi", steps: [],
    });
  }
  return out;
}

export async function weather(adcode: string) {
  if (demo.maps) return mock.weather;
  const d = await amap<{ forecasts: { city: string; casts: { date: string; dayweather: string; daytemp: string; nighttemp: string }[] }[] }>(
    "/v3/weather/weatherInfo", { city: adcode, extensions: "all" },
  );
  return d.forecasts[0];
}
