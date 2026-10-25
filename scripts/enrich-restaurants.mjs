#!/usr/bin/env node
// Matches every guide-listed restaurant (lib/data/restaurant-awards.json) to its Amap POI and
// stores what Amap returns: id, location, address, up to 3 photos, business.tag, rating, cost,
// opening hours. Photos come with the same search, so they cost no extra call.
// Only Amap Web Service data is used; nothing is taken from Dianping, Michelin or search engines.
// Cost: 1 Amap call per restaurant, 2 more when the name search is unsure (geocode + nearby).
//
// Once per restaurant: restaurants don't move, so anything already looked up (in the file, or in
// Supabase — including the app's own first lookups) is never searched again. A run cut short by
// the daily quota continues where it stopped.
//
//   AMAP_KEY=… node scripts/enrich-restaurants.mjs                 # every restaurant not looked up yet
//   AMAP_KEY=… node scripts/enrich-restaurants.mjs --city 110000   # one city
//   … --limit 50 --retry-unmatched --report-only --names "店名A,店名B" (re-checks those)
//   node scripts/enrich-restaurants.mjs --photos filled.csv        # photos found by hand (no Amap calls)
//
// Results: lib/data/restaurant-places.json (keyed "<city adcode>:<name as listed>"), and when
// SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set, the same fields on the restaurants table
// (supabase/migrations/0005 + 0006). Report: docs/reports/restaurant-match.md, a CSV of matches to
// check, and restaurant-no-photo.csv: the restaurants without a photo, with empty columns to fill
// in (docs/photo-research-prompt.md) and load back with --photos.
// Manual fixes: lib/data/restaurant-overrides.json {"110000:店名": {"amap_id": "B0FFxxxx"}} or
// {"amap_id": null} for "not on Amap".
import { readFile, writeFile, mkdir } from "node:fs/promises";

const root = new URL("..", import.meta.url);
const file = (p) => new URL(p, root);
const arg = (name, fallback) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : fallback; };
const flag = (name) => process.argv.includes(`--${name}`);

const AMAP = process.env.AMAP_BASE_URL || "https://restapi.amap.com";
const AMAP_KEY = (process.env.AMAP_KEY ?? "").trim();
const ONLY_CITY = arg("city");
const ONLY_NAMES = arg("names")?.split(",").map((x) => x.trim()).filter(Boolean); // re-check a few by name
const LIMIT = Number(arg("limit", "0")) || Infinity;
const PHOTOS_CSV = arg("photos");
const GAP_MS = Number(arg("gap-ms", "260")); // stay under the per-key QPS limit

