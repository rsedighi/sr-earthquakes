#!/usr/bin/env bash
# Upload historical earthquake data to R2.
#
# Prereqs:
#   1. `wrangler r2 bucket create earthquake-historical`
#   2. You're logged in: `wrangler login`
#
# Run: npm run upload:historical
#
# Adds new data*.json files later? Just drop them in data/ and re-run.

set -euo pipefail

BUCKET="earthquake-historical"
SRC_DIR="data"

if [ ! -d "$SRC_DIR" ]; then
  echo "❌ $SRC_DIR/ not found"
  exit 1
fi

shopt -s nullglob
files=("$SRC_DIR"/data*.json)
if [ ${#files[@]} -eq 0 ]; then
  echo "❌ No data*.json files in $SRC_DIR/"
  exit 1
fi

echo "📦 Uploading ${#files[@]} files to R2 bucket: $BUCKET"

for f in "${files[@]}"; do
  key="historical/$(basename "$f")"
  echo "  → $key ($(du -h "$f" | cut -f1))"
  npx wrangler r2 object put "$BUCKET/$key" \
    --file="$f" \
    --content-type="application/json" \
    --remote
done

# Manifest so the worker knows which files to load (without listing the bucket
# on every cold start). Update when adding/removing files.
manifest=$(printf '"historical/%s",' $(ls "$SRC_DIR"/data*.json | xargs -n1 basename))
manifest="{\"files\":[${manifest%,}]}"
echo "$manifest" > /tmp/historical-manifest.json
echo "📝 Uploading manifest: $manifest"
npx wrangler r2 object put "$BUCKET/historical/manifest.json" \
  --file=/tmp/historical-manifest.json \
  --content-type="application/json" \
  --remote
rm /tmp/historical-manifest.json

echo "✅ Done."
