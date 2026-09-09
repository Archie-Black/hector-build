#!/usr/bin/env bash
# Fast Node Manager (fnm) — nvm/.nvmrc/engines compatible. Volta pins also read.
set -euo pipefail

DEST="${1:-}"
if [ -z "$DEST" ]; then
  echo "usage: install-fnm.sh <app-root>"
  exit 1
fi

ARCH="$(uname -m)"
case "$ARCH" in
  x86_64|amd64) FNM_ARCH=linux ;;
  aarch64|arm64) FNM_ARCH=linux-arm64 ;;
  *) echo "Unsupported arch: $ARCH"; exit 1 ;;
esac

BIN="$DEST/runtime/fnm/fnm"
mkdir -p "$DEST/runtime/fnm" "$DEST/runtime/fnm-root"
if [ -x "$BIN" ]; then
  echo "fnm $($BIN --version) already in $DEST/runtime/fnm"
else
  TMP="$(mktemp -d)"
  trap 'rm -rf "$TMP"' EXIT
  curl -fsSL "https://github.com/Schniz/fnm/releases/latest/download/fnm-${FNM_ARCH}.zip" -o "$TMP/fnm.zip"
  unzip -o "$TMP/fnm.zip" -d "$TMP"
  chmod +x "$TMP/fnm"
  cp "$TMP/fnm" "$BIN"
fi

export FNM_DIR="$DEST/runtime/fnm-root"
"$BIN" install 22 --fnm-dir "$FNM_DIR"
"$BIN" default 22 --fnm-dir "$FNM_DIR" || true
echo "fnm $($BIN --version) · Node $($BIN current --fnm-dir "$FNM_DIR" 2>/dev/null || echo 22)"
