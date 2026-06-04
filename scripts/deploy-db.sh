#!/bin/bash
# ═══════════════════════════════════════════════════
# Sync local DB to VPS
# Run from your LOCAL machine
# ⚠️  This REPLACES the VPS database!
# ═══════════════════════════════════════════════════
set -e

VPS_IP="212.47.79.230"
VPS_USER="root"
DB_NAME="full_house"

echo "═══ 1/3 — Dumping local DB ═══"
PGPASSWORD=postgres pg_dump -U postgres -h localhost full_house_copy > /tmp/full_house_sync.sql
echo "  Size: $(du -h /tmp/full_house_sync.sql | cut -f1)"

echo "═══ 2/3 — Uploading to VPS ═══"
scp /tmp/full_house_sync.sql ${VPS_USER}@${VPS_IP}:/tmp/

echo "═══ 3/3 — Importing on VPS ═══"
ssh ${VPS_USER}@${VPS_IP} << REMOTE
set -e
export NVM_DIR="\$HOME/.nvm"
[ -s "\$NVM_DIR/nvm.sh" ] && . "\$NVM_DIR/nvm.sh"

pm2 stop full-house
sudo -u postgres dropdb ${DB_NAME} --if-exists
sudo -u postgres createdb ${DB_NAME}
sudo -u postgres psql ${DB_NAME} < /tmp/full_house_sync.sql
rm /tmp/full_house_sync.sql
pm2 restart full-house
echo "✅ Database synced!"
REMOTE

rm /tmp/full_house_sync.sql
echo "✅ Done!"
