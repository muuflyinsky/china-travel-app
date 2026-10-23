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
  district?: string;
  adcode?: string; // district adcode
  awards?: import("./restaurant-awards").Award[];
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
  cityname: string; citycode: string; adname: string; adcode?: string; distance?: string;
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
    district: p.adname,
    adcode: p.adcode,
  };
}

export async function searchPlaces(q: { keywords?: string; city?: string; around?: string; types?: string; page?: number; radius?: number; pageSize?: number }) {
  if (demo.maps) return mock.places(q.keywords, q.types);
  const fields = { show_fields: "business,photos", page_size: String(q.pageSize ?? 20), page_num: String(q.page ?? 1) };
  const data = q.around
    ? await amap<{ pois: RawPoi[] }>("/v5/place/around", {
        location: q.around, keywords: q.keywords, types: q.types, radius: String(q.radius ?? 5000), sortrule: "distance", ...fields,
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

export async function weather(adcode: string) {
  if (demo.maps) return mock.weather;
  const d = await amap<{ forecasts: { city: string; casts: { date: string; dayweather: string; daytemp: string; nighttemp: string }[] }[] }>(
    "/v3/weather/weatherInfo", { city: adcode, extensions: "all" },
  );
  return d.forecasts[0];
}
