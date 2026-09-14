#!/usr/bin/env bash
# Point OS V01D at an Unreal Editor binary. Does not clone Epic.
set +e
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ED="${1:-}"
PREFIX="${HECTOR_PREFIX:-$HOME/.local/share/hector-build}"
mkdir -p "$PREFIX/runtime" /v01d/programs 2>/dev/null || mkdir -p "$PREFIX/runtime"
if [ -z "$ED" ]; then
  for p in \
    "${UE58:-}" \
    "/opt/unreal/Engine/Binaries/Linux/UnrealEditor" \
    "$HOME/UE_5.8/Engine/Binaries/Linux/UnrealEditor" \
    "$HOME/UnrealEngine/Engine/Binaries/Linux/UnrealEditor"
  do
    [ -n "${p:-}" ] && [ -x "$p" ] && ED="$p" && break
  done
fi
if [ -z "$ED" ] || [ ! -x "$ED" ]; then
  echo "unreal-missing"
  exit 0
fi
ln -sfn "$ED" "$PREFIX/runtime/UnrealEditor" 2>/dev/null || true
if [ -d /v01d/programs ]; then
  ln -sfn "$ED" /v01d/programs/UnrealEditor 2>/dev/null || true
fi
echo "$ED"
exit 0
