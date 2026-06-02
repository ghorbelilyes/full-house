#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE="${ENV_FILE:-.env.local-vps}"
COMPOSE_CMD=(docker compose --env-file "$ENV_FILE")

get_env_value() {
  local key="$1"
  grep -E "^${key}=" "$ENV_FILE" | head -n 1 | cut -d= -f2-
}

if [[ ! -f "$ENV_FILE" ]]; then
  cp .env.local-vps.example "$ENV_FILE"
  echo "Created $ENV_FILE from template."
  echo "Edit $ENV_FILE first, then run this script again."
  exit 1
fi

DB_USER="$(get_env_value DB_USER)"
DB_NAME="$(get_env_value DB_NAME)"
STORE_URL="$(get_env_value STORE_URL)"
HTTP_PORT="$(get_env_value HTTP_PORT)"

echo "Building app image..."
"${COMPOSE_CMD[@]}" build app

echo "Starting full stack..."
"${COMPOSE_CMD[@]}" up -d

echo "Waiting for PostgreSQL..."
for _ in {1..30}; do
  if "${COMPOSE_CMD[@]}" exec -T db pg_isready -U "${DB_USER}" -d "${DB_NAME}" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

echo "Applying local safety settings (payments disabled)..."
"${COMPOSE_CMD[@]}" exec -T db psql -v ON_ERROR_STOP=1 -U "${DB_USER}" -d "${DB_NAME}" <<'SQL'
INSERT INTO setting (name, value, is_json)
VALUES ('stripePaymentStatus', '0', FALSE)
ON CONFLICT (name) DO UPDATE SET value = EXCLUDED.value, is_json = FALSE;

INSERT INTO setting (name, value, is_json)
VALUES ('paypalPaymentStatus', '0', FALSE)
ON CONFLICT (name) DO UPDATE SET value = EXCLUDED.value, is_json = FALSE;
SQL

echo "Restarting app to ensure settings are reloaded..."
"${COMPOSE_CMD[@]}" restart app

echo "Deployment complete."
echo "Open: ${STORE_URL:-http://<VM_IP>}:${HTTP_PORT:-80}"
echo "Status:"
"${COMPOSE_CMD[@]}" ps
