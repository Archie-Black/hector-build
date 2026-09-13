/** Asimov RDNA and CUDA as one lab. Hector scores them. They improve. */

import { evolveSplit, prefer } from "@/lib/hector/metal";

export type Hands = { amd?: boolean; nvidia?: boolean };
export type Seat = "rdna" | "cuda";
export type Crew = {
  mode: "team" | "rdna" | "cuda";
  world: Seat;
  eyes: Seat;
  compile: Seat[];
  note: string;
};

export function crew(h: Hands = {}): Crew {
  const amd = Boolean(h.amd);
  const nvidia = Boolean(h.nvidia);
  if (amd && nvidia) {
    const s = evolveSplit("rdna", "cuda");
    return {
      mode: "team",
      world: s.world,
      eyes: s.eyes,
      compile: ["rdna", "cuda"],
      note: s.note,
    };
  }
  if (nvidia && !amd) {
    return {
      mode: "cuda",
      world: "cuda",
      eyes: "cuda",
      compile: ["cuda"],
      note: "CUDA holds the floor until a Radeon joins. Hector will score the team then.",
    };
  }
  return {
    mode: "rdna",
    world: "rdna",
    eyes: "rdna",
    compile: ["rdna"],
    note: "Asimov RDNA holds the floor. CUDA joins the moment an RTX is here. Hector keeps score.",
  };
}

export function deal(jobs: string[], h: Hands = {}, explore = true) {
  const c = crew(h);
  if (c.mode !== "team") return jobs.map((job) => ({ job, metal: c.world }));
  return jobs.map((job) => {
    const fb: Seat = /vision|track|eyes/.test(job) ? c.eyes : c.world;
    return { job, metal: prefer(job, fb, explore) };
  });
}

export function sealTeam(h: Hands = { amd: true }) {
  return crew(h);
}
