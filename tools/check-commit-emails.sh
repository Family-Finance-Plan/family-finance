#!/usr/bin/env bash
# R-029: every commit in the range must use a no-reply author and committer email,
# so no personal address reaches the public history. Usage: tools/check-commit-emails.sh <base>..<head>
set -euo pipefail
range="${1:?usage: check-commit-emails.sh <base>..<head>}"
emails=$(git log --format='%h %ae%n%h %ce' "$range")
bad=$(printf '%s
' "$emails" | grep -vE ' ([0-9]+\+)?[A-Za-z0-9._-]+(\[bot\])?@users\.noreply\.github\.com$| noreply@github\.com$| bot@family-finance\.invalid$' || true)
if [ -n "$bad" ]; then
  echo "R-029: commits with a non-noreply email (use your GitHub noreply address):"
  echo "$bad" | awk '{print "  " $1}' | sort -u
  exit 1
fi
echo "R-029: commit emails ok"
