# China Travel Buddy — notes for Claude

@AGENTS.md

Product spec: `docs/SPEC.md` (what every screen does, integrations, open questions). Read it before proposing product changes.

## Commands
- `npm run dev` — local dev server (works without keys: demo data)
- `npm run typecheck` — must pass before committing
- `npm run build` — production build; run before pushing (Vercel deploys `main` automatically)
- `node scripts/build-cities.mjs <china-division/dist>` — regenerate `lib/data/cities.json`

## Conventions
- UI text lives in `lib/i18n/en.ts`; add every new key to es/fr/de/ja/ko too (the `Dict` type enforces it). Never hard-code English in components.
- Layout uses the primitives in `components/ui.tsx` (Section, Card, Group, Row, Field, Button, Note, Seg). Don't add ad-hoc margins.
- Colours: cobalt for actions, `bg-cta` (gold) only for affiliate/booking buttons, red/green/amber only for allergy danger/safe/caution.
- Anything shown to Chinese staff (taxi, allergy, order cards) is Simplified Chinese.
- Outbound booking links go through `goLink()` → `/api/go` so clicks are tracked; never link partners directly.
- Secrets stay server-side; no `NEXT_PUBLIC_` env vars.
- Traveller data (allergies, entry date) stays in localStorage; don't send it to the server except what a request needs.

## Verifying UI changes
Check at 390×844 (phone) and 1280 wide, light and dark, and in at least one non-English language.
