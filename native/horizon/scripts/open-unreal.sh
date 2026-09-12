#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJ="$ROOT/UE/SpectralHorizon/SpectralHorizon.uproject"
find_editor() {
  for p in \
    "${UE58:-}" \
    "$HOME/UnrealEngine/Engine/Binaries/Linux/UnrealEditor" \
    "$HOME/UE_5.8/Engine/Binaries/Linux/UnrealEditor" \
    "/opt/unreal/Engine/Binaries/Linux/UnrealEditor" \
    "/usr/local/unreal/Engine/Binaries/Linux/UnrealEditor"
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
