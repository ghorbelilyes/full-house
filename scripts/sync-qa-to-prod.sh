#!/bin/bash
# ============================================================================
# Full House — QA → Prod Data Sync Script
# ============================================================================
# Exports catalog/content/settings data from QA and imports into Prod.
# Skips transactional data (orders, customers, carts, sessions).
#
# Usage:
#   ./scripts/sync-qa-to-prod.sh                    # interactive mode
#   ./scripts/sync-qa-to-prod.sh --export-only      # only export from QA
#   ./scripts/sync-qa-to-prod.sh --import-only       # only import to Prod
#   ./scripts/sync-qa-to-prod.sh --dry-run           # show what would happen
#
# ============================================================================

set -euo pipefail

# ── Colors ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ── Configuration ──
# Override these via environment variables or edit here

# QA Database
QA_DB_HOST="${QA_DB_HOST:-localhost}"
QA_DB_PORT="${QA_DB_PORT:-5432}"
QA_DB_NAME="${QA_DB_NAME:-full_house_qa}"
QA_DB_USER="${QA_DB_USER:-fullhouse}"

# Prod Database
PROD_DB_HOST="${PROD_DB_HOST:-localhost}"
PROD_DB_PORT="${PROD_DB_PORT:-5432}"
PROD_DB_NAME="${PROD_DB_NAME:-full_house}"
PROD_DB_USER="${PROD_DB_USER:-fullhouse}"

# Export directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
EXPORT_DIR="${SCRIPT_DIR}/sync-exports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
EXPORT_PATH="${EXPORT_DIR}/${TIMESTAMP}"

# ── Tables to sync (content/catalog data) ──
# These are the tables you edit in QA and want to push to Prod
CONTENT_TABLES=(
  # Catalog
  "attribute_group"
  "attribute"
  "attribute_group_link"
  "attribute_option"
  "category"
  "category_description"
  "variant_group"
  "product"
  "product_description"
  "product_image"
  "product_inventory"
  "product_attribute_value_index"
  "product_custom_option"
  "product_custom_option_value"
  "product_collection"
  "product_promotion"
  "product_spec_badge"
  "product_trust_badge"
  "collection"
  "url_rewrite"

  # CMS
  "cms_page"
  "cms_page_description"
  "widget"

  # Settings
  "setting"
  "module_config"

  # Shipping
  "shipping_method"
  "shipping_zone"
  "shipping_zone_method"
  "shipping_zone_province"
  "tax_class"
  "tax_rate"

  # Coupons
  "coupon"

  # Email templates
  "email_notification_template"
  "document_template"

  # Spin to Win
  "spin_to_win_reward"
)

# ── Tables that are NEVER synced (transactional/user data) ──
# cart, cart_address, cart_item, customer, customer_address, customer_group,
# order, order_activity, order_address, order_item, payment_transaction,
# shipment, session, reset_password_token, admin_user, migration, event,
# email_notification_log, product_review, product_inventory_history,
# referral, referral_code, referral_reward, referral_visit,
# spin_to_win_spin, wishlist, wishlist_item

# ── Parse arguments ──
EXPORT_ONLY=false
IMPORT_ONLY=false
DRY_RUN=false
SKIP_MEDIA=false

for arg in "$@"; do
  case $arg in
    --export-only)  EXPORT_ONLY=true ;;
    --import-only)  IMPORT_ONLY=true ;;
    --dry-run)      DRY_RUN=true ;;
    --skip-media)   SKIP_MEDIA=true ;;
    --help)
      echo "Usage: $0 [--export-only] [--import-only] [--dry-run] [--skip-media]"
      echo ""
      echo "  --export-only   Only export from QA (no import)"
      echo "  --import-only   Import latest export to Prod"
      echo "  --dry-run       Show what would be synced"
      echo "  --skip-media    Skip media/image file sync"
      exit 0
      ;;
  esac
done

# ── Helper functions ──

log_info()  { echo -e "${BLUE}ℹ${NC}  $1"; }
log_ok()    { echo -e "${GREEN}✅${NC} $1"; }
log_warn()  { echo -e "${YELLOW}⚠️${NC}  $1"; }
log_error() { echo -e "${RED}❌${NC} $1"; }

