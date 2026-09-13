#!/usr/bin/env bash
# Weekly BIOS care. LVFS only. AC + EFI. This chassis is home.
set -euo pipefail
export V01D_ORIGIN="${V01D_ORIGIN:-/v01d/origin}"
HERE="$(cd "$(dirname "$0")" && pwd)"
bash "$HERE/firmware-first.sh"
EFI=$([ -d /sys/firmware/efi ] && echo 1 || echo 0)
AC=$(cat /sys/class/power_supply/AC*/online 2>/dev/null | head -1 || echo 1)
if [[ "$EFI" == "1" && "$AC" == "1" ]] && command -v fwupdmgr >/dev/null; then
  if fwupdmgr get-updates >/dev/null 2>&1; then
    fwupdmgr update --no-reboot-check --assume-yes || true
  fi
fi
echo "firmware keep $(date -Iseconds)" >> "$V01D_ORIGIN/keep.log"
