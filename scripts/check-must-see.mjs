#!/usr/bin/env node
// Must-see lists (lib/must-see.ts): checks the bundled data and the pick rules offline, with
// made-up Amap results. No network, so it runs in `npm run verify`.
//
//   node scripts/check-must-see.mjs
import { readFile } from "node:fs/promises";

let createJiti;
try { ({ createJiti } = await import("jiti")); } catch { console.error("needs jiti (installed with the app's dev dependencies)"); process.exit(2); }
const jiti = createJiti(import.meta.url);
const ms = await jiti.import(new URL("../lib/must-see.ts", import.meta.url).pathname);

const failures = [];
const ok = (cond, msg) => { if (!cond) failures.push(msg); };

// ---- the data file ----
const data = JSON.parse(await readFile(new URL("../lib/data/must-see.json", import.meta.url), "utf8"));
const cities = JSON.parse(await readFile(new URL("../lib/data/hot-cities.json", import.meta.url), "utf8")).map((c) => c.a);
const byCity = Object.groupBy(data.entries, (e) => e.city);
for (const [city, es] of Object.entries(byCity)) {
  ok(cities.includes(city), `${city}: not a hot city`);
  ok(es.length >= 3 && es.length <= 6, `${city}: ${es.length} entries (3–6)`);
  ok(new Set(es.map((e) => e.ord)).size === es.length, `${city}: duplicate ord`);
  ok(new Set(es.map((e) => e.zh)).size === es.length, `${city}: duplicate name`);
  for (const e of es) {
    ok(e.zh && e.en && e.why, `${city} ${e.zh}: name or why missing`);
    ok(e.why.split(/\s+/).length <= 25, `${city} ${e.zh}: why line over 25 words`);
    ok(!e.outside || typeof e.centreH === "number", `${city} ${e.zh}: outside without centreH`);
    ok((e.sources ?? []).length >= 3, `${city} ${e.zh}: fewer than 3 sources`);
    ok(e.reviewedOn === null || /^\d{4}-\d{2}-\d{2}$/.test(e.reviewedOn), `${city} ${e.zh}: reviewedOn not a date`);
  }
}

// ---- drafts are never shown ----
const draft = (city, ord, zh, extra = {}) => ({ city, ord, zh, en: zh, why: "x", sources: [], reviewedOn: null, reviewedBy: null, ...extra });
const entries = [
  draft("610100", 2, "西安城墙（永宁门）", { reviewedOn: "2026-11-06" }),
  draft("610100", 1, "秦始皇帝陵博物院", { reviewedOn: "2026-11-06", outside: true, centreH: 1 }),
  draft("610100", 3, "大慈恩寺"), // draft
  draft("110000", 1, "故宫博物院"), // draft
];
ok(ms.listFor(entries, "610100").map((e) => e.zh).join() === "秦始皇帝陵博物院,西安城墙（永宁门）", "listFor: reviewed rows in order only");
ok(ms.listFor(entries, "110000").length === 0, "listFor: a city with only drafts has no list");
ok(ms.listFor(entries, "610100", { drafts: true }).length === 3, "listFor drafts: includes unreviewed");
ok(ms.listSig([]) === "", "listSig: no list = empty");
const sig = ms.listSig(ms.listFor(entries, "610100"));
ok(sig.length === 12 && sig !== ms.listSig(ms.listFor([{ ...entries[0], why: "changed" }, entries[1]], "610100")), "listSig changes with the why line");
const bundledReviewed = data.entries.filter((e) => e.reviewedOn);
ok(bundledReviewed.length === 0 || process.env.MUST_SEE_ALLOW_REVIEWED, `bundled data: ${bundledReviewed.length} entries marked reviewed — only Veer's review sets reviewedOn (set MUST_SEE_ALLOW_REVIEWED=1 once he has)`);

