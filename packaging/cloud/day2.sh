#!/usr/bin/env bash
# Day-2 autonomic: heal, rotate, prune. Hector can call this.
set -euo pipefail
PREFIX="${V01D_CLOUD_PREFIX:-/opt/osv01d/cloud}"
cd "$PREFIX"
COMPOSE="docker compose"
docker compose version >/dev/null 2>&1 || COMPOSE="docker-compose"

heal() {
  bash "$(dirname "$0")/repair.sh"
}

rotate() {
  umask 077
  JWT="$(openssl rand -hex 32)"
  if grep -q '^JWT_SECRET=' .env; then
    sed -i "s/^JWT_SECRET=.*/JWT_SECRET=${JWT}/" .env
  else
    echo "JWT_SECRET=${JWT}" >> .env
  fi
  chmod 600 .env
  $COMPOSE --env-file .env up -d v01d
}

prune() {
  docker image prune -f
  docker builder prune -f --filter until=168h
}

case "${1:-heal}" in
  heal) heal ;;
  rotate) rotate ;;
  prune) prune ;;
  all) heal; prune ;;
  *) echo "usage: day2.sh heal|rotate|prune|all"; exit 1 ;;
esac
