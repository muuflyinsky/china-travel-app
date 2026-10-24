// Server-side Supabase access over REST with the service role key (never sent to browsers).
// Optional: everything that uses it has a fallback when SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
// are unset. Log tables have RLS on and no policies, so the anon/public keys can read nothing;
// the restaurant award tables are public-read, so SUPABASE_ANON_KEY alone is enough to read them.
const sb = {
  url: (process.env.SUPABASE_URL ?? "").replace(/\/$/, ""),
  key: (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim(),
  anon: (process.env.SUPABASE_ANON_KEY ?? "").trim(),
};
export const supabaseOn = Boolean(sb.url && sb.key);
/** Public-read tables (restaurant awards) work with either key. */
export const supabaseReadOn = Boolean(sb.url && (sb.key || sb.anon));

export async function rest(path: string, init: RequestInit = {}) {
  const key = sb.key || sb.anon;
  const res = await fetch(`${sb.url}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: key, authorization: `Bearer ${key}`, "content-type": "application/json", ...init.headers },
    signal: AbortSignal.timeout(4000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`supabase ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.status === 204 ? null : res.json();
}

/**
 * Appends one row to a log table, or — without Supabase, or if the insert fails — to
 * data/<file>.jsonl (local dev) or the server log (read-only hosts such as Vercel).
 */
export async function logRow(table: string, row: Record<string, unknown>) {
  if (supabaseOn) {
    try { await rest(table, { method: "POST", body: JSON.stringify(row), headers: { prefer: "return=minimal" } }); return; }
    catch (e) { console.error(`[${table}]`, (e as Error).message); }
  }
  const line = JSON.stringify({ ts: new Date().toISOString(), ...row });
  try {
    const { appendFile, mkdir } = await import("node:fs/promises");
    await mkdir("data", { recursive: true });
    await appendFile(`data/${table}.jsonl`, line + "\n");
  } catch { console.log(table, line); }
}
