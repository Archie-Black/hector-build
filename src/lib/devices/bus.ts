/**
 * Windows PnP + Linux udev, as a Hector bus.
 * Devices are backends. Drivers are silent. HID never takes focus.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export type DeviceClass = "bus" | "spool" | "sdp" | "hid" | "render" | "block" | "char" | "net" | "compute";
export type DeviceState = "unknown" | "present" | "started" | "stopped" | "surprise-removed";

export type HxDevice = {
  id: string;
  class: DeviceClass;
  name: string;
  path: string;
  state: DeviceState;
  focus: boolean;
  backend: string;
};

const DIR = join(process.cwd(), "data", "devices");
const FILE = join(DIR, "tree.json");

const SEED: HxDevice[] = [
  { id: "root", class: "bus", name: "Hector PnP", path: "/dev/hector", state: "started", focus: false, backend: "bus" },
  { id: "spool", class: "spool", name: "Job spooler", path: "/dev/hector/spool", state: "started", focus: false, backend: "print" },
  { id: "sdp", class: "sdp", name: "Service discovery", path: "/dev/hector/sdp", state: "started", focus: false, backend: "bluetooth" },
  { id: "hid", class: "hid", name: "Ghost HID", path: "/dev/hector/hid", state: "started", focus: false, backend: "hid" },
  { id: "git", class: "block", name: "Git volume", path: "/dev/hector/git", state: "present", focus: false, backend: "git" },
  { id: "term", class: "char", name: "Collab TTY", path: "/dev/hector/tty", state: "present", focus: false, backend: "term" },
  { id: "model", class: "compute", name: "Local model", path: "/dev/hector/model", state: "present", focus: false, backend: "ollama" },
  { id: "browser", class: "render", name: "Chrome/Edge", path: "/dev/hector/render", state: "unknown", focus: false, backend: "browser" },
  { id: "ssh", class: "net", name: "SSH port", path: "/dev/hector/ssh", state: "present", focus: false, backend: "ssh" },
  { id: "onion", class: "net", name: "Onion port", path: "/dev/hector/onion", state: "unknown", focus: false, backend: "onion" },
];

function load(): HxDevice[] {
  mkdirSync(DIR, { recursive: true });
  if (!existsSync(FILE)) {
    writeFileSync(FILE, JSON.stringify(SEED, null, 2));
    return SEED.map((d) => ({ ...d }));
  }
  try {
    return JSON.parse(readFileSync(FILE, "utf8")) as HxDevice[];
  } catch {
    return SEED.map((d) => ({ ...d }));
  }
}

function save(tree: HxDevice[]) {
  mkdirSync(DIR, { recursive: true });
  writeFileSync(FILE, JSON.stringify(tree, null, 2));
}

export function enumerate() {
  return load();
}

export function getDevice(id: string) {
  return load().find((d) => d.id === id || d.path === id) ?? null;
}

export function setDeviceState(id: string, state: DeviceState) {
  const tree = load();
  const row = tree.find((d) => d.id === id);
  if (!row) return null;
  row.state = state;
  save(tree);
  return row;
}

/** Plug: mark present/started. Surprise-remove holds work on that backend. */
export function plug(id: string, present = true) {
  return setDeviceState(id, present ? "started" : "surprise-removed");
}

export function hidPolicy() {
  return load()
    .filter((d) => d.class === "hid" || d.class === "render")
    .every((d) => d.focus === false);
}

export function busStatus() {
  const tree = load();
  return {
    object: "hector.devices",
    hidNeverFocus: hidPolicy(),
    started: tree.filter((d) => d.state === "started" || d.state === "present").map((d) => d.id),
    tree,
  };
}
