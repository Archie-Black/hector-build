#!/usr/bin/env bash
# Genesis HX Suite. Arch. Local. DeltaKingZero.
set -euo pipefail
ROOT="${V01D_SUITE:-$HOME/v01d/suite}"
HERE="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$ROOT/stage" "$ROOT/vector" "$ROOT/broker" "$ROOT/engine"
install -m 644 "$HERE/mosquitto.conf" "$ROOT/broker/mosquitto.conf"
if command -v pacman >/dev/null 2>&1; then
  sudo pacman -S --needed --noconfirm gimp darktable inkscape krita blender kdenlive audacity ardour obs-studio ffmpeg python python-pip || true
fi
if command -v docker >/dev/null 2>&1; then
  V01D_SUITE="$ROOT" docker compose -f "$HERE/docker-compose.yml" up -d || true
fi
if [[ ! -d "$ROOT/engine/ComfyUI" ]] && command -v git >/dev/null 2>&1; then
  git clone --depth 1 https://github.com/comfyanonymous/ComfyUI.git "$ROOT/engine/ComfyUI" || true
fi
bash "$HERE/fetch-weights.sh" || true
