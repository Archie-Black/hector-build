#!/usr/bin/env bash
# Forge — Ardour rack + realtime audio + Hector seal. Arch. Not apt. DeltaKingZero.
set -euo pipefail
ROOT="${1:-$HOME/v01d/studio}"
mkdir -p "$ROOT/bounces" "$ROOT/vault"
if command -v pacman >/dev/null 2>&1; then
  sudo pacman -S --needed --noconfirm ardour jack2 ffmpeg pipewire pipewire-jack || true
fi
if [[ -f /etc/security/limits.d/99-v01d-audio.conf ]] || [[ -w /etc/security/limits.d ]]; then
  sudo install -m 644 "$(cd "$(dirname "$0")" && pwd)/realtime.conf" /etc/security/limits.d/99-v01d-audio.conf || true
fi
if getent group audio >/dev/null 2>&1; then
  sudo usermod -aG audio "${SUDO_USER:-$USER}" || true
fi
echo "Forge bounces: $ROOT/bounces"
echo "Forge vault:   $ROOT/vault"
echo "Aether: PipeWire clock 48k / 256. Watch: node packaging/forge/watch.mjs"
if [[ -d /etc/pipewire ]]; then
  sudo install -m 644 "$(cd "$(dirname "$0")" && pwd)/pipewire-aether.conf" /etc/pipewire/pipewire.conf.d/99-v01d-aether.conf 2>/dev/null || true
fi