const awards = JSON.parse(await readFile(file("lib/data/restaurant-awards.json"), "utf8"));
const cities = JSON.parse(await readFile(file("lib/data/cities.json"), "utf8"));
const cityName = (a) => cities.find((c) => c.a === a && c.t === "city")?.n ?? cities.find((c) => c.a === a)?.n ?? "";
const placesPath = file("lib/data/restaurant-places.json");
const store = JSON.parse(await readFile(placesPath, "utf8").catch(() => '{"places":{}}'));
const overrides = JSON.parse(await readFile(file("lib/data/restaurant-overrides.json"), "utf8").catch(() => "{}"));
const keyOf = (r) => `${r.city}:${r.zh}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let calls = 0;
const SB = (process.env.SUPABASE_URL ?? "").replace(/\/$/, ""), SBK = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
const sbHeaders = { apikey: SBK, authorization: `Bearer ${SBK}`, "content-type": "application/json" };

// Lookups already in Supabase (the app saves its own first lookups there) count as done.
if (SB && SBK) {
  for (let from = 0; ; from += 1000) {
    const res = await fetch(`${SB}/rest/v1/restaurants?select=city,name_zh,amap_id,location,address,district,amap_type,tags,rating,cost,opentime,photos,photo_source,match&match=not.is.null`, { headers: { ...sbHeaders, range: `${from}-${from + 999}` } });
    if (!res.ok) { console.error(`Supabase read ${res.status} (migrations 0005/0006 applied?); using the file only.`); break; }
    const page = await res.json();
    for (const r of page) {
      const k = `${r.city}:${r.name_zh}`;
      if (store.places[k]) continue;
      store.places[k] = r.amap_id
        ? { id: r.amap_id, name: r.match?.amap_name ?? undefined, location: r.location, address: r.address ?? "", district: r.district ?? "", typecode: r.amap_type ?? "",
            photos: r.photos ?? [], photoSource: r.photo_source ?? undefined, tag: r.tags ?? "", rating: r.rating, cost: r.cost, opentime: r.opentime ?? "",
            confidence: r.match?.confidence ?? "high", method: r.match?.method ?? "live", matchedAt: r.match?.matched_at }
        : { none: true, method: r.match?.method ?? "live", photos: r.photos ?? undefined, photoSource: r.photo_source ?? undefined, matchedAt: r.match?.matched_at };
    }
    if (page.length < 1000) break;
  }
}

// ---- Amap ------------------------------------------------------------------------------------

async function amap(path, params) {
  const qs = new URLSearchParams({ key: AMAP_KEY });
  for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
  for (let attempt = 0; ; attempt++) {
    await sleep(GAP_MS); calls++;
    const d = await fetch(`${AMAP}${path}?${qs}`).then((r) => r.json());
    if (d.status === "1") return d;
    // CUQPS_HAS_EXCEEDED_THE_LIMIT: slow down and retry; anything else (quota, bad key) stops the run.
    if (d.infocode === "10021" && attempt < 4) { await sleep(2000 * (attempt + 1)); continue; }
    throw new Error(`Amap ${path}: ${d.info} (${d.infocode})`);
  }
}
const FIELDS = "business,photos";
const textSearch = (keywords, city) => amap("/v5/place/text", { keywords, region: city, city_limit: "true", types: "050000", show_fields: FIELDS, page_size: "10" }).then((d) => d.pois ?? []);
const aroundSearch = (keywords, location) => amap("/v5/place/around", { keywords, location, radius: "2000", types: "050000", sortrule: "distance", show_fields: FIELDS, page_size: "10" }).then((d) => d.pois ?? []);
const https = (u) => String(u).replace(/^http:\/\//, "https://");
const geocode = (address, city) => amap("/v3/geocode/geo", { address, city }).then((d) => d.geocodes?.[0]?.location || null);
const str = (v) => (Array.isArray(v) ? "" : v == null ? "" : String(v));

// ---- matching --------------------------------------------------------------------------------

const norm = (s) => s.replace(/\s+/g, "").replace(/（/g, "(").replace(/）/g, ")").replace(/[·・•．.]/g, "");
/** "南京大牌档(德基广场店)" → brand 南京大牌档, branch 德基广场店 */
function parts(name) {
  const n = norm(name), m = n.match(/^(.*?)\((.*)\)$/);
  return { brand: (m ? m[1] : n).replace(/(餐厅|饭店|饭庄|酒家|酒楼|餐馆|菜馆)$/, ""), branch: m?.[2] ?? "" };
}
const branchCore = (b) => b.replace(/(总店|分店|旗舰店|店)$/, "");
const ROAD = /([一-龥]{1,8}?(?:大街|东路|西路|南路|北路|中路|大道|胡同|路|街|巷))/;
function bigrams(s) { const out = new Set(); for (let i = 0; i < s.length - 1; i++) out.add(s.slice(i, i + 2)); return out; }
function dice(a, b) {
  if (a.length < 2 || b.length < 2) return a === b ? 1 : 0;
  const A = bigrams(a), B = bigrams(b); let n = 0; for (const x of A) if (B.has(x)) n++;
  return (2 * n) / (A.size + B.size);
}
function brandSim(g, p) {
  if (!g || !p) return 0;
  if (g === p) return 1;
  if ((p.includes(g) || g.includes(p)) && Math.min(g.length, p.length) >= 2) return 0.9;
  return dice(g, p);
}
/** How well the guide's branch name agrees with the POI's branch, address and district. */
function branchScore(branch, poi) {
  const core = branchCore(branch);
  if (!core) return 0;
  const pb = branchCore(parts(poi.name).branch);
  const address = str(poi.address), district = str(poi.adname);
  if (pb && (pb.includes(core) || core.includes(pb))) return 1;
  const road = core.match(ROAD)?.[1];
  if (road && address.includes(road)) return 0.9;
  if (dice(core, pb + address) >= 0.4) return 0.6;
  const d = district.replace(/(区|县|市)$/, "");
  if (d.length >= 2 && core.includes(d)) return 0.5;
  return 0;
}
function score(guideName, poi, sameBrandCount) {
  const g = parts(guideName), p = parts(poi.name);
  const b = brandSim(g.brand, p.brand);
  const br = g.branch ? branchScore(g.branch, poi) : null;
  const s = br == null ? b : 0.6 * b + 0.4 * br;
  // A guide entry without a branch matches any outlet of a chain: never more than medium.
  const confidence = b >= 0.9 && (br == null ? sameBrandCount <= 1 : br >= 0.9) ? "high"
    : s >= 0.75 ? "medium" : s >= 0.55 ? "low" : null;
  return { score: Math.round(s * 100) / 100, confidence, brand: b, branch: br };
}
function best(guideName, pois, method) {
  const g = parts(guideName);
  const sameBrand = pois.filter((p) => brandSim(g.brand, parts(p.name).brand) >= 0.9).length;
  const ranked = pois.map((poi) => ({ poi, method, ...score(guideName, poi, sameBrand) }))
    .sort((a, b) => b.score - a.score || Number(b.poi.business?.rating ?? 0) - Number(a.poi.business?.rating ?? 0));
  return ranked[0] ?? null;
}
const RANK = { high: 3, medium: 2, low: 1, null: 0 };

async function match(r) {
  const city = r.city;
  const o = overrides[keyOf(r)];
  if (o && o.amap_id === null) return { none: true, method: "override" };
  let pick = best(r.zh, await textSearch(r.zh, city), "text");
  if (o?.amap_id && pick?.poi.id !== o.amap_id) {
    const all = await textSearch(parts(r.zh).brand, city);
    const hit = all.find((p) => p.id === o.amap_id);
    if (hit) pick = { poi: hit, method: "override", score: 1, confidence: "high" };
  }
  // Nothing good: search around the road or place the branch is named after.
  const branch = branchCore(parts(r.zh).branch);
  if (RANK[pick?.confidence ?? null] < 2 && branch) {
    const where = branch.match(ROAD)?.[1] ?? branch;
    const loc = await geocode(`${cityName(city)}${where}`, city).catch(() => null);
    if (loc) {
      const near = best(r.zh, await aroundSearch(parts(r.zh).brand, loc), "around");
      // Found by brand within 2 km of the branch's road: that location is the branch evidence.
      if (near && near.brand >= 0.9 && Number(near.poi.distance ?? 9999) <= 800) near.confidence = near.confidence === "high" ? "high" : "medium";
      if (near && (RANK[near.confidence ?? null] > RANK[pick?.confidence ?? null] || (!pick && near.confidence))) pick = near;
    }
  }
  return pick?.confidence ? pick : { none: true, method: pick ? pick.method : "text", candidate: pick ? { name: pick.poi.name, address: str(pick.poi.address), score: pick.score } : null };
}

function toPlace(m) {
  const p = m.poi, b = p.business ?? {};
  return {
    id: p.id, name: p.name, location: p.location, address: str(p.address), district: str(p.adname), typecode: str(p.typecode),
    photos: (p.photos ?? []).map((x) => https(x.url)).filter(Boolean).slice(0, 3),
    tag: str(b.tag), keytag: str(b.keytag), rectag: str(b.rectag),
    rating: Number(b.rating) || null, cost: Math.round(Number(b.cost)) || null,
    opentime: str(b.opentime_week) || str(b.opentime_today),
    confidence: m.confidence, score: m.score, method: m.method,
  };
}

// ---- run -------------------------------------------------------------------------------------

const todo = awards.restaurants.filter((r) => (!ONLY_CITY || r.city === ONLY_CITY) && (!ONLY_NAMES || ONLY_NAMES.includes(r.zh)));
/** Looked up already? Then not again, unless asked by name, or --retry-unmatched for misses. */
const done = (k) => { const p = store.places[k]; return p && !(ONLY_NAMES) && !(p.none && flag("retry-unmatched")); };
const save = async () => {
  store.generatedAt = new Date().toISOString();
  const sorted = Object.fromEntries(Object.entries(store.places).sort(([a], [b]) => a.localeCompare(b, "zh")));
  await writeFile(placesPath, JSON.stringify({ generatedAt: store.generatedAt, places: sorted }, null, 1) + "\n");
};

// ---- photos found by hand (CSV from docs/photo-research-prompt.md) ----------------------------

/** Minimal CSV reader (quotes, commas and newlines inside quotes, BOM). */
function parseCsv(text) {
  const rows = []; let row = [], cell = "", quoted = false;
  text = text.replace(/^\ufeff/, "");
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) { if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') quoted = false; else cell += ch; }
    else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows.filter((r) => r.some((c) => c.trim()));
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] ?? "").trim()])));
}

// Sources a photo may come from. Anything else is rejected: we only show images we may show.
const ALLOWED_SOURCE = /^(amap|高德|wikimedia|official|官方)/i;
if (PHOTOS_CSV) {
  let added = 0, skipped = 0;
  for (const row of parseCsv(await readFile(PHOTOS_CSV, "utf8"))) {
    const k = `${row.city_adcode}:${row.name_zh}`;
    const urls = [row.photo_url_1, row.photo_url_2, row.photo_url_3].filter((u) => /^https?:\/\//.test(u ?? "")).map(https);
    if (!urls.length) continue;
    if (!awards.restaurants.some((r) => keyOf(r) === k)) { console.error(`? ${k}: not a listed restaurant`); skipped++; continue; }
    if (!ALLOWED_SOURCE.test(row.source ?? "") || !row.source_page) { console.error(`✗ ${k}: source "${row.source}" not allowed or source_page missing`); skipped++; continue; }
    if (/wikimedia/i.test(row.source) && !row.license) { console.error(`✗ ${k}: Wikimedia photo without license/author`); skipped++; continue; }
    const credit = /^(amap|高德)/i.test(row.source) ? "Amap" : [row.source, row.license].filter(Boolean).join(", ");
    store.places[k] = { ...(store.places[k] ?? { none: true, method: "manual" }), photos: urls.slice(0, 3), photoSource: credit, photoPage: row.source_page, photoChecked: row.checked || new Date().toISOString().slice(0, 10) };
    added++;
  }
  console.log(`photos: ${added} restaurants updated, ${skipped} rows skipped`);
}

if (!flag("report-only") && !PHOTOS_CSV) {
  if (!AMAP_KEY) { console.error("Set AMAP_KEY (or use --report-only / --photos)."); process.exit(1); }
  let n = 0;
  for (const r of todo) {
    if (n >= LIMIT) break;
    const k = keyOf(r);
    if (done(k) && !overrides[k]) continue;
    try {
      const m = await match(r);
      const prev = store.places[k];
      const place = m.none ? { none: true, method: m.method, candidate: m.candidate ?? null } : toPlace(m);
      // Photos added by hand stay when Amap has none.
      if (prev?.photos?.length && prev.photoSource !== "Amap" && !place.photos?.length) Object.assign(place, { photos: prev.photos, photoSource: prev.photoSource, photoPage: prev.photoPage, photoChecked: prev.photoChecked });
      else if (place.photos?.length) place.photoSource = "Amap";
      store.places[k] = { ...place, matchedAt: new Date().toISOString() };
      n++;
      console.log(`${m.none ? "✗" : m.confidence === "high" ? "✓" : "~"} ${k}${m.none ? "" : ` → ${m.poi.name} (${m.confidence} ${m.score}, ${m.method})`}`);
      if (n % 25 === 0) await save();
    } catch (e) {
      console.error(`! ${k}: ${e.message}`);
      if (/USER_DAILY_QUERY_OVER_LIMIT|INVALID_USER_KEY|DAILY_QUERY_OVER_LIMIT|10003|10044|10001/.test(e.message)) { console.error("Stopping: key or quota problem. Re-run later; finished rows are kept."); break; }
    }
  }
  console.log(`matched ${n} restaurants · ${calls} Amap calls`);
}
await save();

// ---- Supabase (optional) ---------------------------------------------------------------------

if (SB && SBK && !flag("report-only")) {
  const rows = (PHOTOS_CSV ? awards.restaurants : todo).filter((r) => store.places[keyOf(r)]).map((r) => {
    const p = store.places[keyOf(r)];
    const ok = p && !p.none;
    return {
      city: r.city, name_zh: r.zh,
      amap_id: ok ? p.id : null, location: ok ? p.location : null, address: ok ? p.address : null, district: ok ? p.district : null,
      amap_type: ok ? p.typecode : null, tags: ok ? p.tag || null : null,
      photos: p.photos?.length ? p.photos : null, photo_source: p.photos?.length ? p.photoSource ?? null : null,
      rating: ok ? p.rating : null, cost: ok ? p.cost : null, opentime: ok ? p.opentime || null : null,
      match: p ? { confidence: p.confidence ?? null, score: p.score ?? null, method: p.method, amap_name: p.name ?? null, matched_at: p.matchedAt } : null,
    };
  });
  for (let i = 0; i < rows.length; i += 500) {
    const res = await fetch(`${SB}/rest/v1/restaurants?on_conflict=city,name_zh`, {
      method: "POST", body: JSON.stringify(rows.slice(i, i + 500)),
      headers: { ...sbHeaders, prefer: "resolution=merge-duplicates,return=minimal" },
    });
    if (!res.ok) { console.error(`Supabase ${res.status}: ${(await res.text()).slice(0, 300)} (are migrations 0005 and 0006 applied?)`); break; }
  }
  console.log(`Supabase: ${rows.length} restaurants updated`);
}

// ---- report ----------------------------------------------------------------------------------

const rows = todo.map((r) => ({ r, p: store.places[keyOf(r)] }));
const tried = rows.filter((x) => x.p);
const matched = tried.filter((x) => !x.p.none);
const by = (c) => matched.filter((x) => x.p.confidence === c).length;
const usable = matched.filter((x) => x.p.confidence !== "low");
const hasPhoto = (x) => Boolean(x.p?.photos?.length) && (x.p.photoSource !== "Amap" || (!x.p.none && x.p.confidence !== "low"));
const withPhoto = rows.filter(hasPhoto);
const pct = (a, b) => (b ? `${Math.round((a / b) * 1000) / 10}%` : "–");
const cityLabel = (a) => cities.find((c) => c.a === a)?.s ?? a;
const perCity = [...new Set(rows.map((x) => x.r.city))].map((c) => {
  const xs = rows.filter((x) => x.r.city === c), t = xs.filter((x) => x.p), m = t.filter((x) => !x.p.none && x.p.confidence !== "low");
  return { c, n: xs.length, tried: t.length, matched: m.length, tags: m.filter((x) => x.p.tag).length, photos: xs.filter(hasPhoto).length };
}).sort((a, b) => b.n - a.n);
const bj = perCity.find((x) => x.c === "110000");
const tagSamples = matched.filter((x) => x.p.tag).slice(0, 5);
const q = (v) => (/[",\n]/.test(String(v ?? "")) ? `"${String(v).replace(/"/g, '""')}"` : String(v ?? ""));
const awardLabel = (aw) => aw.map((a) => `${a.list}:${a.level}`).join(" + ");

