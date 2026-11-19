#!/usr/bin/env bash
# Deploy app/ to https://shalmezad.com/FRC2619Scout/index.html
# Bucket: $SCOUT_BUCKET (private, CloudFront OAI) · Distribution: auto-discovered
set -euo pipefail
cd "$(dirname "$0")"

BUCKET=$SCOUT_BUCKET
PREFIX=FRC2619Scout
DIST=auto-discovered

put() { # <file> <content-type> <cache-control>
  aws s3 cp "app/$1" "$BUCKET/$PREFIX/$1" --content-type "$2" --cache-control "$3" >/dev/null
  echo "  uploaded $1"
}

echo "Uploading to $BUCKET/$PREFIX/"
# Mutable shell: no-cache so updates go live immediately (CloudFront MinTTL=0 honors it)
put index.html            "text/html; charset=utf-8"          "no-cache"
put styles.css            "text/css; charset=utf-8"            "no-cache"
put app.js                "text/javascript; charset=utf-8"     "no-cache"
put manifest.webmanifest  "application/manifest+json"         "no-cache"
put sw.js                 "text/javascript; charset=utf-8"     "no-cache"
# Stable assets: cache for a week (change CACHE in sw.js if these change)
put vendor/qrcode-generator.js "text/javascript; charset=utf-8" "public, max-age=604800"
put vendor/jsQR.js             "text/javascript; charset=utf-8" "public, max-age=604800"
put icon-192.png               "image/png"                       "public, max-age=604800"
put icon-512.png               "image/png"                       "public, max-age=604800"

echo "Invalidating CloudFront ($DIST)..."
aws cloudfront create-invalidation --distribution-id "$DIST" --paths "/$PREFIX/*" \
  --query 'Invalidation.{Id:Id,Status:Status}' --output json

echo "Done. Live: https://shalmezad.com/$PREFIX/index.html"
