#!/usr/bin/env bash
# play = games + multimedia. work = office + school + art + music. Games in the menu.
set -euo pipefail
FLAVOR="${1:-work}"
if command -v pacman >/dev/null 2>&1; then
  sudo pacman -S --needed --noconfirm krita ardour ffmpeg audacity || true
  if [[ "$FLAVOR" == "play" ]]; then
    sudo pacman -S --needed --noconfirm obs-studio kdenlive xonotic sauerbraten gzdoom || true
  else
    sudo pacman -S --needed --noconfirm libreoffice-fresh kdenlive || true
  fi
fi
echo "OS V01D flavor $FLAVOR"