check_db_connection() {
  local host=$1 port=$2 dbname=$3 user=$4 label=$5
  if PGPASSWORD="${6:-}" psql -h "$host" -p "$port" -U "$user" -d "$dbname" -c "SELECT 1" > /dev/null 2>&1; then
    log_ok "$label database connected ($dbname@$host:$port)"
    return 0
  else
    log_error "Cannot connect to $label database ($dbname@$host:$port)"
    return 1
  fi
}

get_table_count() {
  local host=$1 port=$2 dbname=$3 user=$4 table=$5
  PGPASSWORD="${6:-}" psql -h "$host" -p "$port" -U "$user" -d "$dbname" -t -c "SELECT COUNT(*) FROM \"$table\";" 2>/dev/null | tr -d ' '
}

# ── Main ──

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Full House — QA → Prod Data Sync                ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# Ask for passwords
if [ "$IMPORT_ONLY" = false ]; then
  if [ -z "${QA_DB_PASSWORD:-}" ]; then
    read -sp "🔑 QA database password ($QA_DB_USER@$QA_DB_HOST): " QA_DB_PASSWORD
    echo ""
  fi
fi

if [ "$EXPORT_ONLY" = false ]; then
  if [ -z "${PROD_DB_PASSWORD:-}" ]; then
    read -sp "🔑 Prod database password ($PROD_DB_USER@$PROD_DB_HOST): " PROD_DB_PASSWORD
    echo ""
  fi
fi

echo ""

# ── Dry run mode ──
if [ "$DRY_RUN" = true ]; then
  log_info "DRY RUN — showing what would be synced:"
  echo ""
  printf "  %-40s %s\n" "TABLE" "QA ROWS"
  printf "  %-40s %s\n" "────────────────────────────────────────" "───────"
  for table in "${CONTENT_TABLES[@]}"; do
    count=$(get_table_count "$QA_DB_HOST" "$QA_DB_PORT" "$QA_DB_NAME" "$QA_DB_USER" "$table" "$QA_DB_PASSWORD" 2>/dev/null || echo "?")
    printf "  %-40s %s\n" "$table" "$count"
  done
  echo ""
  log_info "Use without --dry-run to execute."
  exit 0
fi

# ══════════════════════════════════════════════════════
# PHASE 1: EXPORT FROM QA
# ══════════════════════════════════════════════════════

if [ "$IMPORT_ONLY" = false ]; then
  echo -e "${YELLOW}━━━ Phase 1: Export from QA ━━━${NC}"
  echo ""

  # Check connection
  check_db_connection "$QA_DB_HOST" "$QA_DB_PORT" "$QA_DB_NAME" "$QA_DB_USER" "QA" "$QA_DB_PASSWORD" || exit 1

  # Create export directory
  mkdir -p "$EXPORT_PATH"
  log_info "Export directory: $EXPORT_PATH"
  echo ""

  # Export each table
  EXPORTED=0
  for table in "${CONTENT_TABLES[@]}"; do
    count=$(get_table_count "$QA_DB_HOST" "$QA_DB_PORT" "$QA_DB_NAME" "$QA_DB_USER" "$table" "$QA_DB_PASSWORD" 2>/dev/null || echo "0")
    
    if [ "$count" = "0" ] || [ "$count" = "" ]; then
      log_warn "$table — empty, skipping"
      continue
    fi

    PGPASSWORD="$QA_DB_PASSWORD" pg_dump \
      -h "$QA_DB_HOST" -p "$QA_DB_PORT" -U "$QA_DB_USER" -d "$QA_DB_NAME" \
      --table="\"$table\"" \
      --data-only \
      --column-inserts \
      --on-conflict-do-nothing \
      -f "$EXPORT_PATH/${table}.sql" 2>/dev/null

    if [ $? -eq 0 ]; then
      log_ok "$table — $count rows exported"
      EXPORTED=$((EXPORTED + 1))
    else
      log_error "$table — export failed"
    fi
  done

  echo ""
  log_ok "Exported $EXPORTED tables to $EXPORT_PATH"

  # Save metadata
  cat > "$EXPORT_PATH/metadata.json" << EOF
{
  "timestamp": "$TIMESTAMP",
  "source": "$QA_DB_NAME@$QA_DB_HOST",
  "tables_exported": $EXPORTED,
  "tables": [$(printf '"%s",' "${CONTENT_TABLES[@]}" | sed 's/,$//')]
}
EOF

  # Create a "latest" symlink
  ln -sfn "$EXPORT_PATH" "$EXPORT_DIR/latest"

  if [ "$EXPORT_ONLY" = true ]; then
    echo ""
    log_ok "Export complete. Run with --import-only to push to Prod."
    exit 0
  fi
