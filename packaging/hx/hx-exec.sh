#!/usr/bin/env bash
# Hyper PBX → VSCodium on the vscodium-swarm. Spectral HX stays the face.
set -eu
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
FOLDER="${1:-$ROOT}"
shift || true
BIN="${CODIUM:-}"
if [ -z "$BIN" ]; then
  if command -v codium >/dev/null 2>&1; then
    BIN="$(command -v codium)"
  elif [ -x /opt/vscodium/bin/codium ]; then
    BIN=/opt/vscodium/bin/codium
  elif [ -x "$HOME/.local/bin/codium" ]; then
    BIN="$HOME/.local/bin/codium"
  elif [ -x "$ROOT/runtime/vscodium/bin/codium" ]; then
    BIN="$ROOT/runtime/vscodium/bin/codium"
  fi
fi
if [ -z "${BIN:-}" ] || [ ! -x "$BIN" ]; then
  echo "wait codium (packaging/linux/install-vscodium.sh)" >&2
  exit 1
fi
VS="$ROOT/packaging/hx/codium/.vscode"
HX="${HECTOR_PREFIX:-$HOME}/v01d/hx"
mkdir -p "$HX"
if [ -d "$VS" ]; then
  mkdir -p "$FOLDER/.vscode" "$HX/.vscode"
  cp -a "$VS/." "$FOLDER/.vscode/" 2>/dev/null || true
  cp -a "$VS/." "$HX/.vscode/" 2>/dev/null || true
fi
echo "hx-exec vscodium-swarm $BIN $FOLDER"
exec "$BIN" "$FOLDER" --new-window "$@"
