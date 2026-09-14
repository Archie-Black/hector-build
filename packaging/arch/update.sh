#!/usr/bin/env bash
# Silent improvement. Propose. User hour (default 03:00). Restore on conflict.
set -euo pipefail
PREFIX="${HECTOR_PREFIX:-/usr/share/osv01d}"
STAMP="/var/lib/osv01d/last-good"
mkdir -p /var/lib/osv01d /var/log/osv01d
if [[ "${V01D_UPDATE_APPROVE:-0}" != "1" && "${V01D_SILENT_HOUR:-3}" != "$(date +%-H)" && "${V01D_UPDATE_FORCE:-0}" != "1" ]]; then
  echo "update proposed. approve with V01D_UPDATE_APPROVE=1 or wait for ${V01D_SILENT_HOUR:-3}:00"
  exit 0
fi
if command -v pacman >/dev/null; then
  pacman -Syu --noconfirm || {
    echo "conflict — restoring previous state" | tee -a /var/log/osv01d/update.log
    if [[ -d "$STAMP" ]]; then
      rsync -a "$STAMP"/ "$PREFIX"/ || true
    fi
    exit 1
  }
fi
rsync -a --delete --exclude node_modules "$PREFIX"/ "$STAMP"/ || true
echo "updated $(date -u +%FT%TZ)" >> /var/log/osv01d/update.log