fi

# ══════════════════════════════════════════════════════
# PHASE 2: IMPORT TO PROD
# ══════════════════════════════════════════════════════

echo ""
echo -e "${YELLOW}━━━ Phase 2: Import to Prod ━━━${NC}"
echo ""

# Determine import path
if [ "$IMPORT_ONLY" = true ]; then
  if [ -L "$EXPORT_DIR/latest" ]; then
    EXPORT_PATH=$(readlink -f "$EXPORT_DIR/latest")
    log_info "Using latest export: $EXPORT_PATH"
  else
    log_error "No export found. Run with --export-only first."
    exit 1
  fi
fi

# Check connection
check_db_connection "$PROD_DB_HOST" "$PROD_DB_PORT" "$PROD_DB_NAME" "$PROD_DB_USER" "Prod" "$PROD_DB_PASSWORD" || exit 1

# ── Confirmation ──
echo ""
echo -e "${RED}┌──────────────────────────────────────────────────┐${NC}"
echo -e "${RED}│  ⚠️  WARNING: This will OVERWRITE Prod data!     │${NC}"
echo -e "${RED}│  Tables: ${#CONTENT_TABLES[@]} content tables                     │${NC}"
echo -e "${RED}│  Source: $QA_DB_NAME                          │${NC}"
echo -e "${RED}│  Target: $PROD_DB_NAME                            │${NC}"
echo -e "${RED}└──────────────────────────────────────────────────┘${NC}"
echo ""
read -p "Type 'SYNC' to confirm: " CONFIRM
if [ "$CONFIRM" != "SYNC" ]; then
  log_warn "Aborted."
  exit 1
fi

echo ""

# ── Backup Prod first ──
log_info "Backing up Prod database first..."
BACKUP_PATH="${EXPORT_DIR}/prod-backup-${TIMESTAMP}.sql"
PGPASSWORD="$PROD_DB_PASSWORD" pg_dump \
  -h "$PROD_DB_HOST" -p "$PROD_DB_PORT" -U "$PROD_DB_USER" -d "$PROD_DB_NAME" \
  -f "$BACKUP_PATH" 2>/dev/null

if [ $? -eq 0 ]; then
  BACKUP_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
  log_ok "Prod backup saved ($BACKUP_SIZE): $BACKUP_PATH"
else
  log_error "Prod backup failed! Aborting."
  exit 1
fi

echo ""

# ── Import tables in correct order (respect foreign keys) ──
# Order: independent tables first, then dependent ones

IMPORT_ORDER=(
  # Level 0 — no dependencies
  "setting"
  "module_config"
  "attribute_group"
  "tax_class"
  "collection"
  "shipping_method"
  "shipping_zone"
  "cms_page"
  "widget"
  "coupon"
  "email_notification_template"
  "document_template"
  "spin_to_win_reward"

  # Level 1 — depends on Level 0
  "attribute"
  "attribute_group_link"
  "category"
  "shipping_zone_method"
  "shipping_zone_province"
  "tax_rate"
  "cms_page_description"

  # Level 2 — depends on Level 1
  "attribute_option"
  "category_description"
  "variant_group"

  # Level 3 — depends on Level 2
  "product"

  # Level 4 — depends on product
  "product_description"
  "product_image"
  "product_inventory"
  "product_attribute_value_index"
  "product_custom_option"
  "product_collection"
  "product_promotion"
  "product_spec_badge"
  "product_trust_badge"
  "url_rewrite"

  # Level 5 — depends on product_custom_option
  "product_custom_option_value"
)

log_info "Importing tables to Prod..."
echo ""

# Disable FK checks during import, truncate and re-insert
IMPORTED=0
FAILED=0

