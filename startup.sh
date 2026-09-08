#!/bin/sh
set -eu
cd /workspace
export PATH="$HOME/.opencode/bin:$PATH"
node scripts/preview.mjs stop || true
bash packaging/superset/boot.sh >>/tmp/superset-boot.log 2>&1 &
if curl -sf -o /dev/null --max-time 2 http://127.0.0.1:8080/; then
  exit 0
fi
npm run dev >>/tmp/app-startup.log 2>&1 &
