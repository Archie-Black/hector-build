#!/usr/bin/env bash
# Hash the unit tree. Detach-sign with GPG if a key exists. Never invent a key.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
LIST=(
  packaging/arch/PKGBUILD
  packaging/arch/osv01d.install
  packaging/arch/dual-core/osv01d-cores.service
  packaging/arch/dual-core/osv01d-hear.service
  packaging/arch/dual-core/gateway.py
  packaging/arch/dual-core/hear.sh
  packaging/arch/dual-core/verify.sh
  packaging/arch/dual-core/pipewire-diplomat.conf
  packaging/arch/osv01d-firmware-keep.service
  packaging/arch/osv01d-firmware.timer
  packaging/arch/osv01d-firmware.service
  packaging/linux/osv01d.sh
)
SUMS="$HERE/SHA256SUMS"
sha256sum "${LIST[@]}" > "$SUMS"
echo "wrote $SUMS"

KEY="${OSV01D_SIGN_KEY:-}"
if [[ -z "$KEY" ]] && command -v gpg >/dev/null; then
  KEY="$(gpg --list-secret-keys --with-colons 2>/dev/null | awk -F: '/^fpr:/ {print $10; exit}')"
fi
if [[ -z "$KEY" ]]; then
  echo "no gpg secret key. hashes only. set OSV01D_SIGN_KEY or import a key, then re-run."
  echo "publish refuses until .sig files exist."
  exit 0
fi
gpg --yes --detach-sign --armor -u "$KEY" "$SUMS"
for f in "${LIST[@]}"; do
  gpg --yes --detach-sign --armor -u "$KEY" "$f"
done
echo "signed with $KEY"
echo "package: cd packaging/arch && makepkg --sign -f"
