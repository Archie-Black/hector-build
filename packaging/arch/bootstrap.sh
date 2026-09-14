#!/usr/bin/env bash
# Archiso / pacstrap. Documented install: bootstrap.sh /mnt
# Firmware first. Dual-core. packaging/linux is the install foundation.
set -euo pipefail
ROOT="${1:?usage: bootstrap.sh /mnt}"
DISK="${2:-}"
FLAVOR="${V01D_FLAVOR:-work}"
HERE="$(cd "$(dirname "$0")" && pwd)"
TREE="$(cd "$HERE/../.." && pwd)"
SHARE="$ROOT/usr/share/osv01d"

echo "OS V01D bootstrap → $ROOT"

# 1. Firmware census / LVFS before the desk.
if [[ -x "$HERE/firmware-first.sh" ]]; then
  V01D_ORIGIN="${V01D_ORIGIN:-$ROOT/v01d/origin}" bash "$HERE/firmware-first.sh" || true
fi
if [[ -n "$DISK" && -x "$HERE/origin-place.sh" ]]; then
  V01D_ORIGIN="${V01D_ORIGIN:-$ROOT/v01d/origin}" bash "$HERE/origin-place.sh" "$DISK" || true
fi

# 2. Packages. pacstrap when we are the installer; chroot pacman when /mnt is already a root.
if command -v pacstrap >/dev/null && [[ ! -d "$ROOT/etc" || "${V01D_PACSTRAP:-1}" == "1" ]]; then
  pacstrap -K "$ROOT" - < "$HERE/packages.x86_64"
fi

# 3. Copy this tree. packaging/linux stays the install foundation.
install -d "$SHARE" "$ROOT/v01d/programs" "$ROOT/v01d/home/Downloads" "$ROOT/usr/local/bin"
if command -v rsync >/dev/null; then
  rsync -a --delete \
    --exclude node_modules --exclude .git --exclude artifacts --exclude dist --exclude vendor \
    "$TREE"/ "$SHARE"/
else
  cp -a "$TREE"/. "$SHARE"/
fi

# 4. Inside the new root: linux install, dual-core, programs, flavor, ghostwalk, downloads.
arch-chroot "$ROOT" bash -lc "
  set -e
  export HECTOR_PREFIX=/usr/share/osv01d
  chmod +x /usr/share/osv01d/packaging/linux/*.sh /usr/share/osv01d/packaging/arch/*.sh /usr/share/osv01d/packaging/cloud/*.sh || true
  bash /usr/share/osv01d/packaging/linux/install.sh || true
  bash /usr/share/osv01d/packaging/arch/dual-core/install.sh || true
  bash /usr/share/osv01d/packaging/arch/programs/install.sh || true
  bash /usr/share/osv01d/packaging/linux/install-flavor.sh '$FLAVOR' || true
  bash /usr/share/osv01d/packaging/arch/install-godot.sh || true
  bash /usr/share/osv01d/packaging/arch/install-ue.sh || true
  bash /usr/share/osv01d/packaging/linux/install-vscodium.sh || true
  bash /usr/share/osv01d/native/horizon/scripts/install-stack.sh || true
  bash /usr/share/osv01d/native/horizon/scripts/warm-aesthetics.sh || true
  bash /usr/share/osv01d/packaging/linux/ghostwalk-default.sh || true
  bash /usr/share/osv01d/packaging/linux/fetch-images.sh || true
  bash /usr/share/osv01d/packaging/arch/tts/install_predictive_tts.sh || true
  ln -sfn /usr/share/osv01d/packaging/linux/osv01d.sh /usr/local/bin/osv01d
  ln -sfn /usr/share/osv01d/packaging/linux/hector-open /usr/local/bin/hector-open
  ln -sfn /usr/share/osv01d/native/horizon/scripts/warm-aesthetics.sh /usr/local/bin/osv01d-aesthetics
  systemctl enable NetworkManager || true
  systemctl enable osv01d-cores.service || true
  systemctl enable osv01d-firmware.timer || true
  systemctl enable osv01d-firmware.service || true
  systemctl enable osv01d-update.timer || true
  echo 'OS V01D chroot done'
" || true

echo "OS V01D game stack scheduled on $ROOT"
echo "Next: genfstab -U $ROOT >> $ROOT/etc/fstab && arch-chroot $ROOT"
echo "USB: bash $HERE/mkiso.sh"