// ---- locating a listed sight on Amap ----
const P = (id, name, location = "108.9,34.2") => ({ id, name, location });
ok(ms.locate({ zh: "西安城墙（永宁门）" }, [P("a", "西安城墙停车场"), P("b", "西安城墙-永宁门")])?.id === "b", "locate: skips the car park, takes the gate");
ok(ms.locate({ zh: "上海博物馆（人民广场馆）" }, [P("a", "上海博物馆东馆"), P("b", "上海博物馆")])?.id === "b", "locate: not the East branch");
ok(ms.locate({ zh: "秦始皇帝陵博物院" }, [P("a", "秦始皇帝陵博物院(兵马俑)")])?.id === "a", "locate: bracketed suffix");
ok(ms.locate({ zh: "南锣鼓巷" }, [P("a", "鼓楼"), P("b", "南锣鼓巷地铁站")]) === null, "locate: a metro station is not the sight");
ok(ms.locate({ zh: "外滩" }, []) === null, "locate: nothing found = null");
ok(ms.locate({ zh: "南锣鼓巷" }, [P("a", "南锣鼓巷文宇奶酪店"), P("b", "南锣鼓巷")])?.id === "b", "locate: not a shop on the street");
ok(ms.locate({ zh: "回民街" }, [P("a", "回民街美食店")]) === null, "locate: a shop alone is not found");
ok(ms.locate({ zh: "西安城墙（永宁门）" }, [P("a", "西安")]) === null, "locate: a shorter name is another place");
ok(ms.locate({ zh: "天安门广场" }, [P("a", "天安门")]) === null, "locate: 天安门 is not 天安门广场");
ok(ms.locate({ zh: "外滩" }, [P("a", "外滩观光隧道"), P("b", "外滩")])?.id === "b", "locate: the same name before a longer one");

// ---- merging: list first, automatic picks fill to 5 without repeats ----
const terracotta = { e: entries[1], poi: P("t", "秦始皇帝陵博物院", "109.27,34.38") };
const wall = { e: entries[0], poi: P("w", "西安城墙-永宁门", "108.947,34.251") };
const missing = { e: draft("610100", 3, "回民街", { reviewedOn: "2026-11-06" }), poi: null };
const auto = [
  P("h", "汉城湖", "108.97,34.32"), P("w", "西安城墙-永宁门", "108.947,34.251"), P("t2", "兵马俑", "109.271,34.381"),
  P("n", "西安城墙南门箭楼", "108.9472,34.2505"), P("e", "西安世博园", "109.06,34.32"), P("x", "大明宫国家遗址公园", "108.96,34.29"), P("y", "曲江池", "108.99,34.2"),
];
const m = ms.mergePicks([terracotta, wall, missing], auto);
ok(m.listed.length === 3, "merge: every listed sight kept, also when Amap didn't find it");
ok(m.fill.map((p) => p.id).join() === "h,e", `merge: fill to 5 without the listed ones (by id, name, 500 m): got ${m.fill.map((p) => p.id)}`);
const six = Array.from({ length: 6 }, (_, i) => ({ e: draft("610100", i + 1, `景点${i}`), poi: P(`s${i}`, `景点${i}`, `10${i},30`) }));
ok(ms.mergePicks(six, auto).fill.length === 0, "merge: a list of 6 shows all 6, no fill");
const square = { e: draft("110000", 1, "天安门广场", { reviewedOn: "2026-11-06" }), poi: P("sq", "天安门广场", "116.3975,39.9037") };
ok(ms.mergePicks([square], [P("nm", "中国国家博物馆", "116.4012,39.9050")]).fill.length === 1, "merge: a neighbour 360 m away is kept");
ok(ms.mergePicks([], auto).fill.map((p) => p.id).join() === "h,w,t2,n,e", "merge: no list = the automatic top 5 unchanged");

if (failures.length) { console.error(`must-see: ${failures.length} failed\n- ${failures.join("\n- ")}`); process.exit(1); }
console.log(`must-see: ok (${data.entries.length} entries in ${Object.keys(byCity).length} cities, ${bundledReviewed.length} reviewed)`);
