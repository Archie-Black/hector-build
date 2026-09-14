#!/usr/bin/env bash
# Live ISO first process. Firmware, questions, install or live desk.
set +e
HERE="$(cd "$(dirname "$0")" && pwd)"
export HECTOR_PREFIX="${HECTOR_PREFIX:-/usr/share/osv01d}"
bash "$HERE/firmware-first.sh"
bash "$HERE/install-live.sh"
if command -v osv01d >/dev/null; then
  exec osv01d
fi
exec bash "$HECTOR_PREFIX/packaging/linux/osv01d.sh"
