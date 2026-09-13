#!/usr/bin/env bash
# Predictive TTS on Arch. DiT weights optional. Diplomat only.
set -euo pipefail
ROOT="${OSV01D_TTS_ROOT:-/opt/osv01d/tts}"
HERE="$(cd "$(dirname "$0")" && pwd)"
install -d "$ROOT/ref" "$ROOT/weights" /etc/pipewire/pipewire.conf.d /etc/systemd/system
install -m 0644 "$HERE/linguistic.py" "$HERE/sway.py" "$HERE/dit_runtime.py" "$HERE/server.py" "$ROOT/"
install -m 0755 "$HERE/server.py" "$ROOT/server.py"
install -m 0644 "$HERE/osv01d-tts.service" /etc/systemd/system/osv01d-tts.service
install -m 0644 "$HERE/pipewire-tts.conf" /etc/pipewire/pipewire.conf.d/osv01d-tts.conf
if command -v pacman >/dev/null 2>&1; then
  pacman -S --needed --noconfirm python python-pip python-numpy espeak-ng pipewire pipewire-jack openblas || true
  pacman -S --needed --noconfirm python-onnxruntime-gpu python-fastapi || pacman -S --needed --noconfirm python-onnxruntime || true
fi
if [[ "${INSTALL_WEIGHTS:-0}" == "1" ]] && command -v huggingface-cli >/dev/null 2>&1; then
  huggingface-cli download DakeQQ/F5-TTS-ONNX --local-dir "$ROOT/weights" || true
fi
if [[ -f "$HERE/ref/paul.wav" ]]; then
  install -m 0644 "$HERE/ref/paul.wav" "$ROOT/ref/paul.wav"
fi
systemctl daemon-reload
systemctl enable --now osv01d-tts.service || true
echo "tts: $ROOT  POST http://127.0.0.1:8090/v1/speech/predictive"
