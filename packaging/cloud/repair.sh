#!/usr/bin/env bash
# Restart or recreate OS V01D containers that failed healthchecks.
# Never deletes the database volume.
set -euo pipefail
PREFIX="${V01D_CLOUD_PREFIX:-/opt/osv01d/cloud}"
LOG="${PREFIX}/repair.log"
cd "$PREFIX" 2>/dev/null || { echo "website files are not on this machine"; exit 2; }

COMPOSE="docker compose"
docker compose version >/dev/null 2>&1 || COMPOSE="docker-compose"
ENV=()
[ -f .env ] && ENV=(--env-file .env)
PROFILE=()
[ -e /dev/net/tun ] && PROFILE=(--profile wireguard)

log() { printf '%s %s\n' "$(date -u +%FT%TZ)" "$*" | tee -a "$LOG"; }

if ! command -v docker >/dev/null 2>&1; then
  log "Docker is not installed"
  exit 2
fi
if ! docker info >/dev/null 2>&1; then
  if command -v systemctl >/dev/null 2>&1; then
    systemctl start docker || true
    sleep 2
  fi
fi
if ! docker info >/dev/null 2>&1; then
  log "Docker is not running"
  exit 2
fi

SERVICES=(traefik v01d timescale vector prometheus alertmanager otel)

status_of() {
  docker inspect -f '{{.State.Status}} {{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}} {{.RestartCount}}' "$1" 2>/dev/null || echo "missing none 0"
}

cid_of() {
  $COMPOSE "${ENV[@]}" ps -q "$1" 2>/dev/null | head -n1
}

restart_one() {
  local svc="$1" id
  id="$(cid_of "$svc")"
  if [ -z "$id" ]; then
    log "starting $svc"
    $COMPOSE "${ENV[@]}" "${PROFILE[@]}" up -d --no-deps "$svc"
    return
  fi
  log "restarting $svc"
  docker restart "$id" >/dev/null
}

recreate_one() {
  local svc="$1"
  if [ "$svc" = "timescale" ]; then
    log "database stays; restart only"
    restart_one timescale
    return
  fi
  log "recreating $svc"
  $COMPOSE "${ENV[@]}" "${PROFILE[@]}" up -d --no-deps --force-recreate "$svc"
}

count=0
$COMPOSE "${ENV[@]}" "${PROFILE[@]}" up -d --remove-orphans >/dev/null

for svc in "${SERVICES[@]}"; do
  id="$(cid_of "$svc" || true)"
  if [ -z "$id" ]; then
    restart_one "$svc"
    count=$((count + 1))
    continue
  fi
  read -r st health restarts <<<"$(status_of "$id")"
  restarts="${restarts:-0}"
  if [ "$st" = "running" ] && { [ "$health" = "healthy" ] || [ "$health" = "starting" ] || [ "$health" = "none" ]; }; then
    continue
  fi
  if [ "$st" = "restarting" ]; then
    log "$svc is already restarting"
    continue
  fi
  if [ "$svc" = "timescale" ]; then
    restart_one timescale
    count=$((count + 1))
    continue
  fi
  if [ "${restarts:-0}" -ge 2 ]; then
    recreate_one "$svc"
  else
    restart_one "$svc"
  fi
  count=$((count + 1))
done

sleep 8

bad=0
for svc in "${SERVICES[@]}"; do
  id="$(cid_of "$svc" || true)"
  [ -n "$id" ] || { log "$svc still missing"; bad=$((bad + 1)); continue; }
  read -r st health _ <<<"$(status_of "$id")"
  if [ "$st" != "running" ] || [ "$health" = "unhealthy" ]; then
    log "$svc still $st $health"
    bad=$((bad + 1))
  fi
done

bash "$PREFIX/health.sh" "$PREFIX" >/dev/null 2>&1 || true
if [ "$count" -eq 0 ] && [ "$bad" -eq 0 ]; then
  log "all website services are up"
  echo "All website services are up."
  exit 0
fi
if [ "$bad" -gt 0 ]; then
  log "repair finished with $bad still down"
  echo "Restarted what I could. $bad service(s) still down. See $LOG"
  exit 1
fi
log "repair finished, $count service(s) fixed"
echo "Restarted $count website service(s). They are up."
exit 0
