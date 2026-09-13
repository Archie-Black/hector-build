#!/usr/bin/env bash
# Add or replace website copies. Always keep one healthy copy.
set -euo pipefail
PREFIX="${V01D_CLOUD_PREFIX:-/opt/osv01d/cloud}"
cd "$PREFIX" 2>/dev/null || { echo "This machine is not hosting the website."; exit 2; }
COMPOSE="docker compose"
docker compose version >/dev/null 2>&1 || COMPOSE="docker-compose"
ENV=()
[ -f .env ] && ENV=(--env-file .env)
ACTION="${1:-status}"
WANT="${2:-2}"

copies() { $COMPOSE "${ENV[@]}" ps -q v01d 2>/dev/null | wc -l | tr -d ' '; }
healthy() {
  local n=0 id
  for id in $($COMPOSE "${ENV[@]}" ps -q v01d 2>/dev/null); do
    st="$(docker inspect -f '{{.State.Status}} {{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$id" 2>/dev/null || true)"
    case "$st" in
      "running healthy"|"running none") n=$((n + 1)) ;;
    esac
  done
  echo "$n"
}

wait_healthy() {
  local i=0
  while [ "$i" -lt 30 ]; do
    if [ "$(healthy)" -ge 1 ]; then return 0; fi
    sleep 2
    i=$((i + 1))
  done
  return 1
}

case "$ACTION" in
  status)
    echo "Website copies: $(copies) running, $(healthy) healthy."
    ;;
  scale)
    if [ "$(healthy)" -lt 1 ]; then
      echo "No healthy website copy. Restart services first."
      exit 1
    fi
    if [ "$WANT" -lt 1 ]; then WANT=1; fi
    if [ "$WANT" -gt 4 ]; then WANT=4; fi
    echo "Setting website copies to $WANT."
    $COMPOSE "${ENV[@]}" up -d --no-deps --scale v01d="$WANT" --no-recreate
    wait_healthy
    echo "Website copies: $(copies) running, $(healthy) healthy."
    ;;
  roll)
    if [ "$(healthy)" -lt 1 ]; then
      echo "No healthy website copy. Restart services first."
      exit 1
    fi
    NOW="$(copies)"
    NEXT=$((NOW + 1))
    if [ "$NEXT" -gt 4 ]; then NEXT=4; fi
    echo "Starting a new website copy first."
    $COMPOSE "${ENV[@]}" up -d --no-deps --scale v01d="$NEXT" --no-recreate
    wait_healthy || { echo "New copy did not become healthy."; exit 1; }
    OLD=""
    BEST=-1
    for id in $($COMPOSE "${ENV[@]}" ps -q v01d); do
      rc="$(docker inspect -f '{{.RestartCount}}' "$id" 2>/dev/null || echo 0)"
      if [ "${rc:-0}" -ge "$BEST" ]; then BEST="$rc"; OLD="$id"; fi
    done
    if [ "$(healthy)" -ge 2 ] && [ -n "$OLD" ]; then
      echo "Stopping the oldest website copy."
      docker stop "$OLD" >/dev/null
      docker rm "$OLD" >/dev/null || true
    fi
    $COMPOSE "${ENV[@]}" up -d --no-deps --scale v01d="$NOW" --no-recreate
    echo "Website copies: $(copies) running, $(healthy) healthy."
    ;;
  *)
    echo "usage: orchestrate.sh status|scale N|roll"
    exit 1
    ;;
esac
