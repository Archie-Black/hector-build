/** Hyper PBX. Spectral HX is the face. VSCodium is the heavy editor on the vscodium-swarm. */

import { CHARTER } from "./charter";
import { CODIUM } from "./codium";

export const PBX = Object.freeze({
  name: "Hyper PBX",
  console: "PBX Console",
  bin: "pbx",
  linux: "/v01d/programs/PBXConsole",
  win: "C:\\v01d\\programs\\PBXConsole.exe",
  swarm: "vscodium-swarm",
  exec: "hx-exec",
  face: "Spectral HX",
  editor: "VSCodium",
  script: "packaging/hx/hx-exec.sh",
  downloads: CHARTER.downloads,
  codium: CODIUM.bin,
});

export type PbxLane = "hx" | "codium" | "swarm";

export type PbxJob = {
  lane: PbxLane;
  swarm: typeof PBX.swarm;
  exec: typeof PBX.exec;
  task?: string;
  workspace?: string;
  jersey?: number;
};

export function wantsPbx(text: string) {
  return /\b(hyper pbx|pbx console|pbx job|vscodium[- ]swarm|hx-exec|pbx)\b/i.test(text);
}

export function pbxJob(text: string, extra: Partial<PbxJob> = {}): PbxJob {
  const heavy = /\b(vscodium|codium|refactor|typecheck|test|build|doctor|iso|heavy editor)\b/i.test(text);
  const hive = /\b(swarm|agents?|ghosts?|jersey)\b/i.test(text);
  const lane: PbxLane = extra.lane || (hive ? "swarm" : heavy ? "codium" : "hx");
  return {
    lane,
    swarm: PBX.swarm,
    exec: PBX.exec,
    workspace: extra.workspace || CODIUM.workspace,
    task: extra.task,
    jersey: extra.jersey,
  };
}

export function sayPbx() {
  return "Hyper PBX. Spectral HX is the face. VSCodium takes the heavy edit on the vscodium-swarm via hx-exec.";
}
