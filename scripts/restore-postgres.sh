#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE="${ENV_FILE:-.env.local-vps}"
BACKUP_FILE="${1:-}"

get_env_value() {
  local key="$1"
  grep -E "^${key}=" "$ENV_FILE" | head -n 1 | cut -d= -f2-
}

if [[ -z "$BACKUP_FILE" ]]; then
  echo "Usage: $0 <backup.sql|backup.sql.gz>"
  exit 1
fi

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "Backup file not found: $BACKUP_FILE"
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE"
  exit 1
fi

DB_USER="$(get_env_value DB_USER)"
DB_NAME="$(get_env_value DB_NAME)"

echo "This will overwrite data in database '${DB_NAME}'."
read -r -p "Type YES to continue: " CONFIRM
if [[ "$CONFIRM" != "YES" ]]; then
  echo "Restore cancelled."
  exit 1
fi

echo "Stopping app during restore..."
docker compose --env-file "$ENV_FILE" stop app

echo "Recreating public schema..."
docker compose --env-file "$ENV_FILE" exec -T db \
  psql -v ON_ERROR_STOP=1 -U "${DB_USER}" -d "${DB_NAME}" \
  -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;"

echo "Importing backup..."
if [[ "$BACKUP_FILE" == *.gz ]]; then
  gzip -dc "$BACKUP_FILE" | docker compose --env-file "$ENV_FILE" exec -T db \
    psql -v ON_ERROR_STOP=1 -U "${DB_USER}" -d "${DB_NAME}"
else
  cat "$BACKUP_FILE" | docker compose --env-file "$ENV_FILE" exec -T db \
    psql -v ON_ERROR_STOP=1 -U "${DB_USER}" -d "${DB_NAME}"
fi

echo "Starting app..."
docker compose --env-file "$ENV_FILE" start app

echo "Restore complete."
