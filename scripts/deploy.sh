#!/bin/bash
# ═══════════════════════════════════════════════════
# Quick deploy — push code changes to VPS
# Run from your LOCAL machine
# ═══════════════════════════════════════════════════
set -e

VPS_IP="212.47.79.230"
VPS_USER="root"
APP_DIR="/var/www/full-house"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "═══ 1/3 — Packing code ═══"
cd "$PROJECT_DIR"
tar czf /tmp/full-house-update.tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=.env \
  --exclude=.env.local-vps \
  .
echo "  Archive: $(du -h /tmp/full-house-update.tar.gz | cut -f1)"

echo "═══ 2/3 — Uploading to VPS ═══"
scp /tmp/full-house-update.tar.gz ${VPS_USER}@${VPS_IP}:/tmp/

echo "═══ 3/3 — Building on VPS ═══"
ssh ${VPS_USER}@${VPS_IP} << 'REMOTE'
set -e
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

APP_DIR="/var/www/full-house"
cd ${APP_DIR}

# Stop the app
pm2 stop full-house

# Extract new code (preserves .env, node_modules, media)
tar xzf /tmp/full-house-update.tar.gz --exclude='.env'

# Install any new dependencies
npm install --production=false 2>&1 | tail -3

# Compile postgres-query-builder if needed
(cd node_modules/@evershop/postgres-query-builder && [ ! -d dist ] && npx tsc || true)

# Compile core
npm run compile

# Copy Card.js + Table.js
cp packages/evershop/src/components/common/ui/Card.js packages/evershop/dist/components/common/ui/Card.js 2>/dev/null || true
cp packages/evershop/src/components/common/ui/Table.js packages/evershop/dist/components/common/ui/Table.js 2>/dev/null || true

# Fix assert → with
find packages/evershop/dist -name '*.js' -exec grep -l "assert {" {} \; 2>/dev/null | while read f; do
  sed -i "s/from '\(.*\.json\)' assert {/from '\1' with {/g" "$f"
  sed -i "s/from \"\(.*\.json\)\" assert {/from \"\1\" with {/g" "$f"
done

# Compile extensions
for ext in extensions/*/; do
  if [ -d "$ext/src" ]; then
    (cd "$ext" && ../../node_modules/.bin/swc src/ -d dist/ --config-file ../../packages/evershop/.swcrc --copy-files --strip-leading-paths)
  fi
done

# Build frontend
npm run build

# Restart
pm2 restart full-house
pm2 logs full-house --lines 5 --nostream

echo ""
echo "✅ Deploy complete!"
REMOTE

rm /tmp/full-house-update.tar.gz
echo ""
echo "✅ Done! Check: http://${VPS_IP}:3000"
