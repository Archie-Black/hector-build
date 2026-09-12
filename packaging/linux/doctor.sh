#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ok=0
need() {
  if [ -e "$1" ]; then echo "ok  $1"; else echo "MISSING  $1"; ok=1; fi
}
need "$ROOT/packaging/linux/install.sh"
need "$ROOT/packaging/linux/install-node22.sh"
need "$ROOT/packaging/linux/serve-and-open.mjs"
need "$ROOT/native/horizon/Makefile"
need "$ROOT/native/horizon/Godot/project.godot"
need "$ROOT/native/horizon/UE/SpectralHorizon/SpectralHorizon.uproject"
need "$ROOT/native/v01d/wayland/hyprland.conf"
need "$ROOT/native/v01d/wayland/session.sh"
need "$ROOT/public/horsemen/portal/hell.jpg"
need "$ROOT/public/horsemen/field.jpg"
need "$ROOT/src/components/horsemen/desk.tsx"
command -v node >/dev/null && echo "ok  node $(node -v)" || echo "MISSING  node"
exit $ok
