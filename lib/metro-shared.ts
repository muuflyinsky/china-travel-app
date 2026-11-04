// What the pages need from lib/metro.ts, without its server-only Amap imports.

export type MetroNear = { name: string; pinyin: string; lines: string[]; meters: number; others: number };

/** About 70 m a minute, rounded up: "about N min walk" to the nearest exit. */
export const walkMinutes = (meters: number) => Math.max(1, Math.ceil(meters / 70));
