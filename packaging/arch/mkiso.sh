#!/usr/bin/env bash
# Build a bootable OS V01D ISO. No loader menu. Needs archiso (mkarchiso).
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
TREE="$(cd "$HERE/../.." && pwd)"
PROFILE="$HERE/archiso"
WORK="${V01D_ISO_WORK:-/tmp/osv01d-work}"
OUT="${V01D_ISO_OUT:-$TREE/artifacts}"

chmod +x "$HERE"/*.sh "$HERE/archiso"/profiledef.sh 2>/dev/null || true
install -d "$PROFILE/airootfs/usr/share/osv01d" \
  "$PROFILE/airootfs/usr/local/bin" \
  "$PROFILE/airootfs/etc/systemd/system" \
  "$PROFILE/airootfs/root" \
  "$PROFILE/syslinux" \
  "$PROFILE/efiboot/loader/entries" \
  "$PROFILE/grub"

rsync -a --delete \
  --exclude node_modules --exclude .git --exclude artifacts --exclude dist --exclude vendor \
  "$TREE"/ "$PROFILE/airootfs/usr/share/osv01d"/

cp "$HERE/boot/syslinux.cfg" "$PROFILE/syslinux/syslinux.cfg"
cp "$HERE/boot/grub.cfg" "$PROFILE/grub/grub.cfg"
cp "$HERE/osv01d-install.service" "$PROFILE/airootfs/etc/systemd/system/osv01d-install.service"
cp "$HERE/osv01d-firmware.service" "$PROFILE/airootfs/etc/systemd/system/osv01d-firmware.service"
ln -sfn /usr/share/osv01d/packaging/linux/osv01d.sh "$PROFILE/airootfs/usr/local/bin/osv01d"
ln -sfn /usr/share/osv01d/packaging/arch/install-live.sh "$PROFILE/airootfs/root/install-live.sh"
printf 'OSV01D\n' > "$PROFILE/airootfs/etc/hostname"
printf 'LANG=en_US.UTF-8\n' > "$PROFILE/airootfs/etc/locale.conf"

if ! command -v mkarchiso >/dev/null; then
  echo "mkarchiso is not on this machine. Profile is ready at $PROFILE"
  echo "On Arch: pacman -S archiso && mkarchiso -v -w $WORK -o $OUT $PROFILE"
  exit 0
fi

mkdir -p "$OUT" "$WORK"
mkarchiso -v -w "$WORK" -o "$OUT" "$PROFILE"
echo "ISO in $OUT"
