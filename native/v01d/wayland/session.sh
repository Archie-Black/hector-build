#!/usr/bin/env bash
set -euo pipefail
export XDG_CURRENT_DESKTOP=OSV01D
export XDG_SESSION_TYPE=wayland
CONF="${V01D_HYPR:-$(cd "$(dirname "$0")" && pwd)/hyprland.conf}"
if command -v Hyprland >/dev/null; then
  exec Hyprland -c "$CONF"
fi
echo "Hyprland is not on this machine. Install the Arch session from packaging/arch/packages.x86_64"
exec "${HECTOR_PREFIX:-$HOME/.local/share/hector-build}/packaging/linux/osv01d.sh"
