#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJ="$ROOT/Godot/project.godot"
find_godot() {
  for p in \
    "${GODOT47:-}" \
    "$HOME/.local/share/hector-build/runtime/godot/Godot" \
    "$HOME/Godot_v4.7-stable_linux.x86_64" \
    "/opt/godot/Godot" \
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
exec "$ED" --editor --path "$ROOT/Godot" "$@"