const md = `# 餐厅 ↔ 高德匹配报告

生成时间：${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC · 范围：${ONLY_CITY ? cityLabel(ONLY_CITY) : "全部城市"} · 本次高德调用 ${calls} 次

## 总览

| 项目 | 数量 | 占比 |
|---|---|---|
| 榜单餐厅 | ${rows.length} | |
| 已尝试匹配 | ${tried.length} | ${pct(tried.length, rows.length)} |
| 匹配成功（高 + 中置信度，App 使用） | ${usable.length} | ${pct(usable.length, tried.length)} |
| · 高置信度 | ${by("high")} | |
| · 中置信度 | ${by("medium")} | |
| 低置信度（App 不使用，待人工抽查） | ${by("low")} | |
| 未匹配 | ${tried.length - matched.length} | |
| 成功匹配中 tag 非空 | ${usable.filter((x) => x.p.tag).length} | ${pct(usable.filter((x) => x.p.tag).length, usable.length)} |
| 有照片（高德 + 人工补充） | ${withPhoto.length} | ${pct(withPhoto.length, rows.length)} |
| · 其中人工补充 | ${withPhoto.filter((x) => x.p.photoSource !== "Amap").length} | |

**北京：** ${bj ? `${bj.n} 家，已尝试 ${bj.tried} 家，匹配成功 ${bj.matched} 家（${pct(bj.matched, bj.tried)}），有照片 ${bj.photos} 家（照片覆盖率 ${pct(bj.photos, bj.n)}），有主打菜 tag ${bj.tags} 家` : "本次未包含北京"}

照片随同一次搜索返回，不额外调用。没有照片的餐厅见 \`restaurant-no-photo.csv\`，按 \`docs/photo-research-prompt.md\` 补充后用 \`--photos\` 导入；仍没有的显示菜系色块。

## 各城市

| 城市 | 餐厅 | 已尝试 | 匹配成功 | 有照片 | 有 tag |
|---|---|---|---|---|---|
${perCity.slice(0, 40).map((x) => `| ${cityLabel(x.c)} | ${x.n} | ${x.tried} | ${x.matched} (${pct(x.matched, x.tried)}) | ${x.photos} (${pct(x.photos, x.n)}) | ${x.tags} |`).join("\n")}

## business.tag 样例（餐饮类 POI）

${tagSamples.length ? tagSamples.map((x) => `- **${x.r.zh}** → 高德「${x.p.name}」\n  - tag：\`${x.p.tag}\`${x.p.keytag ? `\n  - keytag：\`${x.p.keytag}\`` : ""}${x.p.rectag ? `\n  - rectag：\`${x.p.rectag}\`` : ""}`).join("\n") : "（本次没有 tag 非空的结果）"}

判断：App 只把 tag 里像菜名的项当作主打菜（去掉“包间”“停车”“环境”等非菜品词，最多 5 个）；tag 为空的餐厅不显示主打菜。

## 清单

- 没有照片的餐厅（${rows.length - withPhoto.length} 家，含未匹配的）：\`docs/reports/restaurant-no-photo.csv\`，照片列留空待补。
- 低置信度和未匹配（供人工抽查）：\`docs/reports/restaurant-low-confidence.csv\`（${tried.filter((x) => x.p.none || x.p.confidence === "low").length} 家）。确认后写进 \`lib/data/restaurant-overrides.json\` 再跑一次。

## 匹配规则

1. 高德 POI 搜索 2.0：keywords = 店名，region = 城市 adcode，types = 050000，show_fields = business,photos（照片随同一次请求返回）。每家餐厅只查一次，以后不再查。
2. 去掉括号里的分店名比较品牌名（相同 / 包含 / 字符相似度）；分店名与高德名称里的分店、地址中的路名、区名比较。
3. 置信度：品牌一致且分店一致（或榜单没写分店且结果里只有一家同品牌）为“高”；综合分 ≥ 0.75 为“中”；≥ 0.55 为“低”。榜单没写分店的连锁店最多“中”。
4. 仍然没有高、中置信度结果时，用分店名里的路名（或分店名）地理编码，再在 2 km 内按品牌搜索；800 m 内同品牌视为中置信度。
`;
await mkdir(file("docs/reports/"), { recursive: true });
await writeFile(file("docs/reports/restaurant-match.md"), md);
const BOM = "﻿";
await writeFile(file("docs/reports/restaurant-low-confidence.csv"), BOM + ["city,name,awards,status,amap_name,amap_address,score,method,amap_id,decision",
  ...tried.filter((x) => x.p.none || x.p.confidence === "low")
    .map((x) => [cityLabel(x.r.city), x.r.zh, awardLabel(x.r.awards), x.p.none ? "unmatched" : "low", x.p.name ?? x.p.candidate?.name ?? "", x.p.address ?? x.p.candidate?.address ?? "", x.p.score ?? x.p.candidate?.score ?? "", x.p.method, x.p.id ?? "", ""].map(q).join(","))].join("\n") + "\n");
// The restaurants still without a photo, as a sheet to fill in: identity columns, then empty photo columns.
await writeFile(file("docs/reports/restaurant-no-photo.csv"), BOM + ["city_adcode,city,name_zh,name_en,cuisine,amap_id,amap_name,address,photo_url_1,photo_url_2,photo_url_3,source,license,source_page,checked,notes",
  ...rows.filter((x) => !hasPhoto(x)).map((x) => {
    const ok = x.p && !x.p.none && x.p.confidence !== "low";
    return [x.r.city, cityLabel(x.r.city), x.r.zh, x.r.en ?? "", x.r.cuisine ?? "", ok ? x.p.id : "", ok ? x.p.name : "", ok ? x.p.address : "", "", "", "", "", "", "", "", ""].map(q).join(",");
  })].join("\n") + "\n");
console.log(`report: docs/reports/restaurant-match.md · usable ${usable.length}/${tried.length} · with photo ${withPhoto.length}/${rows.length}`);
