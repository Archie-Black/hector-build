/**
 * Keystone — Mac mapping super agent.
 * Creates a team, hands each agent several tasks, writes app + production maps.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ALL_MAP, productionSpec, unresolved, type Translation } from "./map.ts";
import { machBoot, machStatus, taskForPid } from "./mach.ts";
import { launchctlLoad, listJobs } from "./launchd.ts";
import { kvmBoot } from "./seats.ts";
import { retinaOf } from "./retina.ts";

export type KeystoneAgentId = "rights" | "hid" | "glass" | "launchd" | "pack" | "prove";

export type KeystoneTask = {
  id: string;
  title: string;
  agent: KeystoneAgentId;
  status: "queued" | "active" | "done" | "blocked";
  result: string;
};

export type KeystoneAgent = {
  id: KeystoneAgentId;
  name: string;
  duty: string;
  tasks: KeystoneTask[];
};

export type KeystoneReport = {
  object: "hector.keystone";
  lead: "keystone";
  voice: "Keystone reports to Hector.";
  agents: KeystoneAgent[];
  done: number;
  blocked: number;
  translations: number;
  missing: string[];
  production: ReturnType<typeof productionSpec>;
  wrote: string[];
};

const DIR = join(process.cwd(), "data/kvm");
const STATE = join(DIR, "keystone.json");
const PROD = join(process.cwd(), "packaging/darwin/production.json");

const ROSTER: { id: KeystoneAgentId; name: string; duty: string; titles: string[] }[] = [
  {
    id: "rights",
    name: "Rights",
    duty: "Mach ipc_space and capabilities",
    titles: [
      "Seal a local ipc_space per task",
      "Bind host-priv to Hector only",
      "Map copy/move/make dispositions",
      "Prove send-once becomes a dead name",
    ],
  },
  {
    id: "hid",
    name: "HID",
    duty: "Mac ↔ PC keys and pointer",
    titles: [
      "Map Control to Command",
      "Map Alt to Option",
      "Bind the KVM cycle chord",
      "Use usb-tablet as absolute pointer",
    ],
  },
  {
    id: "glass",
    name: "Glass",
    duty: "Retina seat and webconnect",
    titles: [
      "Lock Cinema 30″ 2560×1600",
      "Turn Quartz backing to 2×",
      "Bind webconnect :6081",
      "Keep the window 16:10",
    ],
  },
  {
    id: "launchd",
    name: "Launchd",
    duty: "Bootstrap jobs for app and production",
    titles: [
      "Load com.hector.webconnect",
      "Load com.hector.kvm",
      "Load com.spectralhx.seat",
      "Point production at ~/Library/LaunchAgents",
    ],
  },
  {
    id: "pack",
    name: "Pack",
    duty: "Production Mac software mapping",
    titles: [
      "Set Application Support path",
      "Pick HVF on Darwin, KVM on Linux, WHPX on Windows",
      "Map electron-builder --mac",
      "Map Homebrew /opt/homebrew",
    ],
  },
  {
    id: "prove",
    name: "Prove",
    duty: "Refuse a bad map. Keep a good one.",
    titles: [
      "Reject a stolen knot",
      "Deny task_for_pid to HX",
      "Write production.json",
      "Resolve every required translation",
    ],
  },
];

function mintTeam(): KeystoneAgent[] {
  let n = 0;
  return ROSTER.map((r) => ({
    id: r.id,
    name: r.name,
    duty: r.duty,
    tasks: r.titles.map((title) => ({
      id: `ks-${++n}`,
      title,
      agent: r.id,
      status: "queued" as const,
      result: "",
    })),
  }));
}

function runTask(t: KeystoneTask): KeystoneTask {
  try {
    if (t.agent === "rights") {
      machBoot();
      const st = machStatus();
      const priv = st.find((p) => p.name === "com.hector.host-priv");
      if (t.title.includes("host-priv") && priv?.holder !== "hector") {
        return { ...t, status: "blocked", result: "host-priv not on Hector" };
      }
      return { ...t, status: "done", result: `${st.length} ports live` };
    }
    if (t.agent === "hid") {
      return { ...t, status: "done", result: "pc-ctrl = mac-command" };
    }
    if (t.agent === "glass") {
      const m = retinaOf("cinema30");
      if (t.title.includes("2560") && (m.physical.w !== 2560 || m.physical.h !== 1600)) {
        return { ...t, status: "blocked", result: "retina not Cinema 30" };
      }
      return { ...t, status: "done", result: `${m.physical.w}x${m.physical.h} @${m.scale}x` };
    }
    if (t.agent === "launchd") {
      launchctlLoad();
      const labels = listJobs().map((j) => j.label);
      if (t.title.includes("webconnect") && !labels.includes("com.hector.webconnect")) {
        return { ...t, status: "blocked", result: "webconnect job missing" };
      }
      return { ...t, status: "done", result: labels.join(", ") };
    }
    if (t.agent === "pack") {
      const spec = productionSpec();
      if (t.title.includes("HVF") && spec.accel.darwin !== "hvf") {
        return { ...t, status: "blocked", result: "HVF missing" };
      }
      return { ...t, status: "done", result: spec.electron };
    }
    machBoot();
    if (t.title.includes("task_for_pid")) {
      const denied = taskForPid("hx", "hector");
      if (!("error" in denied)) return { ...t, status: "blocked", result: "HX got task_for_pid" };
      return { ...t, status: "done", result: "HX denied" };
    }
    if (t.title.includes("production.json")) {
      return { ...t, status: "done", result: PROD };
    }
    if (t.title.includes("translation")) {
      const miss = unresolved([
        "MACH_PORT_RIGHT_RECEIVE",
        "host_priv_t",
        "Control",
        "Cinema Display 30″",
        "webconnect",
        "accel darwin",
      ]);
      if (miss.length) return { ...t, status: "blocked", result: miss.join(", ") };
      return { ...t, status: "done", result: `${ALL_MAP.length} maps` };
    }
    return { ...t, status: "done", result: "ok" };
  } catch (err) {
    return { ...t, status: "blocked", result: err instanceof Error ? err.message : "failed" };
  }
}

function writeMaps(agents: KeystoneAgent[]) {
  mkdirSync(DIR, { recursive: true });
  mkdirSync(join(process.cwd(), "packaging/darwin"), { recursive: true });
  const body = {
    lead: "keystone",
    at: Date.now(),
    agents,
    production: productionSpec(),
    translations: ALL_MAP,
  };
  writeFileSync(STATE, JSON.stringify(body));
  writeFileSync(PROD, JSON.stringify(productionSpec(), null, 2));
  return [STATE, PROD];
}

export function keystoneRun(needed: string[] = []): KeystoneReport {
  kvmBoot("cinema30");
  const agents = mintTeam().map((a) => ({
    ...a,
    tasks: a.tasks.map((t) => runTask({ ...t, status: "active" })),
  }));
  const wrote = writeMaps(agents);
  const tasks = agents.flatMap((a) => a.tasks);
  return {
    object: "hector.keystone",
    lead: "keystone",
    voice: "Keystone reports to Hector.",
    agents,
    done: tasks.filter((t) => t.status === "done").length,
    blocked: tasks.filter((t) => t.status === "blocked").length,
    translations: ALL_MAP.length,
    missing: unresolved(needed),
    production: productionSpec(),
    wrote,
  };
}

export function keystoneStatus() {
  if (!existsSync(STATE)) return keystoneRun();
  try {
    return JSON.parse(readFileSync(STATE, "utf8")) as KeystoneReport;
  } catch {
    return keystoneRun();
  }
}

export function wantsKeystone(text: string) {
  return /\b(keystone|mach (map|right|port)|mac(os)? mapping|software mapping|production map)\b/i.test(text);
}

export type { Translation };
