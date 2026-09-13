#!/usr/bin/env bash
# Hector runs this. People do not.
set -euo pipefail
INNER="${1:-}"
if [ -z "$INNER" ]; then
  echo "nothing to run"
  exit 0
fi
if command -v wsl.exe >/dev/null 2>&1; then
  exec wsl.exe -d OSV01D -- bash -lc "$INNER"
fi
if [ -n "${WSL_DISTRO_NAME:-}" ] || grep -qi microsoft /proc/version 2>/dev/null; then
  exec bash -lc "$INNER"
fi
echo "Linux room is not on this machine yet."
exit 2
