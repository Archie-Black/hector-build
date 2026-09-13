#!/usr/bin/env bash
# Dual-core on Arch. Machine nice -20. Diplomat has no exec. Root for packages and unit.
set -euo pipefail
if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo "run as root"
  exit 1
fi
USER_NAME="${SUDO_USER:-${USER:-root}}"
pacman -S --needed --noconfirm python ffmpeg perl-image-exiftool pipewire pipewire-jack wireplumber || true
install -d -o "$USER_NAME" -g "$USER_NAME" /opt/osv01d/cores /var/log/osv01d
install -m 644 /dev/stdin /etc/security/limits.d/99-osv01d-rt.conf <<'EOF'
@wheel           soft    rtprio          95
@wheel           hard    rtprio          99
@wheel           soft    memlock         unlimited
@wheel           hard    memlock         unlimited
EOF
HERE="$(cd "$(dirname "$0")" && pwd)"
install -m 755 "$HERE/gateway.py" /opt/osv01d/cores/gateway.py
install -m 644 "$HERE/osv01d-cores.service" /etc/systemd/system/osv01d-cores.service
chown -R "$USER_NAME":"$USER_NAME" /opt/osv01d/cores
systemctl daemon-reload
systemctl enable --now osv01d-cores.service || true
echo "cores: machine log /var/log/osv01d/machine.log diplomat /var/log/osv01d/diplomat.log"
