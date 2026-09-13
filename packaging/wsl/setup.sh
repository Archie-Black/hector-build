#!/usr/bin/env bash
# Full Arch inside WSL. Always. Not optional. Not a demo.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
echo "OS V01D: Arch WSL setup (distro OSV01D)"

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root inside the distro once: sudo bash packaging/wsl/setup.sh"
  exit 2
fi

install -D -m 0644 "$ROOT/packaging/wsl/wsl.conf" /etc/wsl.conf
mkdir -p /etc/osv01d /home/v01d

if command -v pacman >/dev/null 2>&1; then
  pacman-key --init || true
  pacman-key --populate archlinux || true
  pacman -Sy --noconfirm archlinux-keyring || true
  mapfile -t PKGS < "$ROOT/packaging/wsl/packages.x86_64"
  pacman -Syu --noconfirm --needed "${PKGS[@]}" || pacman -Syu --noconfirm --needed base base-devel sudo git curl wine samba openssh
fi

id v01d >/dev/null 2>&1 || useradd -m -G wheel -s /bin/bash v01d
echo '%wheel ALL=(ALL:ALL) NOPASSWD: /usr/bin/pacman,/usr/bin/systemctl' > /etc/sudoers.d/v01d-os
chmod 440 /etc/sudoers.d/v01d-os

install -d -o v01d -g v01d /home/v01d
ln -sfn /mnt/c /home/v01d/This\ PC 2>/dev/null || true
ln -sfn /mnt/c/Users /home/v01d/Windows\ Users 2>/dev/null || true

if [ -f "$ROOT/packaging/linux/install.sh" ]; then
  HECTOR_PREFIX=/usr/share/osv01d bash "$ROOT/packaging/linux/install.sh" || true
fi

echo "installed $(date -u +%Y-%m-%dT%H:%M:%SZ)" > /etc/osv01d/wsl-ready
echo "Arch WSL is installed and available."
