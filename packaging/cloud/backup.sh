#!/usr/bin/env bash
# Copy the website database only if it is accepting connections.
set -euo pipefail
PREFIX="${V01D_CLOUD_PREFIX:-/opt/osv01d/cloud}"
cd "$PREFIX" 2>/dev/null || { echo "This machine is not hosting the website."; exit 2; }
COMPOSE="docker compose"
docker compose version >/dev/null 2>&1 || COMPOSE="docker-compose"
ENV=()
[ -f .env ] && ENV=(--env-file .env)
# shellcheck disable=SC1091
set -a
[ -f .env ] && . ./.env
set +a
id="$($COMPOSE "${ENV[@]}" ps -q timescale 2>/dev/null | head -n1)"
if [ -z "$id" ]; then
  echo "Database container is not running. Not copying."
  exit 1
fi
if ! docker exec "$id" pg_isready -U "${PG_USER:-v01d}" -d "${PG_DB:-v01d}" >/dev/null 2>&1; then
  echo "Database is not ready. Not copying while it is sick."
  exit 1
fi
mkdir -p "$PREFIX/backups"
out="$PREFIX/backups/v01d-$(date -u +%Y%m%dT%H%M%SZ).sql"
docker exec "$id" pg_dump -U "${PG_USER:-v01d}" "${PG_DB:-v01d}" > "$out"
chmod 600 "$out"
echo "Database copied to $out"
ls -1t "$PREFIX/backups"/v01d-*.sql 2>/dev/null | tail -n +8 | xargs -r rm --
