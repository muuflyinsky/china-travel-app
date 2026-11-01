#!/bin/bash
# PreToolUse hook: before Claude runs `git push`, run the same checks CI runs
# (types + allergen regression; the build is left to CI). Exit 2 blocks the command and shows
# Claude the failure so it fixes it instead of pushing.
cmd=$(jq -r '.tool_input.command // ""')
echo "$cmd" | grep -Eq '(^|[;&|[:space:]])git[[:space:]]+push([[:space:]]|$)' || exit 0
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
[ -f package.json ] && [ -d node_modules ] || exit 0
if ! out=$(npm run --silent verify 2>&1); then
  echo "Blocked: npm run verify failed. Fix it before pushing." >&2
  echo "$out" | tail -30 >&2
  exit 2
fi
exit 0
