/** Asimov RDNA — AMD ROCm counterpart to CUDA. gfx1201. This house runs here. */

import { CUDA } from "./cuda";

export const RDNA = Object.freeze({
  name: "Asimov RDNA",
  version: "01",
  gfx: "gfx1201",
  card: "Radeon RX 9070 XT",
  rocm: "7",
  runtime: "HIP",
  compiler: "hipcc",
  blas: "rocBLAS",
  dnn: "MIOpen",
  comm: "RCCL",
  fft: "rocFFT",
  sparse: "rocSPARSE",
  solver: "rocSOLVER",
  vulkan: "RADV",
  sim: "Asimov RDNA XPBD",
  devices: "HIP_VISIBLE_DEVICES",
  note: "ROCm 7 is the counterpart to CUDA 12.8. They work as a team: RDNA drives, CUDA sees.",
});

export const COUNTERPART: Record<keyof typeof CUDA, string> = {
  runtime: RDNA.runtime,
  compiler: RDNA.compiler,
  blas: RDNA.blas,
  dnn: RDNA.dnn,
  comm: RDNA.comm,
  fft: RDNA.fft,
  sparse: RDNA.sparse,
  solver: RDNA.solver,
  chip: RDNA.gfx,
  vulkan: RDNA.vulkan,
  sim: RDNA.sim,
  devices: RDNA.devices,
  toolkit: `ROCm ${RDNA.rocm}`,
};

export function rdnaProbe(opts?: { amd?: boolean }) {
  const amd = opts?.amd !== false;
  return {
    engine: RDNA.name,
    gfx: RDNA.gfx,
    amd,
    note: amd
      ? `${RDNA.name} teams with CUDA: HIP + nvcc, ${RDNA.gfx} + ${CUDA.chip}.`
      : `${RDNA.name} holds the floor. CUDA joins when an RTX is here.`,
  };
}
