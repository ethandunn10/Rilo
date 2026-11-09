#!/usr/bin/env bash
# After private-commit.sh, your worktree still holds the edits: this moves it to main once every local change is
# already on main (else it refuses and lists what isn't).
#
#   scripts/worktree-sync.sh <worktree>
#
# Build output and dependencies are skipped (build/, node_modules/, .build/, DerivedData/); add your own to SKIP.
set -euo pipefail
WT="$1"
SKIP='(^|/)(build|node_modules|\.build|DerivedData)(/|$)'
cd "$WT"
MAIN="$(git rev-parse refs/heads/main)"
bad=0
while IFS= read -r line; do
  path="${line:3}"
  [[ "$path" =~ $SKIP ]] && continue
  [[ -d "$path" ]] && continue
  if [[ -e "$path" ]]; then
    if ! git cat-file -e "$MAIN:$path" 2>/dev/null || ! cmp -s "$path" <(git show "$MAIN:$path"); then
      echo "NOT ON MAIN: $path"; bad=1
    fi
  elif git cat-file -e "$MAIN:$path" 2>/dev/null; then
    echo "DELETED HERE, ON MAIN: $path"; bad=1
  fi
done < <(git status --porcelain --untracked-files=all)
[[ $bad == 0 ]] || { echo "REFUSED: commit or drop those first" >&2; exit 1; }
git reset -q --hard
# Untracked files that main now has (committed through the private index): drop them so checkout can land.
{ git status --porcelain --untracked-files=all | grep '^?? ' || true; } | cut -c4- | while IFS= read -r path; do
  if git cat-file -e "$MAIN:$path" 2>/dev/null; then rm -f "$path"; fi
done
git checkout -q --detach "$MAIN"
git log --oneline -1 | cut -c1-80
