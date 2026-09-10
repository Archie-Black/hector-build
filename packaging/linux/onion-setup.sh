#!/usr/bin/env bash
# Full Tor hidden services for bot-to-bot SSH + share. Keys live in data/share/keys.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DIR="${HECTOR_TOR_DIR:-$ROOT/data/tor}"
SOCKS_PORT="${HECTOR_TOR_SOCKS:-19050}"
CONTROL_PORT="${HECTOR_TOR_CONTROL:-19051}"
SHARE_PORT="${PORT:-8080}"
mkdir -p "$DIR/data" "$DIR/hector-ssh" "$DIR/hector-share" "$DIR/hector-ssh/authorized_clients" "$DIR/hector-share/authorized_clients"
chmod 700 "$DIR/data" "$DIR/hector-ssh" "$DIR/hector-share"

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
SocksPort 127.0.0.1:$SOCKS_PORT IsolateDestAddr IsolateDestPort IsolateSOCKSAuth IsolateClientProtocol IsolateClientAddr KeepAliveIsolateSOCKSAuth
ControlPort 127.0.0.1:$CONTROL_PORT
CookieAuthentication 1
CookieAuthFile $DIR/data/control_auth_cookie
AvoidDiskWrites 1
SafeLogging 1
LongLivedPorts 22
MaxCircuitDirtiness 600
NewCircuitPeriod 30
CircuitBuildTimeout 10
LearnCircuitBuildTimeout 1
EnforceDistinctSubnets 1
UseEntryGuards 1
NumEntryGuards 2
KeepalivePeriod 60
HiddenServiceDir $DIR/hector-ssh
HiddenServiceVersion 3
HiddenServicePort 22 127.0.0.1:2222
HiddenServiceMaxStreams 32
HiddenServiceMaxStreamsCloseCircuit 1
HiddenServiceDir $DIR/hector-share
HiddenServiceVersion 3
HiddenServicePort 80 127.0.0.1:$SHARE_PORT
Log notice file $DIR/tor.log
EOF
chmod 600 "$DIR/torrc"

if ! ss -ltn 2>/dev/null | grep -q ":$SOCKS_PORT" && ! netstat -ltn 2>/dev/null | grep -q ":$SOCKS_PORT"; then
  nohup tor -f "$DIR/torrc" >/tmp/hector-tor.boot 2>&1 &
  echo $! > "$DIR/tor.pid"
fi

for _ in $(seq 1 40); do
  if [ -s "$DIR/hector-ssh/hostname" ]; then
    echo "ssh-onion $(cat "$DIR/hector-ssh/hostname")"
    [ -s "$DIR/hector-share/hostname" ] && echo "share-onion $(cat "$DIR/hector-share/hostname")"
    exit 0
  fi
  sleep 1
done
echo "tor started, onion hostname pending"
exit 0
