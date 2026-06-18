#!/usr/bin/env bash
#
# Submit Lighthouse / Core Web Vitals reports to EagleEye via curl.
#
# Usage:
#   ./scripts/submit-reports.sh [data-file]
#   BASE_URL=https://webvitals-analyser.vercel.app ./scripts/submit-reports.sh scripts/reports.json
#
# Data file format: JSON array of page objects with mobile + desktop metrics.
# See scripts/reports.example.json for a template.
#
# Requires: curl, jq

set -euo pipefail

BASE_URL="${BASE_URL:-https://webvitals-analyser.vercel.app}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_FILE="${1:-${SCRIPT_DIR}/reports.json}"
PLATFORMS=(mobile desktop)

if ! command -v curl >/dev/null 2>&1; then
  echo "error: curl is required" >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "error: jq is required (brew install jq / apt install jq)" >&2
  exit 1
fi

if [[ ! -f "$DATA_FILE" ]]; then
  echo "error: data file not found: $DATA_FILE" >&2
  echo "Copy scripts/reports.example.json to scripts/reports.json and edit it." >&2
  exit 1
fi

API_URL="${BASE_URL%/}/api/lighthouse"
TOTAL=0
OK=0
FAILED=0

echo "Submitting reports to ${API_URL}"
echo "Data file: ${DATA_FILE}"
echo

while IFS= read -r entry; do
  route=$(echo "$entry" | jq -r '.route')
  team=$(echo "$entry" | jq -r '.team')

  for platform in "${PLATFORMS[@]}"; do
    TOTAL=$((TOTAL + 1))

    if ! echo "$entry" | jq -e ".${platform}" >/dev/null 2>&1; then
      echo "[skip] ${route} (${platform}) — no ${platform} block in data"
      TOTAL=$((TOTAL - 1))
      continue
    fi

    payload=$(echo "$entry" | jq --arg platform "$platform" '{
      route: .route,
      team: .team,
      platform: $platform,
      performance: .[$platform].performance,
      fcp: .[$platform].fcp,
      lcp: .[$platform].lcp,
      inp: .[$platform].inp,
      cls: .[$platform].cls,
      accessibility: .[$platform].accessibility,
      bestPractices: .[$platform].bestPractices,
      seo: .[$platform].seo,
      lowScoreReasons: (.[$platform].lowScoreReasons // "")
    }')

    response=$(curl -sS -w "\n%{http_code}" -X POST "$API_URL" \
      -H "Content-Type: application/json" \
      -d "$payload")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [[ "$http_code" == "201" ]]; then
      OK=$((OK + 1))
      report_id=$(echo "$body" | jq -r '.data._id // "?"')
      echo "[ok]   ${route} (${platform}) → ${report_id}"
    else
      FAILED=$((FAILED + 1))
      error=$(echo "$body" | jq -r '.error // .' 2>/dev/null || echo "$body")
      echo "[fail] ${route} (${platform}) HTTP ${http_code}: ${error}" >&2
    fi
  done
done < <(jq -c '.[]' "$DATA_FILE")

echo
echo "Done: ${OK}/${TOTAL} succeeded, ${FAILED} failed"

if [[ "$FAILED" -gt 0 ]]; then
  exit 1
fi
