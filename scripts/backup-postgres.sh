#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE="${ENV_FILE:-.env.local-vps}"
BACKUP_DIR="${1:-$ROOT_DIR/backups}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/fullhouse_${TIMESTAMP}.sql.gz"

get_env_value() {
  local key="$1"
  grep -E "^${key}=" "$ENV_FILE" | head -n 1 | cut -d= -f2-
}

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE"
  exit 1
fi

DB_USER="$(get_env_value DB_USER)"
DB_NAME="$(get_env_value DB_NAME)"

mkdir -p "$BACKUP_DIR"

echo "Creating PostgreSQL backup: $BACKUP_FILE"
docker compose --env-file "$ENV_FILE" exec -T db \
  pg_dump -U "${DB_USER}" -d "${DB_NAME}" | gzip -9 > "$BACKUP_FILE"

echo "Backup complete: $BACKUP_FILE"
