# China Travel Buddy — 外国游客来华旅行 App 原型

A mobile-first PWA prototype for foreigners travelling in China: menu reading with allergens, Amap navigation and metro routes, hotel search with Trip.com / Fliggy affiliate links, translation, and trip essentials.

需求脑暴、变现方式和上线合规要点见 **[BRAINSTORM.md](./BRAINSTORM.md)**。

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in keys; leave empty to run in demo mode
npm run dev                  # http://localhost:3000 — open on your phone via LAN IP
```

Every feature works without keys, using sample data (marked with a “Demo data” banner).

| Key | Unlocks | Where to get it |
|---|---|---|
| `ANTHROPIC_API_KEY` | Menu photo recognition, dish knowledge, translation | console.anthropic.com |
| `AMAP_KEY` | POI search, transit / walk / drive routes, hotels, weather | console.amap.com → 应用管理 → **Web服务** Key |
| `TRIP_ALLIANCE_ID`, `TRIP_SID` | Commission on Trip.com bookings | Trip.com Affiliate program |
| `FLIGGY_PID` | Commission on Fliggy | 淘宝联盟 pub.alimama.com |
| `AIRALO_REF` | eSIM commission | Airalo partner program |

## Features

| Screen | What it does | Tech |
|---|---|---|
| **Eat** | Photo / typed dish names → translation into 15 languages, pinyin, description, ingredients (labelled “menu” vs “typical recipe”), allergens (EU 14 + MSG), meat / alcohol / spice flags, conflicts with *your* allergies and diet highlighted, “safe for me only” filter, full-screen Chinese allergy card and “order this” card with TTS | Claude vision + structured outputs (`lib/llm.ts`) |
| **Go** | Search places in any script, current location with WGS-84→GCJ-02 correction, metro / bus / walk / taxi options with English line names + Chinese, deep links to Amap & Apple Maps, “show to driver” card, nearby metro / toilet / pharmacy / ATM / hospital | Amap Web Service v5 (`lib/amap.ts`, `lib/coords.ts`) |
| **Stay** | City / dates / guests → Trip.com and Fliggy search, hotel list from Amap with rating & price, per-hotel “check price” link | `lib/affiliate.ts`, `/api/go` |
| **Talk** | Two-way translation with voice input & speech output, offline phrasebook | Claude + Web Speech API |
| **Trip guide** (from Today) | Allergy / diet / language profile, Alipay & WeChat Pay setup, currency converter, visa-free rules, eSIM, apps, train & flight search, attraction booking, emergency numbers | |
| **Today** | Menu-scan hero, “Where to?”, weather, show-to-someone cards, pre-trip checklist | |

## Design

- **Palette “Porcelain” (青花瓷)**: cobalt `#2B4ACB` for actions, lantern gold `#F2B705` only on booking / commission buttons, porcelain white background. Red, green and amber are reserved for allergy danger, safe and caution. See [docs/design/COLOR_RESEARCH.md](docs/design/COLOR_RESEARCH.md) for the competitor research and method.
- **UI kit**: [Konsta UI](https://konstaui.com) (iOS theme) on Tailwind CSS 4, with [lucide](https://lucide.dev) icons; light and dark mode.
- **Review**: [docs/design/CRITIQUE-v1.md](docs/design/CRITIQUE-v1.md) covers the v1 critique; [before-after.png](docs/design/before-after.png) shows the result.
- **Design skills** (for Claude Code, in `.claude/skills/`): [impeccable](https://github.com/pbakaus/impeccable) (`/impeccable critique|audit|polish …`, detector: `.claude/skills/impeccable/scripts/impeccable detect app components`) and [ui-ux-pro-max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill).

## Architecture

```
app/                 Next.js App Router pages (client components)
app/api/menu         POST photo/text → structured menu (Claude)
app/api/translate    POST text → translation + pinyin (Claude)
app/api/places       GET Amap POI text / around search
app/api/route        GET transit + walking + driving options
app/api/regeo        GET browser GPS → GCJ-02 + city
app/api/weather      GET Amap 4-day forecast
app/api/fx           GET exchange rate (ECB via frankfurter, offline fallback)
app/api/go           GET tracked affiliate redirect → logs clicks to data/clicks.jsonl
lib/                 API clients, affiliate URL builder, allergens, demo data
```

- All third-party keys stay server-side; the browser only talks to `/api/*`.
- Affiliate clicks: `/api/go` only builds URLs for whitelisted partners (no open redirect), attaches `Allianceid` / `SID` and a per-click `trip_sub1`, and appends a JSON line per click — swap for a DB in production.
- Claude calls use `claude-opus-5-5` (override with `CLAUDE_MODEL`) at low effort for latency, with the server-side refusal fallback enabled.
- Profile (allergies, diet, language) is stored only in the browser’s localStorage.

## Before going live

1. Check every URL template in `lib/affiliate.ts` against the partner’s link generator; convert Fliggy links through the 淘宝联盟 API.
2. Buy an Amap commercial licence and IP-whitelist the server.
3. Deploy the backend in Hong Kong / Singapore with your own domain (see BRAINSTORM.md §三).
4. Replace `data/clicks.jsonl` with a database; add privacy policy and analytics.
5. Wrap as a native app (Capacitor) once the PWA is validated.

## Not verified in this prototype

The build sandbox could not reach `restapi.amap.com` or the Anthropic API, so the live Amap and Claude paths are type-checked but were only exercised in demo mode. Run them once with real keys before relying on them.
