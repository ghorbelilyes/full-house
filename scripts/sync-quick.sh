#!/bin/bash
# ============================================================================
# Quick Sync — Push only specific content type from QA to Prod
# ============================================================================
# Usage:
#   ./scripts/sync-quick.sh products     # sync only products
#   ./scripts/sync-quick.sh widgets      # sync only widgets + CMS
#   ./scripts/sync-quick.sh settings     # sync only settings
#   ./scripts/sync-quick.sh all          # sync everything (same as full sync)
#
# ============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ── Config (same env vars as sync-qa-to-prod.sh) ──
QA_DB_HOST="${QA_DB_HOST:-localhost}"
QA_DB_PORT="${QA_DB_PORT:-5432}"
QA_DB_NAME="${QA_DB_NAME:-full_house_qa}"
QA_DB_USER="${QA_DB_USER:-fullhouse}"

PROD_DB_HOST="${PROD_DB_HOST:-localhost}"
PROD_DB_PORT="${PROD_DB_PORT:-5432}"
PROD_DB_NAME="${PROD_DB_NAME:-full_house}"
PROD_DB_USER="${PROD_DB_USER:-fullhouse}"

# ── What to sync ──
MODE="${1:-help}"

case "$MODE" in
  products)
    TABLES=(
      "attribute_group" "attribute" "attribute_group_link" "attribute_option"
      "category" "category_description"
      "variant_group"
      "product" "product_description" "product_image" "product_inventory"
      "product_attribute_value_index" "product_custom_option"
      "product_custom_option_value" "product_collection"
      "product_promotion" "product_spec_badge" "product_trust_badge"
      "collection" "url_rewrite"
    )
    LABEL="Produits (Products + Categories + Attributes)"
    ;;
  widgets)
    TABLES=("widget" "cms_page" "cms_page_description")
    LABEL="Widgets + Pages CMS"
    ;;
  settings)
    TABLES=("setting" "module_config")
    LABEL="Paramètres (Settings)"
    ;;
  shipping)
    TABLES=("shipping_method" "shipping_zone" "shipping_zone_method" "shipping_zone_province")
    LABEL="Livraison (Shipping)"
    ;;
  coupons)
    TABLES=("coupon")
    LABEL="Coupons"
    ;;
  marketing)
    TABLES=("spin_to_win_reward" "coupon")
    LABEL="Marketing (Spin to Win + Coupons)"
    ;;
  taxes)
    TABLES=("tax_class" "tax_rate")
    LABEL="Taxes"
    ;;
  emails)
    TABLES=("email_notification_template" "document_template")
    LABEL="Email templates"
    ;;
  all)
    exec "$(dirname "$0")/sync-qa-to-prod.sh"
    ;;
  help|*)
    echo ""
    echo -e "${BLUE}Usage: $0 <category>${NC}"
    echo ""
    echo "  products    — Produits, catégories, attributs, collections"
    echo "  widgets     — Widgets, pages CMS"
    echo "  settings    — Paramètres du magasin"
    echo "  shipping    — Zones et méthodes de livraison"
    echo "  coupons     — Coupons de réduction"
    echo "  marketing   — Roue de chance + coupons"
    echo "  taxes       — Classes et taux de taxe"
    echo "  emails      — Modèles d'emails"
    echo "  all         — Tout synchroniser"
    echo ""
    exit 0
    ;;
esac

echo ""
echo -e "${BLUE}━━━ Sync rapide: $LABEL ━━━${NC}"
echo -e "${BLUE}  QA:   $QA_DB_NAME → Prod: $PROD_DB_NAME${NC}"
echo ""

# Passwords
[ -z "${QA_DB_PASSWORD:-}" ] && read -sp "🔑 QA password: " QA_DB_PASSWORD && echo ""
[ -z "${PROD_DB_PASSWORD:-}" ] && read -sp "🔑 Prod password: " PROD_DB_PASSWORD && echo ""

echo ""
echo -e "${YELLOW}Tables à synchroniser:${NC}"
for t in "${TABLES[@]}"; do
  qa_count=$(PGPASSWORD="$QA_DB_PASSWORD" psql -h "$QA_DB_HOST" -p "$QA_DB_PORT" -U "$QA_DB_USER" -d "$QA_DB_NAME" -t -c "SELECT COUNT(*) FROM \"$t\";" 2>/dev/null | tr -d ' ')
  prod_count=$(PGPASSWORD="$PROD_DB_PASSWORD" psql -h "$PROD_DB_HOST" -p "$PROD_DB_PORT" -U "$PROD_DB_USER" -d "$PROD_DB_NAME" -t -c "SELECT COUNT(*) FROM \"$t\";" 2>/dev/null | tr -d ' ')
  echo -e "  $t:  QA=${qa_count:-?}  →  Prod=${prod_count:-?}"
