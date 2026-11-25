#!/usr/bin/env bash
# Prints a GitHub App installation token (valid for 1 hour) for the agents (ADR-011).
# Needs the user environment variables GH_APP_ID, GH_APP_INSTALLATION_ID and GH_APP_KEY_PATH.
# Usage: export GH_TOKEN=$(bash tools/gh-app-token.sh)   Never print, log or save the token (R-007).
set -euo pipefail
b64() { openssl base64 -A | tr '+/' '-_' | tr -d '='; }
now=$(date +%s)
h=$(printf '{"alg":"RS256","typ":"JWT"}' | b64)
p=$(printf '{"iat":%d,"exp":%d,"iss":"%s"}' $((now-60)) $((now+540)) "$GH_APP_ID" | b64)
sig=$(printf '%s.%s' "$h" "$p" | openssl dgst -sha256 -sign "$GH_APP_KEY_PATH" | b64)
curl -sf -X POST -H "Authorization: Bearer $h.$p.$sig" -H "Accept: application/vnd.github+json" \
  "https://api.github.com/app/installations/$GH_APP_INSTALLATION_ID/access_tokens" \
  | python -c "import json,sys;print(json.load(sys.stdin)['token'])"
