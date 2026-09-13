/** V01D HAL. Vulkan-shaped. RDNA and CUDA submit the same command list. Hector RL picks the queue. */

import { act, type Action } from "@/lib/hector/rl";

export type Backend = Action;
export type Op = "step" | "lidar" | "vision" | "imu";

export type Device = {
  id: string;
  backend: Backend;
  vendor: "amd" | "nvidia" | "any";
  chip: string;
  queues: { compute: number; graphics: number; transfer: number };
};

export const HAL = Object.freeze({
  name: "V01D HAL",
  api: "Vulkan 1.3 command model",
  note: "One command buffer. RDNA (RADV/HIP), CUDA, and a CPU queue. Hector RL binds the queue. The app never names a vendor.",
});

export function devices(): Device[] {
  return [
    { id: "rdna0", backend: "rdna", vendor: "amd", chip: "gfx1201", queues: { compute: 4, graphics: 1, transfer: 2 } },
    { id: "cuda0", backend: "cuda", vendor: "nvidia", chip: "sm_89", queues: { compute: 4, graphics: 1, transfer: 2 } },
    { id: "vk0", backend: "vulkan", vendor: "any", chip: "vk", queues: { compute: 2, graphics: 1, transfer: 1 } },
  ];
}

export function bind(job: Op, explore = true): Device {
  const b = act(job, explore);
  return devices().find((d) => d.backend === b) ?? devices()[0]!;
}

export function submit(job: Op, ms: number, ok = true, _next: Op = job) {
  const d = bind(job, true);
  return { device: d.id, backend: d.backend, family: "compute" as const, fence: 1, ok, ms };
}

export function sayHal() {
  const n = devices().length;
  return `${HAL.name}: ${n} queues (RDNA, CUDA, Vulkan). Same command list. Hector RL binds.`;
}
