#!/usr/bin/env node
// Downloads each app's App Store icon into public/app-icons/<id>.jpg, so icons show at once instead
// of waiting for /api/app-icon (whose CDN cache is emptied by every deployment). Same lookup as that
// route (bundle id when known, else search term). Re-run when an app changes its icon:
//
//   node scripts/fetch-app-icons.mjs
import { mkdir, writeFile } from "node:fs/promises";

const { createJiti } = await import("jiti");
const { APPS } = await createJiti(import.meta.url).import(new URL("../lib/apps.ts", import.meta.url).pathname);
const out = new URL("../public/app-icons/", import.meta.url);
await mkdir(out, { recursive: true });

let failed = 0;
for (const app of Object.values(APPS)) {
  const country = app.ios?.country ?? "us";
  const url = app.ios?.bundleId
    ? `https://itunes.apple.com/lookup?bundleId=${encodeURIComponent(app.ios.bundleId)}&country=${country}`
    : `https://itunes.apple.com/search?entity=software&limit=1&country=${country}&term=${encodeURIComponent(app.ios?.term ?? app.name)}`;
  try {
    const hit = (await (await fetch(url)).json()).results?.[0];
    const art = (hit?.artworkUrl512 ?? hit?.artworkUrl100)?.replace(/\/\d+x\d+bb\.(jpg|png)$/, "/144x144bb.jpg");
    if (!art) throw new Error("no artwork");
    const img = await fetch(art);
    if (!img.ok) throw new Error(`artwork ${img.status}`);
    await writeFile(new URL(`${app.id}.jpg`, out), Buffer.from(await img.arrayBuffer()));
    console.log(`${app.id}: ${hit.trackName} (${hit.sellerName ?? "?"})`);
  } catch (e) {
    failed++;
    console.log(`${app.id}: FAILED ${e.message} (the page falls back to /api/app-icon)`);
  }
}
if (failed) process.exitCode = 1;
