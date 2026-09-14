#!/usr/bin/env bash
# OS V01D game stack. Runs during OS install. Pacman first, then Godot addons.
set -u
PREFIX="${HECTOR_PREFIX:-${1:-$HOME/.local/share/hector-build}}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
[ -d "$PREFIX/native" ] && ROOT="$PREFIX"

pkgs=(
  git curl cmake ninja clang
  vulkan-icd-loader vulkan-devel
  blender godot
  openxr libopenxr
  python python-pip
  xonotic sauerbraten gzdoom
)

if command -v pacman >/dev/null && [ "$(id -u)" -eq 0 ]; then
  echo "OS V01D: installing game stack with pacman"
  pacman -Sy --needed --noconfirm "${pkgs[@]}" || echo "pacman game stack: some packages skipped"
elif command -v pacman >/dev/null; then
  echo "OS V01D: run as root to pacman blender godot openxr. Cloning addons as user."
fi

bash "$ROOT/native/horizon/scripts/install-stack.sh" || echo "addon clone skipped"
bash "$ROOT/packaging/arch/install-godot.sh" || true
bash "$ROOT/packaging/arch/install-ue.sh" || true
bash "$ROOT/native/horizon/scripts/install-pds.sh" || true
make -C "$ROOT/native/horizon" || true
echo "OS V01D game stack done."
