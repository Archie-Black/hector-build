#!/usr/bin/env bash
# Automated SSH key revocation: settle overlap, rotate due keys, purge dead private files.
# install: hector-keys-revoke.sh install   (daily 03:00)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
CMD="${1:-run}"

run_revoke() {
  node --experimental-strip-types src/lib/share/revoke-cli.ts
}

install_cron() {
  local line="0 3 * * * $ROOT/packaging/linux/hector-keys-revoke.sh >>$ROOT/data/share/keys/revoke.log 2>&1"
  mkdir -p "$ROOT/data/share/keys"
  if command -v crontab >/dev/null 2>&1; then
    (crontab -l 2>/dev/null | grep -v hector-keys-revoke || true; echo "$line") | crontab - || true
    echo "cron: 03:00 daily"
  fi
  local unit="$HOME/.config/systemd/user"
  if command -v systemctl >/dev/null 2>&1; then
    mkdir -p "$unit"
    cp "$ROOT/packaging/linux/hector-keys-revoke.service" "$unit/" 2>/dev/null || true
    cp "$ROOT/packaging/linux/hector-keys-revoke.timer" "$unit/" 2>/dev/null || true
    sed -i "s|__HECTOR_ROOT__|$ROOT|g" "$unit/hector-keys-revoke.service" 2>/dev/null || true
    systemctl --user daemon-reload 2>/dev/null || true
    systemctl --user enable --now hector-keys-revoke.timer 2>/dev/null || true
    echo "systemd user timer: 03:00 daily"
  fi
}

case "$CMD" in
  run|"") run_revoke ;;
  install) install_cron; run_revoke ;;
  *) echo "run | install" >&2; exit 2 ;;
esac
