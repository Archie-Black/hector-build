#!/usr/bin/env bash
# Second VPS on WireGuard 10.13.1.0/24. Sync dumps. No public database.
set -euo pipefail
PREFIX="${V01D_CLOUD_PREFIX:-/opt/osv01d/cloud}"
cd "$PREFIX" 2>/dev/null || { echo "This machine is not hosting the website."; exit 2; }
WG="$PREFIX/wireguard/wg0.conf"
PEER_FILE="$PREFIX/wireguard/peer.conf"
ACTION="${1:-status}"
ENDPOINT="${2:-}"
PUB="${3:-}"

need_wg() {
  if ! command -v wg >/dev/null 2>&1; then
    echo "wireguard-tools is not installed on this machine."
    exit 1
  fi
}

case "$ACTION" in
  status)
    if [ ! -f "$WG" ]; then
      echo "Mesh config is not on this machine."
      exit 2
    fi
    if command -v wg >/dev/null 2>&1 && wg show wg0 >/dev/null 2>&1; then
      echo "WireGuard is up. Peers:"
      wg show wg0 dump | awk 'NR>1 {print $1}'
    else
      echo "WireGuard config is present. Bring the mesh container up to use it."
    fi
    if [ -f "$PEER_FILE" ]; then
      echo "Peer config for the second box is at $PEER_FILE"
    fi
    ;;
  join)
    need_wg
    if [ -z "$ENDPOINT" ]; then
      echo "Need the other box as host:51820"
      exit 1
    fi
    umask 077
    mkdir -p "$PREFIX/wireguard"
    if [ ! -f "$PREFIX/wireguard/peer.key" ]; then
      wg genkey | tee "$PREFIX/wireguard/peer.key" | wg pubkey > "$PREFIX/wireguard/peer.pub"
      chmod 600 "$PREFIX/wireguard/peer.key"
    fi
    PEER_PRIV="$(tr -d '\n' < "$PREFIX/wireguard/peer.key")"
    PEER_PUB="$(tr -d '\n' < "$PREFIX/wireguard/peer.pub")"
    HOST_PUB=""
    if [ -f /etc/wireguard/v01d.pub ]; then
      HOST_PUB="$(tr -d '\n' < /etc/wireguard/v01d.pub)"
    elif [ -f "$PREFIX/wireguard/v01d.pub" ]; then
      HOST_PUB="$(tr -d '\n' < "$PREFIX/wireguard/v01d.pub")"
    fi
    THEIR="${PUB:-}"
    cat > "$PEER_FILE" <<EOF
[Interface]
Address = 10.13.1.2/24
ListenPort = 51820
PrivateKey = ${PEER_PRIV}

[Peer]
PublicKey = ${HOST_PUB:-REPLACE_HOST_PUB}
Endpoint = ${ENDPOINT}
AllowedIPs = 10.13.1.0/24
PersistentKeepalive = 25
EOF
    chmod 600 "$PEER_FILE"
    if [ -n "$THEIR" ]; then
      if ! grep -q "$THEIR" "$WG" 2>/dev/null; then
        cat >> "$WG" <<EOF

[Peer]
PublicKey = ${THEIR}
AllowedIPs = 10.13.1.2/32
Endpoint = ${ENDPOINT}
PersistentKeepalive = 25
EOF
      fi
    else
      if ! grep -q "$PEER_PUB" "$WG" 2>/dev/null; then
        cat >> "$WG" <<EOF

[Peer]
PublicKey = ${PEER_PUB}
AllowedIPs = 10.13.1.2/32
PersistentKeepalive = 25
EOF
      fi
    fi
    chmod 600 "$WG"
    echo "Peer slot written. Copy $PEER_FILE to the second box as /etc/wireguard/wg0.conf then: wg-quick up wg0"
    echo "Second box address is 10.13.1.2"
    ;;
  sync)
    mkdir -p "$PREFIX/backups"
    if ping -c 1 -W 2 10.13.1.2 >/dev/null 2>&1; then
      rsync -az -e "ssh -o StrictHostKeyChecking=accept-new" "$PREFIX/backups/" "root@10.13.1.2:/opt/osv01d/cloud/backups/" || {
        echo "Could not copy dumps to 10.13.1.2. Is SSH up on the peer?"
        exit 1
      }
      echo "Dumps copied to the second box."
    else
      echo "10.13.1.2 is not reachable. Join the peer first."
      exit 1
    fi
    ;;
  *)
    echo "usage: mesh.sh status|join host:51820 [peer-pubkey]|sync"
    exit 1
    ;;
esac
