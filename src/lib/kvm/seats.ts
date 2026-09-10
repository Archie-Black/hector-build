import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_RETINA, retinaOf, type RetinaMode } from "./retina.ts";
import { describeChord, isSwitchChord, mapKey, type HidKey, type Side } from "./keymap.ts";

export type SeatId = "host" | "darwin" | "hx";

export type Grab = {
  who: string;
  kind: "human" | "agent";
  at: number;
  exclusive: boolean;
};

export type Win = {
  id: string;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  focused: boolean;
};

export type Seat = {
  id: SeatId;
  side: Side;
  label: string;
  grab: Grab | null;
  cursor: { x: number; y: number };
};

export type KvmState = {
  active: SeatId;
  retina: RetinaMode;
  seats: Record<SeatId, Seat>;
  windows: Win[];
  menu: string[];
  dock: string[];
  webconnect: { host: string; port: number; path: string };
};

const FILE = join(process.cwd(), "data/kvm/seats.json");

const EMPTY: KvmState = {
  active: "host",
  retina: retinaOf(DEFAULT_RETINA),
  seats: {
    host: { id: "host", side: "pc", label: "PC", grab: null, cursor: { x: 0.5, y: 0.5 } },
    darwin: { id: "darwin", side: "mac", label: "Darwin", grab: null, cursor: { x: 0.5, y: 0.5 } },
    hx: { id: "hx", side: "pc", label: "Spectral HX", grab: null, cursor: { x: 0.4, y: 0.4 } },
  },
  windows: [
    { id: "finder", title: "Hector Darwin", x: 0.08, y: 0.1, w: 0.62, h: 0.62, focused: true },
    { id: "hx", title: "Spectral HX", x: 0.28, y: 0.22, w: 0.55, h: 0.55, focused: false },
  ],
  menu: ["Hector", "File", "Edit", "View", "Go", "Window", "Help"],
  dock: ["Finder", "HX", "Terminal", "Safari"],
  webconnect: { host: "127.0.0.1", port: 6081, path: "/kvm/darwin" },
};

function load(): KvmState {
  if (!existsSync(FILE)) return structuredClone(EMPTY);
  try {
    const raw = JSON.parse(readFileSync(FILE, "utf8")) as Partial<KvmState>;
    return {
      ...structuredClone(EMPTY),
      ...raw,
      retina: retinaOf(raw.retina?.id),
      seats: { ...EMPTY.seats, ...(raw.seats as KvmState["seats"] | undefined) },
    };
  } catch {
    return structuredClone(EMPTY);
  }
}

let state = load();

function save() {
  mkdirSync(join(process.cwd(), "data/kvm"), { recursive: true });
  writeFileSync(FILE, JSON.stringify(state));
}

export function kvmBoot(mode?: string) {
  state = load();
  state.retina = retinaOf(mode);
  save();
  return kvmStatus();
}

export function kvmStatus() {
  return {
    object: "hector.kvm",
    ...state,
    chord: describeChord(state.seats[state.active].side),
  };
}

const ORDER: SeatId[] = ["host", "darwin", "hx"];

export function kvmSwitch(to?: string) {
  if (to === "host" || to === "darwin" || to === "hx") state.active = to;
  else {
    const i = ORDER.indexOf(state.active);
    state.active = ORDER[(i + 1) % ORDER.length];
  }
  save();
  return kvmStatus();
}

export function kvmGrab(who: string, kind: Grab["kind"], seat?: SeatId, exclusive = false) {
  const id = seat ?? state.active;
  const cur = state.seats[id];
  if (cur.grab && cur.grab.kind === "human" && kind === "agent" && cur.grab.who !== who) {
    return { ...kvmStatus(), note: "human holds the seat — agent shadows" as string };
  }
  state.seats[id].grab = { who, kind, at: Date.now(), exclusive };
  state.active = id;
  save();
  return { ...kvmStatus(), note: "grabbed" as string };
}

export function kvmRelease(who: string, seat?: SeatId) {
  const id = seat ?? state.active;
  if (state.seats[id].grab?.who === who) state.seats[id].grab = null;
  save();
  return kvmStatus();
}

export function kvmPointer(x: number, y: number, seat?: SeatId) {
  const id = seat ?? state.active;
  state.seats[id].cursor = {
    x: Math.min(1, Math.max(0, x)),
    y: Math.min(1, Math.max(0, y)),
  };
  save();
  return state.seats[id].cursor;
}

export function kvmKey(ev: HidKey, from?: Side) {
  const seat = state.seats[state.active];
  const mapped = mapKey(from ?? "pc", seat.side, ev);
  if (isSwitchChord(mapped, seat.side) || isSwitchChord(ev, from ?? "pc")) return kvmSwitch();
  return { seat: seat.id, hid: mapped };
}

export function scene() {
  return {
    retina: state.retina,
    active: state.active,
    grab: state.seats[state.active].grab,
    cursor: state.seats[state.active].cursor,
    windows: state.windows,
    menu: state.menu,
    dock: state.dock,
    webconnect: state.webconnect,
    chord: describeChord(state.seats[state.active].side),
  };
}
