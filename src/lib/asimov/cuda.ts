/** CUDA is the reference. We do not ship a CUDA world. ROCm is the counterpart. */

export const CUDA = Object.freeze({
  runtime: "CUDA",
  compiler: "nvcc",
  blas: "cuBLAS",
  dnn: "cuDNN",
  comm: "NCCL",
  fft: "cuFFT",
  sparse: "cuSPARSE",
  solver: "cuSOLVER",
  chip: "sm_89",
  vulkan: "nvidia",
  sim: "Isaac / PhysX",
  devices: "CUDA_VISIBLE_DEVICES",
  toolkit: "12.8",
});
