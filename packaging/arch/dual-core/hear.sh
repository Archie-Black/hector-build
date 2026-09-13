#!/usr/bin/env bash
# Diplomat ear. PipeWire capture. Energy only. Never a shell from audio.
set -euo pipefail
UID_NOW="${UID:-$(id -u)}"
RUN="${XDG_RUNTIME_DIR:-/run/user/$UID_NOW}/osv01d"
mkdir -p "$RUN"
NODE="${OSV01D_HEAR_NODE:-osv01d.diplomat.hear}"
if ! command -v pw-cat >/dev/null; then
  echo "pw-cat missing (pipewire)" >&2
  exit 1
fi
exec pw-cat --record --target "$NODE" --rate 16000 --channels 1 --format s16 - > "$RUN/diplomat.pcm"
