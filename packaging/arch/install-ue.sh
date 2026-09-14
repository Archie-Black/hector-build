#!/usr/bin/env bash
# Unreal Editor 5.8 for OS V01D aesthetics + Portal. Never fail the OS.
# Official Epic tree, doomchat prebuild, or Punisher mirror.
set +e
set -u
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PREFIX="${HECTOR_PREFIX:-$ROOT}"
DEST="${UE_PREFIX:-/opt/unreal}"
if [ "$(id -u)" -ne 0 ]; then
  DEST="${UE_PREFIX:-$HOME/UE_5.8}"
fi
BIN="$DEST/Engine/Binaries/Linux/UnrealEditor"
MIRROR="${V01D_DOWNLOADS:-https://www.doomchat.ca/downloads}"
PUNISHER_LIN="${PUNISHER_UE:-/mnt/c/Users/Dark0/Downloads/OSV01D/hector-build/UnrealEditor-Linux.tar.xz}"

have_editor() {
  for p in \
    "${UE58:-}" \
    "$BIN" \
    "$HOME/UnrealEngine/Engine/Binaries/Linux/UnrealEditor" \
    "$HOME/UE_5.8/Engine/Binaries/Linux/UnrealEditor" \
    "/opt/unreal/Engine/Binaries/Linux/UnrealEditor" \
    "/usr/local/unreal/Engine/Binaries/Linux/UnrealEditor"
  do
    [ -n "${p:-}" ] && [ -x "$p" ] && { echo "$p"; return 0; }
  done
  return 1
}

if ED="$(have_editor)"; then
  echo "unreal: $ED"
  bash "$ROOT/native/horizon/scripts/install-unreal.sh" "$ED" || true
  exit 0
fi

mkdir -p "$DEST" "$(dirname "$BIN")"
TAR=""
if [ -f "$PUNISHER_LIN" ]; then
  TAR="$PUNISHER_LIN"
elif curl -fsI "$MIRROR/UnrealEditor-Linux.tar.xz" >/dev/null 2>&1; then
  TAR="$PREFIX/runtime/UnrealEditor-Linux.tar.xz"
  mkdir -p "$PREFIX/runtime"
  curl -fL --retry 3 -o "$TAR" "$MIRROR/UnrealEditor-Linux.tar.xz" || TAR=""
fi

if [ -n "$TAR" ] && [ -f "$TAR" ]; then
  tar -xJf "$TAR" -C "$DEST" --strip-components=1 2>/dev/null || tar -xJf "$TAR" -C "$DEST"
fi

if ED="$(have_editor)"; then
  echo "unreal: $ED"
  bash "$ROOT/native/horizon/scripts/install-unreal.sh" "$ED" || true
  exit 0
fi

echo "wait unreal (Epic source or $MIRROR/UnrealEditor-Linux.tar.xz — packaging/arch/install-ue.sh)"
echo "desk project: $ROOT/native/horizon/UE/VoidDesktop/VoidDesktop.uproject"
echo "games project: $ROOT/native/horizon/UE/SpectralHorizon/SpectralHorizon.uproject"
exit 0
