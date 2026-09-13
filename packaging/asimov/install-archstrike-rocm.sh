#!/usr/bin/env bash
# Arch strike: full ROCm 7 SDK on Arch for Asimov RDNA. gfx1201. No raid tools. No CUDA required.
set -euo pipefail
echo "Arch ROCm strike — hip-sdk, rocBLAS, MIOpen, RCCL, RADV"

if ! command -v pacman >/dev/null 2>&1; then
  echo "This strike is for Arch. Run it on OS V01D / Arch."
  exit 0
fi

sudo pacman -S --needed --noconfirm \
  base-devel clang cmake ninja python python-pip \
  vulkan-radeon vulkan-tools mesa \
  hip-runtime-amd rocm-core rocm-hip-sdk rocminfo rocm-smi-lib \
  hipblas rocblas rocfft hipfft rocsparse hipsparse rocsolver hipsolver \
  rccl miopen-hip opencl-amd clinfo \
  || sudo pacman -S --needed --noconfirm \
    vulkan-radeon vulkan-tools mesa hip-runtime-amd rocm-core rocminfo hipblas rocblas \
    || true

export HIP_PLATFORM=amd
export HIP_VISIBLE_DEVICES="${HIP_VISIBLE_DEVICES:-0}"
unset HSA_OVERRIDE_GFX_VERSION || true
export ROCBLAS_USE_HIPBLASLT=0

if command -v rocminfo >/dev/null 2>&1; then
  rocminfo | grep -E "Name:|gfx|Marketing" | head -24 || true
fi

echo "Arch ROCm strike done. Defense and robotics only. Asimov RDNA is the world."
