#!/usr/bin/env bash
# First thing on USB or netboot. Census. LVFS. Origin seat. DeltaKingZero.
# We never write LBA 0. We never curl a BIOS from a website.
set -euo pipefail
ORIGIN="${V01D_ORIGIN:-/v01d/origin}"
mkdir -p "$ORIGIN"
{
  echo "vendor=$(cat /sys/class/dmi/id/bios_vendor 2>/dev/null || echo unknown)"
  echo "board=$(cat /sys/class/dmi/id/board_name 2>/dev/null || echo unknown)"
  echo "bios=$(cat /sys/class/dmi/id/bios_version 2>/dev/null || echo unknown)"
  echo "date=$(cat /sys/class/dmi/id/bios_date 2>/dev/null || echo unknown)"
  echo "efi=$([ -d /sys/firmware/efi ] && echo 1 || echo 0)"
  echo "ac=$(cat /sys/class/power_supply/AC*/online 2>/dev/null | head -1 || echo 1)"
} > "$ORIGIN/census"
command -v dmidecode >/dev/null && dmidecode -t bios > "$ORIGIN/dmi-bios.txt" 2>/dev/null || true
if command -v fwupdmgr >/dev/null; then
  fwupdmgr refresh --force >/dev/null 2>&1 || true
  fwupdmgr get-devices --json > "$ORIGIN/devices.json" 2>/dev/null || true
  fwupdmgr get-updates --json > "$ORIGIN/updates.json" 2>/dev/null || echo '{"Devices":[]}' > "$ORIGIN/updates.json"
  EFI=$([ -d /sys/firmware/efi ] && echo 1 || echo 0)
  AC=$(cat /sys/class/power_supply/AC*/online 2>/dev/null | head -1 || echo 1)
  if [[ "$EFI" == "1" && "$AC" == "1" && "${V01D_FLASH_FIRMWARE:-0}" == "1" ]]; then
    fwupdmgr update --no-reboot-check --assume-yes || echo "capsule deferred" > "$ORIGIN/flash-note"
  fi
else
  echo "fwupd missing" > "$ORIGIN/flash-note"
fi
echo "0,0,0 $ORIGIN" > "$ORIGIN/seat"
echo "firmware census at $ORIGIN"
