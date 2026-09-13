/** Spectral HX compiles on the same team Asimov uses. HIP and nvcc together when both metals are here. */

import { crew, deal, type Hands } from "@/lib/asimov/team";
import { HAL } from "@/lib/v01d/hal";

export function accel(h: Hands = { amd: true }) {
  const c = crew(h);
  return {
    metal: c.mode,
    world: c.world,
    eyes: c.eyes,
    cc: c.compile.map((m) => (m === "rdna" ? "hipcc" : "nvcc")),
    jobs: deal(["step", "lidar", "vision", "imu"], h),
    note: `${c.note} ${HAL.name} binds the queue.`,
  };
}
