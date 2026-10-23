import HOT from "./data/hot-cities.json";

/**
 * Cities that get an automatic city guide (top sights + signature dishes). The list is also read
 * by scripts/build-city-guides.mjs, which pre-generates every guide into public/city-guide/.
 * Add a city here (adcode from lib/data/cities.json) and the next monthly run covers it.
 */
export const HOT_CITIES: { a: string; s: string; e: string }[] = HOT;
export const isHotCity = (adcode: string) => HOT_CITIES.some((c) => c.a === adcode);
