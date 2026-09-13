#!/usr/bin/env bash
# Called from OS install. Never fail the OS if a clone is down.
set +e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ADD="$ROOT/Godot/addons"
mkdir -p "$ADD"
clone() {
  local url="$1" dest="$2"
  if [ -d "$dest/.git" ]; then
    git -C "$dest" pull --ff-only
    return
  fi
  git clone --depth 1 "$url" "$dest"
}
clone https://github.com/godot-jolt/godot-jolt.git "$ADD/godot-jolt"
clone https://github.com/Zylann/godot_voxel.git "$ADD/voxel"
echo "Blender + OpenXR + Chaos: packaging/linux/install-os-games.sh"
exit 0
