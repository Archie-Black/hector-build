#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BIN="$ROOT/runtime/matrix/conduwuit"
CFG="$ROOT/packaging/matrix/conduwuit.toml"
DB="$ROOT/data/matrix/db"
LOG="$ROOT/data/matrix/conduwuit.log"
PIDF="$ROOT/data/matrix/conduwuit.pid"
mkdir -p "$DB"
if [[ -f "$PIDF" ]] && kill -0 "$(cat "$PIDF")" 2>/dev/null; then
  echo "LIVE matrix pid=$(cat "$PIDF") :6167"
  exit 0
fi
nohup "$BIN" -c "$CFG" >"$LOG" 2>&1 &
echo $! >"$PIDF"
sleep 0.4
if kill -0 "$(cat "$PIDF")" 2>/dev/null; then
  echo "LIVE matrix pid=$(cat "$PIDF") :6167"
else
  echo "STUB matrix failed"; tail -n 20 "$LOG" || true
  exit 1
fi
