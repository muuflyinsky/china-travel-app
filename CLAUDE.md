# China Travel Buddy — notes for Claude

@AGENTS.md

Start here: `docs/PROJECT.md` — current stage, which checkout/branch to use, open tasks and decisions, and the hand-off rules (§7). Keep it current when you finish.

Product spec: `docs/SPEC.md` (what every screen does, integrations, open questions). Read it before proposing product changes.

## Commands
- `npm run dev` — local dev server (works without keys: demo data)
- `npm run verify` — typecheck + offline allergen regression; must pass before pushing (a hook in `.claude/settings.json` runs it before `git push` and blocks on failure; commits are not checked)
- `npm run build` — production build; CI (`.github/workflows/ci.yml`) runs verify + build on every PR
- `node scripts/build-cities.mjs <china-division/dist>` — regenerate `lib/data/cities.json`

## Shipping
Vercel deploys `main`, so `main` only moves through a pull request with green CI. Work on a branch, then before merging:
1. `haode-test-engineer` checks the change against its acceptance criteria (and `haode-allergen-safety` for anything touching verdicts, ingredients or dish prompts).
2. `haode-release-manager` runs the release checklist and writes the release notes.
3. Veer merges. Agents never push `main`.

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
