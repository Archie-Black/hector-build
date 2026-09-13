/** Isaac Sim 6.1.0 — latest GA. Full pip + Docker + ROS 2 extra. NVIDIA RTX for the GPU world. */

export const ISAAC = Object.freeze({
  name: "NVIDIA Isaac Sim",
  version: "6.1.0",
  pip: "isaacsim[all,extscache,ros2]==6.1.0.0",
  index: "https://pypi.nvidia.com",
  python: "3.12",
  torch: "2.11.0",
  docker: "nvcr.io/nvidia/isaac-sim:6.1.0",
  zip: "https://download.isaacsim.nvidia.com/isaac-sim-standalone-6.1.0-linux-x86_64.zip",
  lab: "Isaac Lab (cloned with 6.1)",
  eula: "OMNI_KIT_ACCEPT_EULA=YES",
});

export type Probe = {
  version: string;
  gpu: boolean;
  source: boolean;
  note: string;
};

export function probe(opts?: { gpu?: boolean; source?: boolean }): Probe {
  const gpu = Boolean(opts?.gpu);
  const source = opts?.source !== false;
  if (gpu) {
    return { version: ISAAC.version, gpu: true, source, note: `Isaac Sim ${ISAAC.version} GPU world is on. ROS 2 extra is wired.` };
  }
  return {
    version: ISAAC.version,
    gpu: false,
    source,
    note: `Isaac Sim ${ISAAC.version} is installed as source and host scripts. This machine has no NVIDIA RTX, so the lab runs the Isaac-class PhysX step here. On an RTX box the installer pulls the full GPU app.`,
  };
}
