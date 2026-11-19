---
name: dish-prompt-eval
description: "Evaluate a change to the dish prompts or the model before it ships: records a real model run over the 72-dish allergen test set, compares it with the current prompt, and decides whether it may merge. Use whenever lib/dishes.ts (FACTS_SYSTEM, DETAIL_SYSTEM), lib/ingredients.ts, lib/verdict.ts, PROMPT_VERSION, AI_MODEL_TEXT / CLAUDE_MODEL or the model provider changes, or when someone asks \"is prompt v2 better\", \"can we switch to model X\", \"test the dish prompt\"."
user-invocable: true
argument-hint: "[candidate branch or label]"
---

# Dish prompt evaluation

A dish answer decides whether a traveller with an allergy eats something. A prompt or model change ships only after it has been run on the test set and compared with what is live now.

What exists:

| Piece | What it does |
|---|---|
| `eval/allergens/testset.csv` | 72 dishes from the 2026-10-25 safety review, with the allergens of the standard recipe (D), common hidden variants (H), meat, alcohol, spice |
| `scripts/eval-dishes.mjs` | Calls the configured model with the app's own list prompt (`generateFacts`), same batching as `/api/menu`, and saves the answers to `eval/allergens/runs/<date>-<label>.json`. Never touches the Supabase dish cache |
| `scripts/check-allergens.mjs --output <run>` | The CI check on any saved run: leaks against `known-leaks.json` |
| `scripts/compare-dish-evals.mjs <baseline> <candidate> --md <file>` | Side by side: leaks, severe-allergy misses, verdicts that got less strict, hidden allergens caught and lost, extra flags, unanswered dishes, changed dish names. Exits 1 on any new leak, dish unanswered in either run, verdict less strict than the baseline, lost hidden allergen, leak not in `known-leaks.json`, or runs that can't be compared (either not recorded by `eval-dishes.mjs`, different language, more than 2 days apart) |

The offline CI check (`npm run verify`) only replays the answers stored on 2026-10-25. It cannot see a prompt change; this skill can.

## Before running

1. Say what will be called and what it costs: the full set is about 44 model calls per run, two runs per comparison (baseline + candidate). Use `--ids` to re-run single dishes.
2. A model key must be in `.env.local` (`AI_API_KEY`, or `ANTHROPIC_API_KEY`). Cloud sessions usually have none: stop and say so instead of faking a run. Never put a key in a file that is committed or in a message.
3. Both runs use the same model, language and day. Record them back to back; a run from another week is not a baseline.

## Steps

1. **Baseline** — on the current `origin/main` (a separate worktree is easiest):
   `node scripts/eval-dishes.mjs --label main`
2. **Candidate** — on the branch with the change:
   `node scripts/eval-dishes.mjs --label <branch-or-version>`
   If the change is a model switch, set `AI_MODEL_TEXT` / `CLAUDE_MODEL` for this run only and label it with the model name.
3. **Compare**:
   `node scripts/compare-dish-evals.mjs eval/allergens/runs/<date>-main.json eval/allergens/runs/<date>-<label>.json --md eval/allergens/runs/<date>-<label>.md`
4. **Noise check** — models are not deterministic. For every new leak, fixed leak, less-strict verdict and lost hidden allergen, re-run just those dishes twice for both sides (`--ids 3,17`; each re-run gets its own file). A problem that appears in any candidate run counts.
5. **Name check by hand** — the script can't judge translation. Read the "Dish names that changed" table: a name that is wrong, misleading about what is in the dish, or not what a bilingual menu would say is a finding.
6. **Safety review** — give the report to `haode-allergen-safety` (required by CLAUDE.md for anything touching dish prompts).

## Merge rule

- **Do not merge** when the candidate has, after the noise check, a leak the baseline doesn't, a leak not in `known-leaks.json` (even one the baseline shares), or an unanswered dish.
- **Known severe-allergy misses:** `known-leaks.json` holds 8 from the 2026-10-25 run where a severe allergy does not get "don't order". They are open safety bugs, not accepted behaviour: they may stay until fixed, and the list may not grow. A candidate never adds to it; `check-allergens.mjs` fails above 8 (`MAX_KNOWN_SEVERE`), and raising that is a decision for Veer in its own PR.
- **Less strict than the baseline, or a hidden allergen lost:** do not merge unless `haode-allergen-safety` accepts each remaining line by name in its review, citing an outside recipe (the `source` column of the test set or better). A model's or reviewer's own judgement is not enough. "Don't order" becoming "ask first" also offers to leave out a main ingredient, so it is never a neutral change.
- **Fewer leaks or more hidden allergens caught**: good, but more extra flags is only acceptable when it buys fewer leaks — every extra flag is one more question to the waiter.
- Equal on safety: decide on names and extra flags; say which way and why.
- A merged prompt change bumps `PROMPT_VERSION` in `lib/dish-cache.ts`, so cached answers from the old prompt are regenerated. Say in the PR that this costs model calls as dishes are looked up again.
- When the candidate becomes the new normal, the CI baseline is a separate decision for Veer: replacing `model-output-2026-10-25.json` and `known-leaks.json` changes what CI accepts. Never do it in the same PR without saying so.

## What goes in the PR

The `.md` report, the two run files (`eval/allergens/runs/` is git-ignored so stray runs don't get committed: add these with `git add -f`), the commands run, the noise-check result, the name-check findings, and what was not tested. In particular:

- Only the **list** prompt (`FACTS_SYSTEM`) is scored. The detail prompt (`DETAIL_SYSTEM`) only ever makes a verdict stricter (`withDetailAllergens`, covered by the detail-merge cases in `check-allergens.mjs`), but its text is not evaluated here.
- Answers are scored in the language of the run (default English). Test another language with `--lang` when the change is about wording.
- Menu photo reading (vision model) is not covered; `scripts/eval-menus.mjs` does that against a running server once `eval/menus/` has real photos. Run it only without Supabase keys in the environment, or it writes to the shared dish cache.
- 72 dishes, one region each, are a floor, not proof. Say so.
