import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { join } from "node:path";
import { launchctlLoad, webconnectPort } from "./launchd.ts";
import { machBoot } from "./mach.ts";
import { kvmBoot, kvmStatus } from "./seats.ts";
import { detectAccel, darwinIso, qemuBin, spawnDarwin } from "./hv.ts";
import { retinaOf } from "./retina.ts";
import { keystoneRun } from "./keystone.ts";

export const DARWIN_SYSCTL = {
  "kern.ostype": "Darwin",
  "kern.osrelease": "25.0.0",
  "kern.version": "Hector Darwin 25: Mach + BSD + IOKit, knot rights, launchd webconnect",
  "kern.hostname": "hector-darwin.local",
  "hw.memsize": String(2 * 1024 * 1024 * 1024),
  "hw.ncpu": "2",
  "hw.optional.arm64": process.arch === "arm64" ? "1" : "0",
  "machdep.cpu.brand_string": "Hector KVM",
} as const;

export function sysctl(name?: string) {
  if (name) return { [name]: DARWIN_SYSCTL[name as keyof typeof DARWIN_SYSCTL] ?? "" };
  return { ...DARWIN_SYSCTL };
}

export function darwinStatus() {
  const script = join(process.cwd(), "packaging/darwin/darwin-guest.sh");
  return {
    object: "hector.darwin",
    ostype: "Darwin",
    release: "25.0.0",
    upgraded: ["mach-knot-rights", "launchd-agents", "iokit-kvm-hid", "quartz-2x", "webconnect"],
    accel: detectAccel(),
    qemu: existsSync(qemuBin()) || qemuBin() === "qemu-system-x86_64",
    iso: darwinIso(),
    script: existsSync(script),
    webconnect: webconnectPort(),
    retina: retinaOf(),
    kvm: kvmStatus(),
  };
}

export function darwinBoot(mode?: string) {
  machBoot();
  launchctlLoad();
  kvmBoot(mode);
  const map = keystoneRun();
  const hv = spawnDarwin();
  const script = join(process.cwd(), "packaging/darwin/darwin-guest.sh");
  if (existsSync(script)) {
    try {
      spawn("bash", [script, "start"], { detached: true, stdio: "ignore" }).unref();
    } catch {
      /* compositor is enough */
    }
  }
  return { ...darwinStatus(), hv, keystone: { done: map.done, blocked: map.blocked, agents: map.agents.map((a) => a.id) } };
}

export function wantsDarwin(text: string) {
  return /\b(darwin|macos|mac os|retina|cinema display|webconnect|kvm switch)\b/i.test(text);
}
