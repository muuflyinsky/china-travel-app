// Durable JSON cache for computed content (city guides, hotel picks): the Supabase table
// app_cache (supabase/migrations/0007) when the service role key is set, otherwise
// data/<ns>/<key>.json for local development. Reads and writes never throw: a cache problem
// means recomputing, not an error page.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { rest, supabaseOn } from "./supabase";

const file = (ns: string, key: string) => `data/${ns}/${key.replace(/[^0-9a-z.@_-]/gi, "_")}.json`;

export async function cacheRead<T>(ns: string, key: string): Promise<T | null> {
  try {
    if (supabaseOn) {
      const rows = (await rest(`app_cache?select=value&ns=eq.${encodeURIComponent(ns)}&key=eq.${encodeURIComponent(key)}`)) as { value: T }[];
      return rows[0]?.value ?? null;
    }
    return JSON.parse(await readFile(file(ns, key), "utf8")) as T;
  } catch (e) {
    if (supabaseOn) console.error(`[cache] read ${ns}/${key}:`, (e as Error).message);
    return null;
  }
}

/** Keys stored in a namespace with when each was generated (Supabase only; [] otherwise). */
export async function cacheList(ns: string): Promise<{ key: string; generatedAt: string }[]> {
  if (!supabaseOn) return [];
  try {
    const rows = (await rest(`app_cache?select=key,generated_at&ns=eq.${encodeURIComponent(ns)}`)) as { key: string; generated_at: string }[];
    return rows.map((r) => ({ key: r.key, generatedAt: r.generated_at }));
  } catch (e) {
    console.error(`[cache] list ${ns}:`, (e as Error).message);
    return [];
  }
}

export async function cacheWrite<T extends { generatedAt: string }>(ns: string, key: string, value: T) {
  try {
    if (supabaseOn) {
      await rest("app_cache?on_conflict=ns,key", {
        method: "POST",
        headers: { prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({ ns, key, value, generated_at: value.generatedAt, updated_at: new Date().toISOString() }),
      });
      return;
    }
    await mkdir(`data/${ns}`, { recursive: true });
    await writeFile(file(ns, key), JSON.stringify(value, null, 2));
  } catch (e) {
    console.error(`[cache] write ${ns}/${key}:`, (e as Error).message);
  }
}
