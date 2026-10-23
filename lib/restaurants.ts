import DATA from "./data/restaurant-awards.json";
import { searchPlaces, type Place } from "./amap";
import { demo } from "./config";
import { awardScore, cityAdcode, sameRestaurant, type AwardList, type AwardRestaurant } from "./restaurant-awards";

type ListMeta = { name: string; edition: string; source: string; checked: string };
type Data = { lists: Record<AwardList, ListMeta>; restaurants: AwardRestaurant[] };

// Sample entries for demo mode only. The names are fictional on purpose: a made-up award on a
// real restaurant would be misinformation even in a demo.
const SAMPLE: Data = {
  lists: {
    michelin: { name: "MICHELIN Guide", edition: "sample", source: "", checked: "" },
    black_pearl: { name: "Black Pearl Restaurant Guide", edition: "sample", source: "", checked: "" },
    dianping: { name: "Dianping Must-Eat List", edition: "sample", source: "", checked: "" },
  },
  restaurants: [
    { city: "310000", zh: "示例本帮菜馆(外滩店)", en: "Sample Shanghainese Kitchen", cuisine: "本帮菜", awards: [{ list: "michelin", level: "1", edition: "sample" }, { list: "black_pearl", level: "2", edition: "sample" }] },
    { city: "310000", zh: "示例小笼馆(豫园店)", en: "Sample Dumpling House", cuisine: "小吃", awards: [{ list: "michelin", level: "bib", edition: "sample" }, { list: "dianping", level: "must_eat", edition: "sample" }] },
    { city: "310000", zh: "示例粤菜酒家", en: "Sample Cantonese Restaurant", cuisine: "粤菜", awards: [{ list: "black_pearl", level: "1", edition: "sample" }] },
    { city: "310000", zh: "示例生煎铺(南京西路店)", en: "Sample Pan-fried Bun Shop", cuisine: "小吃", awards: [{ list: "dianping", level: "must_eat", edition: "sample" }] },
  ],
};

const data = (): Data => (demo.maps ? SAMPLE : (DATA as Data));
export const awardLists = () => data().lists;

/** Awards for a map result, if it matches a listed restaurant in the same city. */
export function awardsFor(p: Place) {
  const city = cityAdcode(p.adcode);
  const hits = data().restaurants.filter((r) => (!city || r.city === city) && sameRestaurant(r.zh, p.name));
  return hits.flatMap((r) => r.awards);
}

export function withAwards(places: Place[]) {
  return places.map((p) => {
    const awards = awardsFor(p);
    return awards.length ? { ...p, awards } : p;
  });
}

const resolved = new Map<string, { at: number; poi: Place | null }>();

/** Award-winning restaurants in a city, best first, each matched to its map entry when possible. */
export async function awardRestaurants(city: string, limit = 8) {
  const list = data().restaurants.filter((r) => r.city === city).sort((a, b) => awardScore(b.awards) - awardScore(a.awards)).slice(0, limit);
  return Promise.all(list.map(async (r) => {
    if (demo.maps) return { ...r, poi: null };
    const key = `${city}:${r.zh}`;
    const hit = resolved.get(key);
    if (hit && Date.now() - hit.at < 864e5) return { ...r, poi: hit.poi };
    const found = await searchPlaces({ keywords: r.zh, types: "050000", city }).catch(() => []);
    const poi = found.find((p) => sameRestaurant(r.zh, p.name)) ?? null;
    resolved.set(key, { at: Date.now(), poi });
    return { ...r, poi };
  }));
}
