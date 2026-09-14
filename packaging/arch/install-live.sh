#!/usr/bin/env bash
# Live ISO / netboot. No loader menu. Hector asks. Then bootstrap.sh /mnt.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
TREE="$(cd "$HERE/../.." && pwd)"
export HECTOR_PREFIX="${HECTOR_PREFIX:-$TREE}"

say() { printf '%s\n' "$*"; }

say "OS V01D. Firmware first."
bash "$HERE/firmware-first.sh" || true

FLAVOR="${V01D_FLAVOR:-}"
if [[ -z "$FLAVOR" ]]; then
  say "Games and Entertainment, or Standard Desktop Productivity?"
  say "Type play or work."
  read -r FLAVOR || true
fi
case "${FLAVOR,,}" in
  play|games|entertainment) FLAVOR=play ;;
  *) FLAVOR=work ;;
esac
export V01D_FLAVOR="$FLAVOR"

if [[ -z "${V01D_WINDOWS:-}" ]]; then
  say "Are you used to Windows? yes or no."
  read -r V01D_WINDOWS || true
fi
export V01D_WINDOWS="${V01D_WINDOWS:-no}"

if [[ -z "${V01D_TEACH:-}" ]]; then
  say "Teach me as you work, or just do the job? teach or job."
  read -r V01D_TEACH || true
fi
case "${V01D_TEACH,,}" in
  teach|yes) V01D_TEACH=yes ;;
  *) V01D_TEACH=no ;;
esac
export V01D_TEACH

if [[ -z "${V01D_WIFI:-}" ]]; then
  say "Wifi password. Leave blank if you are already on a cable. 2FA from a joined phone also works."
  read -rs V01D_WIFI || true
  echo
fi
if [[ -n "${V01D_WIFI:-}" && -n "${V01D_SSID:-}" ]] && command -v nmcli >/dev/null; then
  nmcli device wifi connect "$V01D_SSID" password "$V01D_WIFI" || true
fi

DISK="${V01D_DISK:-}"
if [[ -z "$DISK" ]]; then
  say "Disk to install on (example /dev/nvme0n1). Empty skips the write."
  read -r DISK || true
fi

TARGET="${V01D_TARGET:-/mnt}"
mkdir -p "$TARGET"

if [[ -n "$DISK" && -b "$DISK" ]]; then
  say "Installing OS V01D onto $DISK"
  bash "$HERE/origin-place.sh" "$DISK" || true
  bash "$HERE/bootstrap.sh" "$TARGET" "$DISK"
else
  say "No disk. Keeping the live session. packaging/linux still installs the desk here."
  bash "$TREE/packaging/linux/install.sh" || true
  bash "$TREE/packaging/linux/install-flavor.sh" "$FLAVOR" || true
fi

say "Intro plays on first desk. Music ducks for Hector. Welcome to OS VOID."
say "Talk to Hector. System is bottom-right. Trash sits above it."
