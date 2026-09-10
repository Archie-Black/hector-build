#!/usr/bin/env bash
# User-level Linux settings. No root.
set -euo pipefail
PREFIX="${XDG_DATA_HOME:-$HOME/.local/share}"
CONFIG="${XDG_CONFIG_HOME:-$HOME/.config}/hector-build"
BIN="${XDG_BIN_HOME:-$HOME/.local/bin}"
APP="$PREFIX/applications"
mkdir -p "$CONFIG" "$BIN" "$APP" "$PREFIX/hector-build"
cat > "$CONFIG/host.json" <<EOF
{
  "os": "linux",
  "verbose": false,
  "ghosts": true,
  "notifications": true,
  "autoStart": true,
  "api": "/api/v1",
  "model": "hector-hx"
}
EOF
if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database "$APP" 2>/dev/null || true
fi
echo "Linux settings written to $CONFIG/host.json"
echo "API: local /api/v1  model hector-hx"
echo "Commands: hector-build   spectral-hx"
