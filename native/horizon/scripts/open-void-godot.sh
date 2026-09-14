#!/usr/bin/env bash
# Desk aesthetics: Godot void project. Same nebula as the WebGL field.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJ="$ROOT/Godot/void"
find_godot() {
  for p in \
    "${GODOT47:-}" \
    "/opt/godot/Godot" \
    "$HOME/.local/share/hector-build/runtime/godot/Godot" \
    "$(command -v godot || true)"
  do
    [ -n "${p:-}" ] && [ -x "$p" ] && { echo "$p"; return; }
  done
  return 1
}
ED="$(find_godot || true)"
if [ -z "$ED" ]; then
  echo "godot-missing"
  exit 2
fi
exec "$ED" --path "$PROJ" --editor "$@"
