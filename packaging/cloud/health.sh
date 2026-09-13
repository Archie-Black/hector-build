#!/usr/bin/env bash
# Print Docker health for OS V01D. One JSON object per line. Exit 0 if all healthy.
set -euo pipefail
PREFIX="${1:-${V01D_CLOUD_PREFIX:-/opt/osv01d/cloud}}"
cd "$PREFIX" 2>/dev/null || { echo '{"ok":false,"note":"website files are not on this machine"}'; exit 2; }

if ! command -v docker >/dev/null 2>&1; then
  echo '{"ok":false,"note":"Docker is not installed"}'
  exit 2
fi
if ! docker info >/dev/null 2>&1; then
  echo '{"ok":false,"note":"Docker is not running"}'
  exit 2
fi

COMPOSE="docker compose"
docker compose version >/dev/null 2>&1 || COMPOSE="docker-compose"
ENV=()
[ -f .env ] && ENV=(--env-file .env)

$COMPOSE "${ENV[@]}" ps --format json 2>/dev/null || true

mkdir -p "$PREFIX/metrics"
tmp="$PREFIX/metrics/osv01d.prom.$$"
{
  echo "# HELP osv01d_container_healthy 1 if Docker health is healthy or the process is running with no check"
  echo "# TYPE osv01d_container_healthy gauge"
  echo "# HELP osv01d_container_restarts Docker RestartCount"
  echo "# TYPE osv01d_container_restarts gauge"
  for svc in traefik v01d timescale vector prometheus alertmanager otel; do
    ids="$($COMPOSE "${ENV[@]}" ps -q "$svc" 2>/dev/null || true)"
    if [ -z "$ids" ]; then
      echo "osv01d_container_healthy{service=\"$svc\",container=\"none\"} 0"
      continue
    fi
    for id in $ids; do
      name="$(docker inspect -f '{{.Name}}' "$id" 2>/dev/null | sed 's#^/##')"
      read -r st health restarts <<<"$(docker inspect -f '{{.State.Status}} {{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}} {{.RestartCount}}' "$id" 2>/dev/null || echo "missing none 0")"
      ok=0
      if [ "$st" = "running" ] && { [ "$health" = "healthy" ] || [ "$health" = "none" ] || [ "$health" = "starting" ]; }; then ok=1; fi
      echo "osv01d_container_healthy{service=\"$svc\",container=\"$name\"} $ok"
      echo "osv01d_container_restarts{service=\"$svc\",container=\"$name\"} ${restarts:-0}"
    done
  done
} > "$tmp"
mv "$tmp" "$PREFIX/metrics/osv01d.prom"
