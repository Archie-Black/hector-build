#!/usr/bin/env bash
# Archiso / pacstrap. Feed this the new root.
set -euo pipefail
ROOT="${1:?usage: bootstrap.sh /mnt}"
HERE="$(cd "$(dirname "$0")" && pwd)"
pacstrap -K "$ROOT" - < "$HERE/packages.x86_64"
arch-chroot "$ROOT" bash -c 'HECTOR_PREFIX=/usr/share/osv01d bash /usr/share/osv01d/packaging/linux/install-os-games.sh' || true
echo "OS V01D game stack scheduled on $ROOT"
