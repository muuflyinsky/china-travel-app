#!/usr/bin/env node
// Visa-free rules and the stay countdown (lib/visa.ts, lib/stay.ts) against the checked official
// lists (workspace inbox/2026-11-19-product-免签核对.md). A wrong answer here tells a traveller
// they may stay longer than the law allows, or that a valid route doesn't exist. No network.
//
//   node scripts/check-visa.mjs
let createJiti;
try { ({ createJiti } = await import("jiti")); } catch { console.error("needs jiti (installed with the app's dev dependencies)"); process.exit(2); }
const jiti = createJiti(import.meta.url);
const { visaRule, visaFreeDays, COUNTS } = await jiti.import(new URL("../lib/visa.ts", import.meta.url).pathname);
const { stayWindow } = await jiti.import(new URL("../lib/stay.ts", import.meta.url).pathname);

const fails = [];
const eq = (name, got, want) => { if (JSON.stringify(got) !== JSON.stringify(want)) fails.push(`${name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`); };
// The "policy ends before your trip" note (components/StayWarning.tsx).
const expiryNote = (c, arrival) => { const r = visaRule(c, null); return r.kind === "unilateral" && Boolean(r.until) && arrival > r.until; };
const legal = (nationality, entryType, arrival) => stayWindow({ entryDate: "", arrival, departure: "", entryType, visaDays: 30, nationality })?.legal;

eq("counts", COUNTS, { unilateral: 50, mutual: 29, transit240: 57 });

// Unilateral: 30 days; Russia runs to 2027-12-31, the others to 2026-12-31; Brunei open-ended.
eq("FR rule", visaRule("FR", null), { kind: "unilateral", days: 30, until: "2026-12-31", transitOnly: false });
eq("RU until", visaRule("RU", null).until, "2027-12-31");
eq("BN until", visaRule("BN", null).until, null);
eq("FR 2027 arrival: expiry note", expiryNote("FR", "2027-03-01"), true);
eq("RU 2027 arrival: no expiry note", expiryNote("RU", "2027-03-01"), false);
eq("RU 2028 arrival: expiry note", expiryNote("RU", "2028-01-05"), true);
eq("FR 30-day stay", legal("FR", "visa_free_30", "2026-11-01"), "2026-12-01");

// 240-hour transit: 10 days, only with an onward ticket to a third country.
eq("US onward", visaRule("US", true).kind, "transit240");
eq("US home", visaRule("US", false).kind, "visa");
eq("US transit stay", legal("US", "transit_240", "2026-11-01"), "2026-11-11");

// Mutual: each agreement's own rule.
eq("WS (Samoa)", visaRule("WS", null), { kind: "mutual", days: 30, cap: "180", transitOnly: false });
eq("SG 30 only", visaRule("SG", null), { kind: "mutual", days: 30, transitOnly: false });
eq("TH 30 + 90/180", visaRule("TH", null).cap, "180");
eq("AL 90 in 180", visaRule("AL", null), { kind: "mutual", days: 90, cap: "180", transitOnly: false });
eq("BY 90 a year", visaRule("BY", null), { kind: "mutual", days: 30, cap: "year", transitOnly: false });
eq("MU 60", visaFreeDays("MU"), 60);
eq("SM 90", visaFreeDays("SM"), 90);
eq("MU 60-day stay", legal("MU", "visa_free_30", "2026-11-01"), "2026-12-31");
eq("AM 90-day stay", legal("AM", "visa_free_30", "2026-11-01"), "2027-01-30");
eq("no passport yet: 30", legal("", "visa_free_30", "2026-11-01"), "2026-12-01");
eq("visa: own days", stayWindow({ entryDate: "", arrival: "2026-11-01", departure: "", entryType: "visa", visaDays: 60, nationality: "MU" }).legal, "2026-12-31");

// Not exempt.
eq("IN visa", visaRule("IN", null).kind, "visa");

if (fails.length) { console.error(`visa rules: ${fails.length} wrong\n  ${fails.join("\n  ")}`); process.exit(1); }
console.log("visa rules: all ok");
