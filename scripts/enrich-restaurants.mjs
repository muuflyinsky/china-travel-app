#!/usr/bin/env node
// Matches every guide-listed restaurant (lib/data/restaurant-awards.json) to its Amap POI and
// stores what Amap returns: id, location, address, up to 3 photos, business.tag, rating, cost,
// opening hours. Then (with an AI key) picks a cover photo per restaurant with a vision model.
// Only Amap Web Service data and our own model output are used; nothing is taken from Dianping,
// Michelin or search engines.
//
//   AMAP_KEY=… node scripts/enrich-restaurants.mjs                 # match all, then covers
//   AMAP_KEY=… node scripts/enrich-restaurants.mjs --city 110000   # one city
//   … --limit 50 --refresh-days 30 --no-covers --report-only --names "店名A,店名B"
//
// Results: lib/data/restaurant-places.json (keyed "<city adcode>:<name as listed>"), and when
// SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set, the same fields on the restaurants table
// (supabase/migrations/0005). Report: docs/reports/restaurant-match.md + two CSVs.
// Resumable: restaurants matched within --refresh-days are skipped; covers are cached by photo
// set, so a re-run only calls the model for new or changed photos.
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
const REFRESH_DAYS = Number(arg("refresh-days", "30"));
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
const geocode = (address, city) => amap("/v3/geocode/geo", { address, city }).then((d) => d.geocodes?.[0]?.location || null);
const https = (u) => String(u).replace(/^http:\/\//, "https://");
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

// ---- covers (vision model) -------------------------------------------------------------------

const AI_KEY = (process.env.AI_API_KEY ?? "").trim().replace(/^["']|["']$/g, "");
const DASH_INTL = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1", DASH_CN = "https://dashscope.aliyuncs.com/compatible-mode/v1";
const AI_URLS = (() => {
  const set = process.env.AI_BASE_URL ? process.env.AI_BASE_URL.split(",").map((u) => u.trim().replace(/\/$/, "")).filter(Boolean) : [DASH_INTL, DASH_CN];
  if (set.includes(DASH_INTL) && !set.includes(DASH_CN)) set.push(DASH_CN);
  if (set.includes(DASH_CN) && !set.includes(DASH_INTL)) set.push(DASH_INTL);
  return set;
})();
const VISION = [...new Set([process.env.AI_MODEL_VISION || "qwen3-vl-plus", "qwen3-vl-plus", "qwen-vl-max", "qwen-vl-max-latest", "qwen3-vl-flash", "qwen-vl-plus"])];
let urlAt = 0, modelAt = 0, aiCalls = 0;

async function vision(content) {
  for (let m = modelAt; m < VISION.length; m++) {
    for (let i = 0; i < AI_URLS.length; i++) {
      const u = AI_URLS[(urlAt + i) % AI_URLS.length];
      aiCalls++;
      const res = await fetch(`${u}/chat/completions`, {
        method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${AI_KEY}` },
        body: JSON.stringify({ model: VISION[m], temperature: 0, max_tokens: 300, messages: [{ role: "user", content }] }),
      });
      if (res.ok) { urlAt = (urlAt + i) % AI_URLS.length; modelAt = m; return (await res.json()).choices?.[0]?.message?.content ?? ""; }
      const body = await res.text();
      if (res.status === 401 || res.status === 403) continue; // key from the other region
      if (res.status === 404 || /model_not_found|Model not exist/i.test(body)) break; // next model
      throw new Error(`AI ${res.status}: ${body.slice(0, 200)}`);
    }
  }
  throw new Error("no vision model accepted the key");
}

const KINDS = ["dish", "storefront", "interior", "menu", "receipt", "people", "other"];
const COVER_PROMPT = `These are photos of one restaurant from a map app. For each photo, in order, classify it.
kind: "dish" (close-up of food), "storefront" (entrance or facade), "interior" (dining room), "menu" (a menu or price list), "receipt" (bill, invoice, ticket), "people" (people are the subject), "other".
blurry: true if out of focus, very dark or tiny. faces: true if any human face is clearly recognisable.
Reply with JSON only: {"photos":[{"kind":"dish","blurry":false,"faces":false}]}`;

/** Dish close-up first, then storefront or dining room; never menus, receipts, blurry photos or faces. */
async function pickCover(photos) {
  const text = await vision([...photos.map((url) => ({ type: "image_url", image_url: { url } })), { type: "text", text: COVER_PROMPT }]);
  const raw = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
  const judged = (raw.photos ?? []).slice(0, photos.length).map((x, i) => ({
    url: photos[i], kind: KINDS.includes(String(x.kind).toLowerCase()) ? String(x.kind).toLowerCase() : "other",
    ok: x.blurry !== true && x.blurry !== "true" && x.faces !== true && x.faces !== "true",
  }));
  for (const want of [["dish"], ["storefront", "interior"]]) {
    const hit = judged.find((j) => j.ok && want.includes(j.kind));
    if (hit) return { url: hit.url, kind: hit.kind };
  }
  return null;
}

// ---- run -------------------------------------------------------------------------------------

const todo = awards.restaurants.filter((r) => (!ONLY_CITY || r.city === ONLY_CITY) && (!ONLY_NAMES || ONLY_NAMES.includes(r.zh)));
const fresh = (p) => p?.matchedAt && Date.now() - Date.parse(p.matchedAt) < REFRESH_DAYS * 864e5;
const save = async () => {
  store.generatedAt = new Date().toISOString();
  const sorted = Object.fromEntries(Object.entries(store.places).sort(([a], [b]) => a.localeCompare(b, "zh")));
  await writeFile(placesPath, JSON.stringify({ generatedAt: store.generatedAt, places: sorted }, null, 1) + "\n");
};

if (!flag("report-only")) {
  if (!AMAP_KEY) { console.error("Set AMAP_KEY (or use --report-only)."); process.exit(1); }
  let done = 0;
  for (const r of todo) {
    if (done >= LIMIT) break;
    const k = keyOf(r);
    if (fresh(store.places[k]) && !overrides[k]) continue;
    try {
      const m = await match(r);
      const prev = store.places[k];
      const place = m.none ? { none: true, method: m.method, candidate: m.candidate ?? null } : toPlace(m);
      // Keep the cached cover while the photo set is unchanged.
      if (!m.none && prev?.coverFor === place.photos.join("|")) { place.cover = prev.cover; place.coverFor = prev.coverFor; }
      store.places[k] = { ...place, matchedAt: new Date().toISOString() };
      done++;
      console.log(`${m.none ? "✗" : m.confidence === "high" ? "✓" : "~"} ${k}${m.none ? "" : ` → ${m.poi.name} (${m.confidence} ${m.score}, ${m.method})`}`);
      if (done % 25 === 0) await save();
    } catch (e) {
      console.error(`! ${k}: ${e.message}`);
      if (/USER_DAILY_QUERY_OVER_LIMIT|INVALID_USER_KEY|DAILY_QUERY_OVER_LIMIT|10003|10044|10001/.test(e.message)) { console.error("Stopping: key or quota problem. Re-run later; finished rows are kept."); break; }
    }
  }
  await save();
  console.log(`matched ${done} restaurants · ${calls} Amap calls`);

  if (!flag("no-covers") && AI_KEY) {
    let picked = 0;
    for (const r of todo) {
      const p = store.places[keyOf(r)];
      if (!p || p.none || !p.photos?.length || p.confidence === "low") continue;
      const set = p.photos.join("|");
      if (p.coverFor === set) continue;
      try {
        p.cover = await pickCover(p.photos); p.coverFor = set; picked++;
        console.log(`cover ${keyOf(r)}: ${p.cover ? p.cover.kind : "none usable"}`);
        if (picked % 25 === 0) await save();
      } catch (e) { console.error(`! cover ${keyOf(r)}: ${e.message}`); if (/no vision model|AI 4/.test(e.message)) break; }
    }
    await save();
    console.log(`covers: ${picked} picked · ${aiCalls} model calls`);
  } else if (!flag("no-covers")) console.log("No AI_API_KEY: covers skipped (the app then uses the first photo of high/medium matches).");
}

// ---- Supabase (optional) ---------------------------------------------------------------------

const SB = (process.env.SUPABASE_URL ?? "").replace(/\/$/, ""), SBK = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
if (SB && SBK && !flag("report-only")) {
  const rows = todo.map((r) => {
    const p = store.places[keyOf(r)];
    const ok = p && !p.none;
    return {
      city: r.city, name_zh: r.zh,
      amap_id: ok ? p.id : null, location: ok ? p.location : null, address: ok ? p.address : null, district: ok ? p.district : null,
      amap_type: ok ? p.typecode : null, photos: ok ? p.photos : null, cover: ok ? p.cover ?? null : null, tags: ok ? p.tag || null : null,
      rating: ok ? p.rating : null, cost: ok ? p.cost : null, opentime: ok ? p.opentime || null : null,
      match: p ? { confidence: p.confidence ?? null, score: p.score ?? null, method: p.method, amap_name: p.name ?? null, matched_at: p.matchedAt } : null,
    };
  });
  for (let i = 0; i < rows.length; i += 500) {
    const res = await fetch(`${SB}/rest/v1/restaurants?on_conflict=city,name_zh`, {
      method: "POST", body: JSON.stringify(rows.slice(i, i + 500)),
      headers: { apikey: SBK, authorization: `Bearer ${SBK}`, "content-type": "application/json", prefer: "resolution=merge-duplicates,return=minimal" },
    });
    if (!res.ok) { console.error(`Supabase ${res.status}: ${(await res.text()).slice(0, 300)} (is migration 0005 applied?)`); break; }
  }
  console.log(`Supabase: ${rows.length} restaurants updated`);
}

// ---- report ----------------------------------------------------------------------------------

const rows = todo.map((r) => ({ r, p: store.places[keyOf(r)] }));
const tried = rows.filter((x) => x.p);
const matched = tried.filter((x) => !x.p.none);
const by = (c) => matched.filter((x) => x.p.confidence === c).length;
const usable = matched.filter((x) => x.p.confidence !== "low");
const withPhoto = usable.filter((x) => x.p.photos?.length);
const pct = (a, b) => (b ? `${Math.round((a / b) * 1000) / 10}%` : "–");
const cityLabel = (a) => cities.find((c) => c.a === a)?.s ?? a;
const perCity = [...new Set(rows.map((x) => x.r.city))].map((c) => {
  const xs = rows.filter((x) => x.r.city === c), t = xs.filter((x) => x.p), m = t.filter((x) => !x.p.none && x.p.confidence !== "low");
  return { c, n: xs.length, tried: t.length, matched: m.length, photos: m.filter((x) => x.p.photos?.length).length, covers: m.filter((x) => x.p.cover).length };
}).sort((a, b) => b.n - a.n);
const bj = perCity.find((x) => x.c === "110000");
const tagSamples = matched.filter((x) => x.p.tag).slice(0, 5);
const q = (v) => (/[",\n]/.test(String(v ?? "")) ? `"${String(v).replace(/"/g, '""')}"` : String(v ?? ""));
const awardLabel = (aw) => aw.map((a) => `${a.list}:${a.level}`).join(" + ");

const md = `# 餐厅 ↔ 高德匹配报告

生成时间：${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC · 范围：${ONLY_CITY ? cityLabel(ONLY_CITY) : "全部城市"} · 本次高德调用 ${calls} 次${aiCalls ? ` · 看图模型调用 ${aiCalls} 次` : ""}

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
| 成功匹配中有高德照片 | ${withPhoto.length} | ${pct(withPhoto.length, usable.length)} |
| 已选出封面 | ${usable.filter((x) => x.p.cover).length} | ${pct(usable.filter((x) => x.p.cover).length, withPhoto.length)}（占有照片的） |
| 成功匹配中 tag 非空 | ${usable.filter((x) => x.p.tag).length} | ${pct(usable.filter((x) => x.p.tag).length, usable.length)} |

**北京榜单照片覆盖率：** ${bj ? `${bj.photos} / ${bj.n} 家有高德照片（${pct(bj.photos, bj.n)}），匹配成功 ${bj.matched} 家，已尝试 ${bj.tried} 家` : "本次未包含北京"}

## 各城市

| 城市 | 餐厅 | 已尝试 | 匹配成功 | 有照片 | 有封面 |
|---|---|---|---|---|---|
${perCity.slice(0, 40).map((x) => `| ${cityLabel(x.c)} | ${x.n} | ${x.tried} | ${x.matched} | ${x.photos} (${pct(x.photos, x.n)}) | ${x.covers} |`).join("\n")}

## business.tag 样例（餐饮类 POI）

${tagSamples.length ? tagSamples.map((x) => `- **${x.r.zh}** → 高德「${x.p.name}」\n  - tag：\`${x.p.tag}\`${x.p.keytag ? `\n  - keytag：\`${x.p.keytag}\`` : ""}${x.p.rectag ? `\n  - rectag：\`${x.p.rectag}\`` : ""}`).join("\n") : "（本次没有 tag 非空的结果）"}

判断：App 只把 tag 里像菜名的项当作主打菜（去掉“包间”“停车”“环境”等非菜品词，最多 5 个）；tag 为空的餐厅不显示主打菜。

## 清单

- 没有照片的餐厅：\`docs/reports/restaurant-no-photo.csv\`（${rows.filter((x) => !x.p || x.p.none || x.p.confidence === "low" || !x.p.photos?.length).length} 家，含未匹配和低置信度）
- 低置信度和未匹配（供人工抽查）：\`docs/reports/restaurant-low-confidence.csv\`（${tried.filter((x) => x.p.none || x.p.confidence === "low").length} 家）。确认后写进 \`lib/data/restaurant-overrides.json\` 再跑一次。

## 匹配规则

1. 高德 POI 搜索 2.0：keywords = 店名，region = 城市 adcode，types = 050000，show_fields = business,photos。
2. 去掉括号里的分店名比较品牌名（相同 / 包含 / 字符相似度）；分店名与高德名称里的分店、地址中的路名、区名比较。
3. 置信度：品牌一致且分店一致（或榜单没写分店且结果里只有一家同品牌）为“高”；综合分 ≥ 0.75 为“中”；≥ 0.55 为“低”。榜单没写分店的连锁店最多“中”。
4. 仍然没有高、中置信度结果时，用分店名里的路名（或分店名）地理编码，再在 2 km 内按品牌搜索；800 m 内同品牌视为中置信度。
`;
await mkdir(file("docs/reports/"), { recursive: true });
await writeFile(file("docs/reports/restaurant-match.md"), md);
const BOM = "﻿";
await writeFile(file("docs/reports/restaurant-no-photo.csv"), BOM + ["city,name,awards,status,amap_name",
  ...rows.filter((x) => !x.p || x.p.none || x.p.confidence === "low" || !x.p.photos?.length)
    .map((x) => [cityLabel(x.r.city), x.r.zh, awardLabel(x.r.awards), !x.p ? "not tried" : x.p.none ? "unmatched" : x.p.confidence === "low" ? "low confidence" : "no photo", x.p?.name ?? ""].map(q).join(","))].join("\n") + "\n");
await writeFile(file("docs/reports/restaurant-low-confidence.csv"), BOM + ["city,name,awards,status,amap_name,amap_address,score,method,amap_id,decision",
  ...tried.filter((x) => x.p.none || x.p.confidence === "low")
    .map((x) => [cityLabel(x.r.city), x.r.zh, awardLabel(x.r.awards), x.p.none ? "unmatched" : "low", x.p.name ?? x.p.candidate?.name ?? "", x.p.address ?? x.p.candidate?.address ?? "", x.p.score ?? x.p.candidate?.score ?? "", x.p.method, x.p.id ?? "", ""].map(q).join(","))].join("\n") + "\n");
console.log(`report: docs/reports/restaurant-match.md · usable ${usable.length}/${tried.length} · photos ${withPhoto.length}`);
