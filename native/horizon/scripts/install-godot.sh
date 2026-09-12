#!/usr/bin/env bash
# Godot 4.7-stable. Official. Linux x86_64.
set -euo pipefail
DIR="${HECTOR_GODOT:-$HOME/.local/share/hector-build/runtime/godot}"
mkdir -p "$DIR"
URL="https://github.com/godotengine/godot/releases/download/4.7-stable/Godot_v4.7-stable_linux.x86_64.zip"
ZIP="$DIR/godot.zip"
if [ ! -x "$DIR/Godot" ]; then
  curl -fsSL "$URL" -o "$ZIP"
  unzip -o "$ZIP" -d "$DIR"
  mv "$DIR"/Godot_v4.7-stable_linux.x86_64 "$DIR/Godot" 2>/dev/null || true
  chmod +x "$DIR"/Godot* || true
fi
echo "$DIR"
