#!/usr/bin/env bash
# Hector onion path for bot-to-bot SSH only. Not a default network.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DIR="${HECTOR_TOR_DIR:-$ROOT/data/tor}"
SOCKS_PORT="${HECTOR_TOR_SOCKS:-19050}"
mkdir -p "$DIR/data" "$DIR/hector-ssh"
chmod 700 "$DIR/data" "$DIR/hector-ssh"

as_root() {
  if [ "$(id -u)" -eq 0 ]; then "$@"
  elif command -v sudo >/dev/null 2>&1; then sudo -n "$@" 2>/dev/null || sudo "$@"
  else "$@"; fi
}

if ! command -v tor >/dev/null 2>&1; then
  export DEBIAN_FRONTEND=noninteractive
  as_root apt-get update -y || true
  as_root apt-get install -y tor || true
fi

if ! command -v tor >/dev/null 2>&1; then
  echo "tor binary missing" >&2
  exit 1
fi

cat > "$DIR/torrc" <<EOF
DataDirectory $DIR/data
SocksPort 127.0.0.1:$SOCKS_PORT IsolateSOCKSAuth
ControlPort 0
AvoidDiskWrites 1
HiddenServiceDir $DIR/hector-ssh
HiddenServicePort 22 127.0.0.1:2222
Log notice file $DIR/tor.log
EOF
chmod 600 "$DIR/torrc"

if ! ss -ltn 2>/dev/null | grep -q ":$SOCKS_PORT" && ! netstat -ltn 2>/dev/null | grep -q ":$SOCKS_PORT"; then
  nohup tor -f "$DIR/torrc" >/tmp/hector-tor.boot 2>&1 &
  echo $! > "$DIR/tor.pid"
fi

for _ in $(seq 1 40); do
  if [ -s "$DIR/hector-ssh/hostname" ]; then
    echo "onion $(cat "$DIR/hector-ssh/hostname")"
    exit 0
  fi
  sleep 1
done
echo "tor started, onion hostname pending"
exit 0