done

echo ""
read -p "Confirmer? (o/n): " CONFIRM
[ "$CONFIRM" != "o" ] && [ "$CONFIRM" != "O" ] && echo "Annulé." && exit 0

# Backup affected tables
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUP_DIR="${SCRIPT_DIR}/sync-exports"
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="${BACKUP_DIR}/prod-partial-$(date +%Y%m%d_%H%M%S).sql"

echo ""
echo -e "${BLUE}Sauvegarde des tables Prod...${NC}"
TABLE_ARGS=""
for t in "${TABLES[@]}"; do
  TABLE_ARGS="$TABLE_ARGS --table=\"$t\""
done
eval PGPASSWORD="$PROD_DB_PASSWORD" pg_dump \
  -h "$PROD_DB_HOST" -p "$PROD_DB_PORT" -U "$PROD_DB_USER" -d "$PROD_DB_NAME" \
  $TABLE_ARGS -f "$BACKUP_FILE" 2>/dev/null
echo -e "${GREEN}✅${NC} Sauvegarde: $BACKUP_FILE"

# Sync each table
echo ""
for t in "${TABLES[@]}"; do
  # Export from QA
  PGPASSWORD="$QA_DB_PASSWORD" pg_dump \
    -h "$QA_DB_HOST" -p "$QA_DB_PORT" -U "$QA_DB_USER" -d "$QA_DB_NAME" \
    --table="\"$t\"" --data-only --column-inserts --on-conflict-do-nothing \
    -f "/tmp/sync_${t}.sql" 2>/dev/null

  if [ ! -s "/tmp/sync_${t}.sql" ]; then
    echo -e "${YELLOW}⚠️${NC}  $t — vide, ignoré"
    continue
  fi

  # Import to Prod
  PGPASSWORD="$PROD_DB_PASSWORD" psql \
    -h "$PROD_DB_HOST" -p "$PROD_DB_PORT" -U "$PROD_DB_USER" -d "$PROD_DB_NAME" \
    -v ON_ERROR_STOP=1 \
    -c "ALTER TABLE \"$t\" DISABLE TRIGGER ALL;" \
    -c "DELETE FROM \"$t\";" \
    -f "/tmp/sync_${t}.sql" \
    -c "ALTER TABLE \"$t\" ENABLE TRIGGER ALL;" > /dev/null 2>&1

  # Reset sequence
  ID_COL=$(PGPASSWORD="$PROD_DB_PASSWORD" psql \
    -h "$PROD_DB_HOST" -p "$PROD_DB_PORT" -U "$PROD_DB_USER" -d "$PROD_DB_NAME" \
    -t -c "SELECT column_name FROM information_schema.columns 
           WHERE table_name='$t' AND table_schema='public' AND is_identity='YES'
           LIMIT 1;" 2>/dev/null | tr -d ' ')

  if [ -n "$ID_COL" ]; then
    PGPASSWORD="$PROD_DB_PASSWORD" psql \
      -h "$PROD_DB_HOST" -p "$PROD_DB_PORT" -U "$PROD_DB_USER" -d "$PROD_DB_NAME" \
      -c "SELECT setval(pg_get_serial_sequence('\"$t\"', '$ID_COL'), 
          COALESCE((SELECT MAX(\"$ID_COL\") FROM \"$t\"), 0) + 1, false);" \
      > /dev/null 2>&1
  fi

  new_count=$(PGPASSWORD="$PROD_DB_PASSWORD" psql -h "$PROD_DB_HOST" -p "$PROD_DB_PORT" -U "$PROD_DB_USER" -d "$PROD_DB_NAME" -t -c "SELECT COUNT(*) FROM \"$t\";" 2>/dev/null | tr -d ' ')
  echo -e "${GREEN}✅${NC} $t — $new_count lignes"

  rm -f "/tmp/sync_${t}.sql"
done

echo ""
echo -e "${GREEN}✅ Sync terminé!${NC}"
echo -e "${YELLOW}⚡ N'oubliez pas: pm2 restart fullhouse-prod${NC}"
echo ""
