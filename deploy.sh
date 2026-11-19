#!/usr/bin/env bash
# Deploy app/ to https://shalmezad.com/FRC2619Scout/index.html
#
# The bucket name and CloudFront distribution ID are deliberately NOT stored
# in this repo (it is public):
#   - bucket: pass via SCOUT_BUCKET
#   - distribution: discovered automatically by its shalmezad.com alias
set -euo pipefail
cd "$(dirname "$0")"

: "${SCOUT_BUCKET:?Set SCOUT_BUCKET first, e.g.  SCOUT_BUCKET=s3://your-bucket ./deploy.sh}"
DOMAIN=shalmezad.com
PREFIX=FRC2619Scout

# Discover the distribution ID serving $DOMAIN (no hardcoded infra IDs).
DIST=$(aws cloudfront list-distributions --output json | python3 -c "
import json, sys
items = json.load(sys.stdin).get('DistributionList', {}).get('Items', [])
wanted = ('$DOMAIN', 'www.$DOMAIN')
for d in items:
    aliases = d.get('Aliases', {}).get('Items', [])
    if any(a in wanted for a in aliases):
        print(d['Id'])
        break
")
[ -n "$DIST" ] || { echo "ERROR: no CloudFront distribution found for $DOMAIN" >&2; exit 1; }

put() { # <file> <content-type> <cache-control>
  aws s3 cp "app/$1" "$SCOUT_BUCKET/$PREFIX/$1" --content-type "$2" --cache-control "$3" >/dev/null
  echo "  uploaded $1"
}

echo "Uploading to $SCOUT_BUCKET/$PREFIX/ (distribution: $DIST)"
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

echo "Done. Live: https://$DOMAIN/$PREFIX/index.html"
