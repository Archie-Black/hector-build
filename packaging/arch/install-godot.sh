#!/usr/bin/env bash
# Godot 4.7 for OS V01D aesthetics. Pacman first, then the official zip.
set +e
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
if command -v pacman >/dev/null && [ "$(id -u)" -eq 0 ]; then
  pacman -S --needed --noconfirm godot || true
fi
bash "$ROOT/native/horizon/scripts/install-godot.sh"
exit 0
