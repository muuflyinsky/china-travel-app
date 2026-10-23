# Design critique: v1 prototype (pre-redesign)

Method: impeccable `critique` + `audit` (run in-thread; the mechanical detector `impeccable detect` reported 0 findings), reviewed against 390×844 screenshots in `docs/screenshots/`. Mode: **Operate**, meaning the user is completing a task on a phone, often one-handed, on the street, in bright light, with poor connectivity.

## Design health (Nielsen, 0–4)

| Heuristic | Score | Note |
|---|---|---|
| Visibility of system status | 2 | Menu analysis shows plain text "Reading…" for 10–40 s, with no progress indicator |
| Match with real world | 3 | Pinyin + Chinese + English paired well; allergy card speaks staff language |
| User control & freedom | 3 | Full-screen card closes clearly |
| Consistency & standards | 2 | Web-style pills, emoji icons, 6 tabs, no iOS navigation patterns |
| Error prevention | 3 | Allergy conflicts are flagged before ordering |
| Recognition over recall | 3 | Profile reused across pages |
| Flexibility & efficiency | 2 | No shortcut from Home to the two most-used actions (scan menu, where to) |
| Aesthetic & minimalist | 2 | Yellow banners everywhere (demo, tips, warnings) compete with real warnings |
| Error recovery | 2 | Errors are raw API messages |
| Help & documentation | 3 | Essentials page is thorough but long |
| **Total** | **25/40** | |

## Priority issues

**P1: The brand colour is the same as the warning colour.** China red (#C8102E) as brand sits 4° from the allergy-danger red. A red border on a card no longer means "danger" when buttons are also red. *Fix:* adopt the Porcelain palette (see COLOR_RESEARCH.md). Cobalt goes to actions, gold only to booking, and red only to danger.

**P1: The page looks like it was ported from a website.** It uses emoji icons (rendered differently on iOS, Android and Windows), web pill buttons, 6 bottom tabs (HIG says 2–5), no large titles, and toggle chips around 30 px tall (below the 44 pt touch target). *Fix:* use Konsta UI iOS components, lucide icons, 5 tabs, large-title navbars, grouped inset lists and a segmented control.

**P1: Yellow is overused.** Demo notices, ordering tips and "medium confidence" all share the warning yellow, so the user learns to ignore yellow. *Fix:* demo becomes a small neutral notice, tips become neutral info rows, and yellow/amber is kept for "be careful".

**P2: The Home page is a grid of identical icon cards** (on the craft-floor refuse list). Every action looks equally important, but in practice it's "Scan a menu" and "Where to?" that matter. *Fix:* a hero action for menu scanning, a search field for Go, and secondary tools in a list.

**P2: Commission buttons don't stand out.** "Check price on Trip.com" uses the same style as every other button. *Fix:* use gold `--cta` only for booking actions.

**P2: Body text is 15 px.** iOS body text is 17 pt, and travellers read in sunlight. *Fix:* 17 px body, 13 px floor for secondary text.

**P3: Browser defaults are visible** (focus ring, selection colour, tap highlight, empty grey hotel thumbnails). *Fix:* theme them from the palette, and use an icon placeholder for photos.

## Persona red flags
- **Distracted mobile user (Casey), at a restaurant table, one hand:** the allergy card button sits mid-page, below the tips. It should stay visible after the results load.
- **First-timer (Jordan):** "Essentials" as a tab label is vague. The pre-trip checklist works better on Home, with guides one tap away.
- **Accessibility (Sam):** emoji tab icons are read aloud as "house building" and similar; the chip toggles have no pressed state for screen readers.
