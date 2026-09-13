#!/usr/bin/env bash
# CUDA reference toolkit. The world we run is Asimov RDNA (install-rdna.sh).
set -euo pipefail
echo "CUDA reference only. Asimov RDNA is the counterpart we run."

if command -v pacman >/dev/null 2>&1; then
  sudo pacman -S --needed --noconfirm \
    cuda cudnn nvidia nvidia-utils nvidia-container-toolkit \
    vulkan-nvidia vulkan-tools \
    || true
fi

export CUDA_VISIBLE_DEVICES="${CUDA_VISIBLE_DEVICES:-0}"
unset HIP_VISIBLE_DEVICES || true

if command -v nvidia-smi >/dev/null 2>&1; then
  nvidia-smi | head -12 || true
fi
if command -v nvcc >/dev/null 2>&1; then
  nvcc --version | tail -3 || true
fi

echo "Asimov CUDA ready when an RTX is present. On Radeon, Asimov RDNA holds the floor."
