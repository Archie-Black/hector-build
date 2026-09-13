#!/usr/bin/env bash
# Asimov RDNA — ROCm counterpart to the CUDA toolkit. gfx1201. No HSA override.
set -euo pipefail
echo "Asimov RDNA — ROCm 7 counterpart to CUDA 12.8 (HIP, rocBLAS, MIOpen, RADV)"

if command -v pacman >/dev/null 2>&1; then
  sudo pacman -S --needed --noconfirm \
    vulkan-radeon vulkan-tools mesa \
    hip-runtime-amd rocm-core rocminfo hipblas rocblas \
    opencl-mesa clinfo \
    || true
fi

export HIP_PLATFORM=amd
export HIP_VISIBLE_DEVICES="${HIP_VISIBLE_DEVICES:-0}"
# gfx1201 is first-class on ROCm 7. Do not set HSA_OVERRIDE_GFX_VERSION.
unset HSA_OVERRIDE_GFX_VERSION || true
# hipblaslt tensile miss on some 9070 stacks — keep GEMM on rocBLAS.
export ROCBLAS_USE_HIPBLASLT=0

if command -v rocminfo >/dev/null 2>&1; then
  rocminfo | grep -E "Name:|gfx" | head -20 || true
fi
if command -v vulkaninfo >/dev/null 2>&1; then
  vulkaninfo 2>/dev/null | grep -E "deviceName|GFX12" | head -8 || true
fi

echo "Asimov RDNA ready. Isaac Sim is the NVIDIA leftover. This world runs on Radeon."
