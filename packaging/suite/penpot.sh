#!/usr/bin/env bash
# Local Penpot UI. Does not leave the box.
set -euo pipefail
if curl -sf -o /dev/null http://127.0.0.1:9001; then
  xdg-open http://127.0.0.1:9001 >/dev/null 2>&1 || true
  exit 0
fi
echo "Start Penpot on 127.0.0.1:9001 (docker compose --profile ui), then open again."
