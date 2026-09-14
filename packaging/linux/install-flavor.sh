#!/usr/bin/env bash
# play = games + multimedia. work = office + school + art + music. Games in the menu.
set -euo pipefail
FLAVOR="${1:-work}"
if command -v pacman >/dev/null 2>&1; then
  sudo pacman -S --needed --noconfirm \
    gimp darktable inkscape krita blender kdenlive audacity ardour obs-studio vlc ffmpeg \
    wine-staging winetricks tor helix || true
  if [[ "$FLAVOR" == "play" ]]; then
    sudo pacman -S --needed --noconfirm xonotic sauerbraten gzdoom godot || true
  else
    sudo pacman -S --needed --noconfirm libreoffice-fresh || true
  fi
fi
echo "OS V01D flavor $FLAVOR"
