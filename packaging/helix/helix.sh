#!/bin/sh
# Helix. Standalone. Works on machines that never installed OS V01D or Hector.
set -e
HERE="$(CDPATH= cd -- "$(dirname "$0")" && pwd)"
BIN="${1:-}"
if [ -z "$BIN" ]; then
  echo "helix: give me a program or its source."
  exit 2
fi
shift
if [ -f "$HERE/helix-run.sh" ]; then
  exec sh "$HERE/helix-run.sh" "$@"
fi
if command -v wine >/dev/null 2>&1 && file "$BIN" 2>/dev/null | grep -qi PE32; then
  exec wine "$BIN" "$@"
fi
if command -v wsl >/dev/null 2>&1 && file "$BIN" 2>/dev/null | grep -qi ELF; then
  exec wsl -e "$BIN" "$@"
fi
exec "$BIN" "$@"
