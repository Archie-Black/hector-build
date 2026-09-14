#!/usr/bin/env bash
# Desk aesthetics: UE VoidDesktop. Same uniforms as Godot nebula + WebGL.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJ="$ROOT/UE/VoidDesktop/VoidDesktop.uproject"
find_editor() {
  for p in \
    "${UE58:-}" \
    "/opt/unreal/Engine/Binaries/Linux/UnrealEditor" \
    "$HOME/UE_5.8/Engine/Binaries/Linux/UnrealEditor" \
    "$HOME/UnrealEngine/Engine/Binaries/Linux/UnrealEditor"
  do
    [ -n "${p:-}" ] && [ -x "$p" ] && { echo "$p"; return; }
  done
  return 1
}
ED="$(find_editor || true)"
if [ -z "$ED" ]; then
  echo "unreal-missing"
  exit 2
fi
exec "$ED" "$PROJ" "$@"
