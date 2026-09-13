#!/usr/bin/env bash
# Verification suite for the OS V01D fabric. Exit 1 on a real hole.
set -euo pipefail
PREFIX="${1:-${V01D_CLOUD_PREFIX:-/opt/osv01d/cloud}}"
CLOUD="$(cd "$(dirname "$0")" && pwd)"
fail=0
ok() { printf 'PASS %s\n' "$*"; }
no() { printf 'FAIL %s\n' "$*"; fail=1; }

compose="$PREFIX/compose.yml"
[ -f "$compose" ] || compose="$CLOUD/compose.yml"

grep -q '10.13.0.0/24' "$compose" && ok "fabric subnet" || no "fabric subnet"
grep -q '5432:5432' "$compose" && no "postgres published" || ok "postgres not published"
grep -q '9090:9090' "$compose" && no "prometheus published" || ok "prometheus not published"
grep -q 'docker.sock:/var/run/docker.sock' "$compose" && no "docker.sock mounted" || ok "no docker.sock on traefik/vector"
grep -q '"80:80"' "$compose" && ok "http edge" || no "http edge"
grep -q '"443:443"' "$compose" && ok "https edge" || no "https edge"
n_hc="$(grep -c 'healthcheck:' "$compose" || true)"
[ "$n_hc" -ge 5 ] && ok "healthchecks on $n_hc services" || no "need healthchecks on all core services"
grep -q 'alertmanagers:' "$PREFIX/prometheus/alerts.yml" 2>/dev/null || true
grep -q 'alert: WebsiteDown' "$(dirname "$compose")/prometheus/alerts.yml" && ok "prometheus WebsiteDown alert" || no "prometheus WebsiteDown alert"
grep -q '10.13.0.45' "$compose" && ok "otel collector on overlay" || no "otel collector on overlay"
grep -q '4318' "$compose" && ok "otlp http" || no "otlp http"
grep -q '51820:51820/udp' "$compose" && ok "wireguard udp on the edge" || no "wireguard udp on the edge"

if [ -f "$PREFIX/.env" ]; then
  perm="$(stat -c '%a' "$PREFIX/.env" 2>/dev/null || stat -f '%OLp' "$PREFIX/.env")"
  [ "$perm" = "600" ] && ok ".env 600" || no ".env is $perm"
  grep -q 'change-me' "$PREFIX/.env" && no ".env still has change-me" || ok ".env secrets filled"
fi

if command -v docker >/dev/null 2>&1; then
  if docker compose -f "$compose" --env-file "$PREFIX/.env" config >/dev/null 2>&1; then
    ok "compose config"
  else
    docker compose -f "$compose" config >/dev/null 2>&1 && ok "compose config (no env)" || no "compose config"
  fi
  pub="$(ss -lnt 2>/dev/null | awk '{print $4}' || true)"
  echo "$pub" | grep -q ':5432' && no "host listening on 5432" || ok "host not listening on 5432"
fi

[ "$fail" -eq 0 ]
