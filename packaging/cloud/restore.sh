#!/usr/bin/env bash
# Load a database dump only if the database is accepting connections.
set -euo pipefail
PREFIX="${V01D_CLOUD_PREFIX:-/opt/osv01d/cloud}"
cd "$PREFIX" 2>/dev/null || { echo "This machine is not hosting the website."; exit 2; }
COMPOSE="docker compose"
docker compose version >/dev/null 2>&1 || COMPOSE="docker-compose"
ENV=()
[ -f .env ] && ENV=(--env-file .env)
set -a
[ -f .env ] && . ./.env
set +a

id="$($COMPOSE "${ENV[@]}" ps -q timescale 2>/dev/null | head -n1)"
if [ -z "$id" ]; then
  echo "Database container is not running. Not restoring."
  exit 1
fi
if ! docker exec "$id" pg_isready -U "${PG_USER:-v01d}" -d "${PG_DB:-v01d}" >/dev/null 2>&1; then
  echo "Database is not ready. Not restoring while it is sick."
  exit 1
fi

WANT="${1:-}"
if [ -n "$WANT" ]; then
  dump="$WANT"
  [ -f "$dump" ] || dump="$PREFIX/backups/$(basename "$WANT")"
else
  dump="$(ls -1t "$PREFIX/backups"/v01d-*.sql 2>/dev/null | head -n1 || true)"
fi
if [ -z "${dump:-}" ] || [ ! -f "$dump" ]; then
  echo "No database dump found. Backup the website first."
  exit 1
fi
base="$(basename "$dump")"
case "$base" in
  v01d-????????T??????Z.sql) ;;
  *) echo "That file is not a website dump."; exit 1 ;;
esac

echo "Restoring $base into a live database."
docker exec -i "$id" psql -v ON_ERROR_STOP=1 -U "${PG_USER:-v01d}" -d "${PG_DB:-v01d}" < "$dump" >/dev/null
echo "Database restored from $base."
