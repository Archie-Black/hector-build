/** hx-exec. Hyper PBX launches VSCodium on the vscodium-swarm. No second chrome. */

import { AGENT_TASKS, CODIUM } from "./codium";
import { PBX, pbxJob, type PbxJob } from "./pbx-bridge";

export type HxExecLaunch = {
  swarm: typeof PBX.swarm;
  exec: typeof PBX.exec;
  bin: string;
  args: string[];
  folder: string;
  task?: string;
  script: typeof PBX.script;
};

export function taskOf(name?: string) {
  if (!name) return undefined;
  const key = name.trim().toLowerCase();
  return AGENT_TASKS.find((t) => t.id === key || t.label.toLowerCase() === key);
}

/** Args for `codium`. Agents then Run Task from the copied workspace tasks. */
export function hxExecLaunch(job: Partial<PbxJob> & { folder?: string } = {}): HxExecLaunch {
  const wired = pbxJob(job.task || job.lane || "codium", job);
  const folder = job.folder || wired.workspace || ".";
  const hit = taskOf(job.task);
  const args = [folder, "--new-window"];
  if (hit) args.push("--command", "workbench.action.tasks.runTask");
  return {
    swarm: PBX.swarm,
    exec: PBX.exec,
    bin: CODIUM.bin,
    args,
    folder,
    task: hit?.label,
    script: PBX.script,
  };
}

export function hxExecCmd(job?: Partial<PbxJob> & { folder?: string }) {
  const launch = hxExecLaunch(job);
  return ["bash", PBX.script, launch.folder];
}