for table in "${IMPORT_ORDER[@]}"; do
  SQL_FILE="$EXPORT_PATH/${table}.sql"
  
  if [ ! -f "$SQL_FILE" ]; then
    continue  # table was empty/skipped during export
  fi

  # Truncate + import inside a transaction
  RESULT=$(PGPASSWORD="$PROD_DB_PASSWORD" psql \
    -h "$PROD_DB_HOST" -p "$PROD_DB_PORT" -U "$PROD_DB_USER" -d "$PROD_DB_NAME" \
    -v ON_ERROR_STOP=1 \
    -c "BEGIN;" \
    -c "ALTER TABLE \"$table\" DISABLE TRIGGER ALL;" \
    -c "DELETE FROM \"$table\";" \
    -f "$SQL_FILE" \
    -c "ALTER TABLE \"$table\" ENABLE TRIGGER ALL;" \
    -c "COMMIT;" 2>&1)

  if [ $? -eq 0 ]; then
    new_count=$(get_table_count "$PROD_DB_HOST" "$PROD_DB_PORT" "$PROD_DB_NAME" "$PROD_DB_USER" "$table" "$PROD_DB_PASSWORD")
    log_ok "$table — $new_count rows"
    IMPORTED=$((IMPORTED + 1))
  else
    log_error "$table — import failed"
    echo "    $RESULT" | head -3
    FAILED=$((FAILED + 1))
  fi
done

# ── Reset identity sequences ──
echo ""
log_info "Resetting ID sequences..."

for table in "${IMPORT_ORDER[@]}"; do
  SQL_FILE="$EXPORT_PATH/${table}.sql"
  [ ! -f "$SQL_FILE" ] && continue

  # Find the identity column name
  ID_COL=$(PGPASSWORD="$PROD_DB_PASSWORD" psql \
    -h "$PROD_DB_HOST" -p "$PROD_DB_PORT" -U "$PROD_DB_USER" -d "$PROD_DB_NAME" \
    -t -c "SELECT column_name FROM information_schema.columns 
           WHERE table_name='$table' AND table_schema='public' AND is_identity='YES'
           LIMIT 1;" 2>/dev/null | tr -d ' ')

  if [ -n "$ID_COL" ]; then
    PGPASSWORD="$PROD_DB_PASSWORD" psql \
      -h "$PROD_DB_HOST" -p "$PROD_DB_PORT" -U "$PROD_DB_USER" -d "$PROD_DB_NAME" \
      -c "SELECT setval(pg_get_serial_sequence('\"$table\"', '$ID_COL'), 
          COALESCE((SELECT MAX(\"$ID_COL\") FROM \"$table\"), 0) + 1, false);" \
      > /dev/null 2>&1
  fi
done

log_ok "Sequences reset"

# ══════════════════════════════════════════════════════
# PHASE 3: SYNC MEDIA FILES
# ══════════════════════════════════════════════════════

if [ "$SKIP_MEDIA" = false ]; then
  echo ""
  echo -e "${YELLOW}━━━ Phase 3: Media files ━━━${NC}"
  echo ""
  
  # If on same server (QA and Prod are different folders)
  QA_MEDIA="${QA_MEDIA_PATH:-/var/www/fullhouse-qa/media}"
  PROD_MEDIA="${PROD_MEDIA_PATH:-/var/www/fullhouse-prod/media}"

  if [ -d "$QA_MEDIA" ] && [ -d "$PROD_MEDIA" ]; then
    log_info "Syncing media: $QA_MEDIA → $PROD_MEDIA"
    rsync -av --delete "$QA_MEDIA/" "$PROD_MEDIA/" 2>/dev/null
    log_ok "Media synced"
  else
    log_warn "Media directories not found. Sync manually:"
    echo "    rsync -av QA_SERVER:/var/www/fullhouse-qa/media/ /var/www/fullhouse-prod/media/"
  fi
fi

# ══════════════════════════════════════════════════════
# SUMMARY
# ══════════════════════════════════════════════════════

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Sync Complete!                                      ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  Tables imported:  ${IMPORTED}                                  ║${NC}"
echo -e "${GREEN}║  Tables failed:    ${FAILED}                                  ║${NC}"
echo -e "${GREEN}║  Prod backup:      ${BACKUP_PATH}  ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

if [ $FAILED -gt 0 ]; then
  log_warn "Some tables failed. To rollback Prod:"
  echo "    PGPASSWORD=xxx psql -h $PROD_DB_HOST -U $PROD_DB_USER -d $PROD_DB_NAME < $BACKUP_PATH"
fi

echo ""
log_info "Remember to restart the Prod server:"
echo "    pm2 restart fullhouse-prod"
echo ""
