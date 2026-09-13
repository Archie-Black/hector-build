/** CUDA is the map. ROCm is the counterpart. Together they are a team. */

import { CUDA } from "./cuda";
import { COUNTERPART, RDNA } from "./rdna";
import { crew, type Hands } from "./team";

export type Metal = "rdna" | "cuda" | "team";

export function pick(have: Hands = { amd: true }): Metal {
  return crew(have).mode;
}

export function facet(have: Hands = { amd: true }) {
  const c = crew(have);
  return {
    metal: c.mode,
    name: c.mode === "team" ? "Asimov RDNA + CUDA" : c.mode === "cuda" ? "CUDA" : RDNA.name,
    chip: c.mode === "cuda" ? CUDA.chip : RDNA.gfx,
    runtime: c.compile.map((m) => (m === "rdna" ? "HIP" : "CUDA")).join(" + "),
    note: c.note,
  };
}

export function counterparts() {
  return (Object.keys(CUDA) as (keyof typeof CUDA)[]).map((k) => ({
    cuda: CUDA[k],
    rocm: COUNTERPART[k],
    team: true as const,
  }));
}
