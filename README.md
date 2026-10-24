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
| `TRIP_SUB3` | Placement id from your Trip.com link (`trip_sub3=`) | Trip.com Affiliate dashboard |
| `FLIGGY_PID` | Commission on Fliggy | 淘宝联盟 pub.alimama.com |
| `ESIM_AIRALO_URL`, `ESIM_HOLAFLY_URL`, `ESIM_SAILY_URL`, `ESIM_NOMAD_URL`, `ESIM_KLOOK_URL` | eSIM commission: paste the tracking link each programme gives you | Each provider’s affiliate programme (Impact, CJ, PartnerStack…) |

## Screens

| Screen | What it does |
|---|---|
| **Today** | Asks once whether you're *planning* or *in China*, with a switch at the top. Planning: arrival countdown and a get-ready checklist (visa, payments, eSIM, apps, bookings, allergies). In China: city, menu scan, “Where to?”, weather, Alipay / WeChat Pay shortcuts, a permitted-stay countdown with a calendar reminder, and show-to-someone cards. |
| **Eat** | Photo or typed dish names → translation, pinyin, ingredients (menu vs typical recipe), allergens and diet conflicts, “safe for me” filter, prices in your home currency, allergy / order cards. |
| **Go** | Place search in any city, GPS with WGS-84→GCJ-02 correction, metro / bus / walk / taxi routes worded in your language, Amap & Apple Maps hand-off, taxi card, nearby metro / toilet / pharmacy / ATM / hospital. |
| **Stay** | Trip.com / Fliggy hotel search (affiliate), Amap hotel list with prices converted to your currency. |
| **Talk** | Two-way translation with voice, offline phrasebook. |
| **Settings** (gear) | Language, home currency, planning / in China, arrival date, entry date & entry type (visa-free 30 days, 240-h transit, visa), allergies, diet. Stored on the phone only. |
| **Pay** | Opens the Alipay pay code / scanner and WeChat, price check with the ~3 % foreign-card fee, setup steps. |
| **Mobile data** | eSIM providers (Holafly, Airalo, Saily, Nomad, Trip.com, Klook) with tracked affiliate links, plus local SIM advice. |
| **Before you go** | Visa & entry, apps to install (with icons and store links), trains / flights / attraction tickets, good to know. |
| **Emergency** | One-tap emergency numbers, “I need help” card, lost passport steps. |

App text is available in English, Español, Français, Deutsch, 日本語 and 한국어 (`lib/i18n/`); menus and translation work in all 15 languages. App icons are fetched from the App Store by `/api/app-icon/[id]` and cached, with a brand-coloured monogram fallback.

## Every city in China

- `lib/data/cities.json` lists all 2,213 cities and counties in mainland China (369 prefecture-level), with adcode, English name and pinyin, built from the [china-division](https://github.com/modood/Administrative-divisions-of-China) dataset by `scripts/build-cities.mjs`. Re-run it when administrative divisions change.
- The traveller’s city is detected from GPS (Amap reverse geocoding → adcode) or picked from a searchable list (English, pinyin or Chinese), then shared by every screen: weather, place search, nearby, hotels, train/flight origin, attraction tickets, and the menu reader (regional dish versions).
- Amap search, routing and weather work in every city once `AMAP_KEY` is set. Trip.com links use a city ID for major cities and the English city name as a search keyword elsewhere.

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
app/api/regeo        GET browser GPS → GCJ-02 + city
app/api/weather      GET Amap 4-day forecast
app/api/fx           GET exchange rate (ECB via frankfurter, offline fallback)
app/api/go           GET tracked affiliate redirect → logs clicks to Supabase `clicks` (data/clicks.jsonl without it)
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
4. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY so dishes, events, feedback and clicks are stored (supabase/migrations/).
5. Wrap as a native app (Capacitor) once the PWA is validated.

## Not verified in this prototype

The build sandbox could not reach `restapi.amap.com` or the Anthropic API, so the live Amap and Claude paths are type-checked but were only exercised in demo mode. Run them once with real keys before relying on them.
