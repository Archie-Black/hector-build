#!/usr/bin/env bash
# Arena + infantry bases. Original Horizon on top. Never CoD. Never cash.
# Skip anything with hate in the name.
set +e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/fps"
mkdir -p "$SRC"
clone() {
  local url="$1" dest="$2"
  [ -d "$dest/.git" ] && git -C "$dest" pull --ff-only && return
  git clone --depth 1 "$url" "$dest"
}
# Movement and lighting: Xonotic / DarkPlaces
clone https://gitlab.com/xonotic/xonotic.git "$SRC/xonotic"
# In-world edit: Cube 2
clone https://github.com/sauerbraten/sauerbraten.git "$SRC/sauerbraten"
# Asymmetrical: Unvanquished
clone https://github.com/Unvanquished/Unvanquished.git "$SRC/unvanquished"
# Hitscan infantry close to modern twitch — AssaultCube, not a clone of a brand
clone https://github.com/assaultcube/AC.git "$SRC/assaultcube"
# Retro campaigns: GZDoom
clone https://github.com/ZDoom/gzdoom.git "$SRC/gzdoom"
echo "Moon BR lives in Spectral Horizon. These engines are the metal under it."
exit 0
