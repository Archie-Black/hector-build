#!/usr/bin/env bash
# Sit Hector at 0,0,0. 16 MiB GPT partition AFTER the ESP. Not LBA 0.
set -euo pipefail
DISK="${1:?disk e.g. /dev/nvme0n1}"
ORIGIN="${V01D_ORIGIN:-/v01d/origin}"
if ! command -v sgdisk >/dev/null; then
  mkdir -p "$ORIGIN"
  echo "no sgdisk; origin is a folder on the live image" > "$ORIGIN/seat"
  exit 0
fi
sgdisk -n 0:0:+16M -c 0:HECTOR -t 0:8300 "$DISK" || true
PART="$(lsblk -lnpo NAME,PARTLABEL "$DISK" | awk '/HECTOR/{print $1; exit}')"
if [[ -n "${PART:-}" ]]; then
  mkfs.ext4 -L HECTOR -F "$PART"
  mkdir -p "$ORIGIN"
  mount "$PART" "$ORIGIN"
fi
mkdir -p "$ORIGIN"
echo "0,0,0 $ORIGIN" > "$ORIGIN/seat"
