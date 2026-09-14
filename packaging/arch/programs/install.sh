#!/usr/bin/env bash
# Every installed program gets a real name in /v01d/programs.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
DEST="${V01D_PROGRAMS:-/v01d/programs}"
install -d "$DEST"

wrap() {
  local name="$1" target="$2"
  local out="$DEST/$name"
  if [[ -e "$target" ]]; then
    ln -sfn "$target" "$out"
    return
  fi
  printf '#!/bin/sh\nexec %s "$@"\n' "$target" > "$out"
  chmod +x "$out"
}

desk() {
  local name="$1" app="$2"
  printf '#!/bin/sh\n# v01d://app/%s\nexec hector-open %s "$@"\n' "$app" "$app" > "$DEST/$name"
  chmod +x "$DEST/$name"
}

wrap "GIMP" "$(command -v gimp || echo /usr/bin/gimp)"
wrap "Darktable" "$(command -v darktable || echo /usr/bin/darktable)"
wrap "Inkscape" "$(command -v inkscape || echo /usr/bin/inkscape)"
wrap "Penpot" "/opt/osv01d/suite/penpot.sh"
wrap "Krita" "$(command -v krita || echo /usr/bin/krita)"
wrap "Blender" "$(command -v blender || echo /usr/bin/blender)"
wrap "Kdenlive" "$(command -v kdenlive || echo /usr/bin/kdenlive)"
wrap "Audacity" "$(command -v audacity || echo /usr/bin/audacity)"
wrap "Ardour" "$(command -v ardour || echo /usr/bin/ardour)"
wrap "Cardinal" "$(command -v cardinal || echo /usr/bin/cardinal)"
wrap "Surge XT" "$(command -v surge-xt || echo /usr/bin/surge-xt)"
wrap "Vital" "$(command -v vital || echo /usr/bin/vital)"
wrap "OBS" "$(command -v obs || command -v obs-studio || echo /usr/bin/obs)"
wrap "ComfyUI" "/opt/osv01d/suite/engine/ComfyUI/main.py"
wrap "vlc" "$(command -v vlc || echo /usr/bin/vlc)"
wrap "notepad.exe" "$(command -v notepad || echo /usr/bin/wine)"
wrap "MetaHuman" "/opt/unreal/Engine/Binaries/Linux/UnrealEditor"
wrap "Godot" "$(command -v godot || echo /opt/godot/Godot)"
wrap "Unreal Editor" "/opt/unreal/Engine/Binaries/Linux/UnrealEditor"
wrap "VSCodium" "$(command -v codium || echo /opt/vscodium/bin/codium)"
wrap "PBX Console" "$ROOT/packaging/hx/hx-exec.sh"

desk "GhostWalk" ghostwalk
desk "GhostIT" notes
desk "Spectral HX" code
desk "Genesis HX Suite" suite
desk "Portal 00:13" portal
desk "Linux room" room
desk "Crapple" crapple
desk "Asimov 01" asimov

echo "programs: $DEST"
ls -1 "$DEST"
