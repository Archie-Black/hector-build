#!/usr/bin/env bash
# Godot 4.7-stable. Official. Linux x86_64. Pacman godot is the fallback.
set -euo pipefail
DIR="${HECTOR_GODOT:-$HOME/.local/share/hector-build/runtime/godot}"
if [ "$(id -u)" -eq 0 ]; then
  DIR="${HECTOR_GODOT:-/opt/godot}"
fi
mkdir -p "$DIR"
URL="https://github.com/godotengine/godot/releases/download/4.7-stable/Godot_v4.7-stable_linux.x86_64.zip"
MIRROR="${V01D_DOWNLOADS:-https://www.doomchat.ca/downloads}/Godot_v4.7-stable_linux.x86_64.zip"
ZIP="$DIR/godot.zip"
if [ ! -x "$DIR/Godot" ]; then
  curl -fsSL "$MIRROR" -o "$ZIP" || curl -fsSL "$URL" -o "$ZIP" || true
  if [ -f "$ZIP" ]; then
    unzip -o "$ZIP" -d "$DIR"
    mv "$DIR"/Godot_v4.7-stable_linux.x86_64 "$DIR/Godot" 2>/dev/null || true
    chmod +x "$DIR"/Godot* || true
  fi
fi
if [ -x "$DIR/Godot" ]; then
  mkdir -p "$HOME/.local/bin"
  ln -sfn "$DIR/Godot" "$HOME/.local/bin/godot" 2>/dev/null || true
  ln -sfn "$DIR/Godot" /usr/local/bin/godot 2>/dev/null || true
  if [ -d /v01d/programs ]; then
    ln -sfn "$DIR/Godot" /v01d/programs/Godot 2>/dev/null || true
  fi
fi
echo "$DIR"
