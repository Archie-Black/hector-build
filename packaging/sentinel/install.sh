#!/usr/bin/env bash
# Eternal Sentinel. Optional Ollama on the private network. Hector stays the mouth.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
say() { printf 'sentinel: %s\n' "$*"; }

say "node $(command -v node || echo missing)"
command -v docker >/dev/null && say "docker ok" || say "docker missing — Alpha/Beta/Gamma still run inside Hector"
if command -v nvidia-smi >/dev/null 2>&1; then
  say "nvidia $(nvidia-smi --query-gpu=name --format=csv,noheader 2>/dev/null | head -n1 || echo present)"
else
  say "no nvidia. local path stays CPU/INT4."
fi

if command -v docker >/dev/null && docker info >/dev/null 2>&1; then
  if docker network inspect v01d_fabric >/dev/null 2>&1; then
    docker compose -f "$ROOT/packaging/sentinel/compose.yml" up -d ollama || say "ollama compose skipped"
  else
    say "website fabric is not up. start OS V01D cloud first if you want Ollama on the private net."
  fi
fi

if command -v ollama >/dev/null 2>&1; then
  ollama pull qwen2.5:7b || true
fi

if [ -d /etc/systemd/system ]; then
  cat > /tmp/osv01d-sentinel.service <<EOF
[Unit]
Description=OS V01D Eternal Sentinel Gamma
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/python3 $ROOT/packaging/sentinel/main.py
Restart=always
RestartSec=8
Environment=SENTINEL_NODE=http://127.0.0.1:8080

[Install]
WantedBy=multi-user.target
EOF
  if [ "$(id -u)" -eq 0 ]; then
    cp /tmp/osv01d-sentinel.service /etc/systemd/system/osv01d-sentinel.service
    systemctl daemon-reload || true
    systemctl enable --now osv01d-sentinel.service || true
    say "gamma sidecar enabled"
  else
    say "not root — skip systemd. python3 packaging/sentinel/main.py when Hector is up."
  fi
fi
say "done. talk to Hector. Alpha/Beta/Gamma stay silent."
