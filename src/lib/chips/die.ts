import { braidOfText, burauDet, reduceBraid, threeColorable, writhe } from "../geometry/braid.ts";
import { jonesPoly } from "../geometry/kauffman.ts";
import { contentEmbed, DIM_CONTENT } from "../geometry/embed.ts";
import { gate } from "../horsemen/gateway.ts";
import type { HorsemanId } from "../horsemen/roster.ts";

/** One agent as an EMV-style secure element: own CPU, RAM, EEPROM, FS. */

export type DieKind = HorsemanId | "spawn";

export type DieSpec = {
  id: string;
  kind: DieKind;
  cpuCycles: number;
  ramWords: number;
  eepromBytes: number;
};

export type DieState = {
  spec: DieSpec;
  cyclesUsed: number;
  ram: Float32Array;
  eeprom: Record<string, string>;
  ip: number;
  braid: number[];
  writhe: number;
  det: number;
  jones: string;
  color3: boolean;
  halted: boolean;
  snap: DieSnap | null;
};

export type DieSnap = {
  cyclesUsed: number;
  ram: Float32Array;
  eeprom: Record<string, string>;
  braid: number[];
};

export const CARD_BUDGET: Record<DieKind, Omit<DieSpec, "id" | "kind">> = {
  death: { cpuCycles: 64_000, ramWords: DIM_CONTENT, eepromBytes: 512_000 },
  conquest: { cpuCycles: 24_000, ramWords: DIM_CONTENT, eepromBytes: 128_000 },
  war: { cpuCycles: 16_000, ramWords: DIM_CONTENT, eepromBytes: 64_000 },
  famine: { cpuCycles: 16_000, ramWords: DIM_CONTENT, eepromBytes: 64_000 },
  spawn: { cpuCycles: 8_000, ramWords: DIM_CONTENT, eepromBytes: 16_000 },
};

function bytesOf(files: Record<string, string>) {
  return Object.values(files).reduce((n, s) => n + s.length, 0);
}

export function mintDie(kind: DieKind, id?: string): DieState {
  const budget = CARD_BUDGET[kind];
  return {
    spec: { id: id ?? `${kind}-${Math.random().toString(36).slice(2, 8)}`, kind, ...budget },
    cyclesUsed: 0,
    ram: new Float32Array(budget.ramWords),
    eeprom: {},
    ip: 0,
    braid: [],
    writhe: 0,
    det: 1,
    jones: "1",
    color3: false,
    halted: false,
    snap: null,
  };
}

export function snapshot(die: DieState): DieSnap {
  return {
    cyclesUsed: die.cyclesUsed,
    ram: new Float32Array(die.ram),
    eeprom: { ...die.eeprom },
    braid: [...die.braid],
  };
}

export function restore(die: DieState) {
  if (!die.snap) return die;
  die.cyclesUsed = die.snap.cyclesUsed;
  die.ram = new Float32Array(die.snap.ram);
  die.eeprom = { ...die.snap.eeprom };
  die.braid = [...die.snap.braid];
  die.writhe = writhe(die.braid);
  die.det = burauDet(die.braid);
  die.jones = jonesPoly(die.braid).text;
  die.color3 = threeColorable(die.det);
  die.halted = false;
  return die;
}

function spend(die: DieState, n: number) {
  die.cyclesUsed += n;
  if (die.cyclesUsed > die.spec.cpuCycles) {
    die.halted = true;
    throw new Error(`${die.spec.id} cpu halt`);
  }
}

/** Braid generators are the ISA. Each char of work is a crossing, not a bit. */
export function executeIsa(die: DieState, text: string) {
  if (die.halted) throw new Error(`${die.spec.id} halted`);
  const word = reduceBraid(braidOfText(text.slice(0, 4000)));
  spend(die, word.length * 3);
  die.braid = reduceBraid([...die.braid, ...word]);
  die.writhe = writhe(die.braid);
  die.det = burauDet(die.braid);
  die.jones = jonesPoly(die.braid).text;
  die.color3 = threeColorable(die.det);
  die.ip += word.length;
  const vec = contentEmbed(text);
  for (let i = 0; i < die.ram.length; i++) {
    die.ram[i] = die.ram[i] * 0.72 + (vec[i] ?? 0) * 0.28;
  }
  return die;
}

export function eepromWrite(die: DieState, path: string, body: string) {
  const next = { ...die.eeprom, [path]: body };
  if (bytesOf(next) > die.spec.eepromBytes) throw new Error(`${die.spec.id} eeprom full`);
  const g = gate("write_file", { path }, die.spec.kind === "spawn" ? "death" : die.spec.kind);
  if (!g.ok) throw new Error(g.reason);
  spend(die, 40 + Math.ceil(body.length / 32));
  die.eeprom = next;
}

export function eepromRead(die: DieState, path: string) {
  spend(die, 8);
  return die.eeprom[path];
}

export function ns(die: DieState, path: string) {
  return `chip://${die.spec.id}/${path.replace(/^\/+/, "")}`;
}

export function dieStatus(die: DieState) {
  return {
    id: die.spec.id,
    kind: die.spec.kind,
    cpu: { used: die.cyclesUsed, cap: die.spec.cpuCycles },
    ram: { words: die.ram.length, l2: Math.hypot(...Array.from(die.ram.subarray(0, 32))) },
    eeprom: { files: Object.keys(die.eeprom).length, bytes: bytesOf(die.eeprom), cap: die.spec.eepromBytes },
    writhe: die.writhe,
    det: die.det,
    jones: die.jones,
    color3: die.color3,
    crossings: die.braid.length,
    halted: die.halted,
  };
}
