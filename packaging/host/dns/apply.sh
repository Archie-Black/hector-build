#!/usr/bin/env bash
# Upsert doomchat.ca wildcard + isolation-zone records.
# Needs: HECTOR_HOST_IP, and either:
#   Cloudflare: CF_API_TOKEN + CF_ZONE_ID
#   or BIND:    BIND_ZONE_FILE (rewrites A 0.0.0.0)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
IP="${HECTOR_HOST_IP:-}"
IP6="${HECTOR_HOST_IP6:-}"
ZONE="doomchat.ca"

if [[ -z "$IP" ]]; then
  echo "Set HECTOR_HOST_IP to the VPS address." >&2
  exit 2
fi

if [[ -n "${BIND_ZONE_FILE:-}" ]]; then
  sed "s/0\.0\.0\.0/$IP/g" "$ROOT/packaging/host/dns/doomchat.ca.zone" > "$BIND_ZONE_FILE"
  echo "wrote $BIND_ZONE_FILE"
  exit 0
fi

if [[ -z "${CF_API_TOKEN:-}" || -z "${CF_ZONE_ID:-}" ]]; then
  echo "BIND_ZONE_FILE or CF_API_TOKEN+CF_ZONE_ID required." >&2
  echo "Zone file is packaging/host/dns/doomchat.ca.zone" >&2
  exit 2
fi

cf() {
  curl -fsS -X "$1" "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records$2" \
    -H "Authorization: Bearer ${CF_API_TOKEN}" \
    -H "Content-Type: application/json" \
    --data "${3:-}"
}

NAMES="@ www hx y files updates chat matrix ollama mcp api build * *.build"
for name in $NAMES; do
  body=$(printf '{"type":"A","name":"%s","content":"%s","ttl":300,"proxied":%s}' \
    "$name" "$IP" "$([[ "$name" == "matrix" ]] && echo false || echo true)")
  cf POST "" "$body" >/dev/null || true
  if [[ -n "$IP6" ]]; then
    body6=$(printf '{"type":"AAAA","name":"%s","content":"%s","ttl":300,"proxied":%s}' \
      "$name" "$IP6" "$([[ "$name" == "matrix" ]] && echo false || echo true)")
    cf POST "" "$body6" >/dev/null || true
  fi
done

cf POST "" '{"type":"TXT","name":"@","content":"v=spf1 -all","ttl":300}' >/dev/null || true
cf POST "" '{"type":"TXT","name":"_dmarc","content":"v=DMARC1; p=reject; rua=mailto:Deltakingzero@doomchat.ca","ttl":300}' >/dev/null || true
echo "wildcard DNS upserted for $ZONE → $IP"
