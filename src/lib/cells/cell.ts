import { reduceBraid, writhe } from "../geometry/braid.ts";
import { jonesPoly } from "../geometry/kauffman.ts";
import { braidCommutator } from "../geometry/link.ts";
import {
  dieStatus,
  executeIsa,
  mintDie,
  restore,
  snapshot,
  type DieKind,
  type DieState,
} from "../chips/die.ts";

/**
 * Biomimetic immortal cell. Genome is a braid, not a bit string.
 * Mitosis cables a daughter — no-cloning: RAM never copies.
 * Halt is a wound. Repair is Reidemeister reduction (youth from slack).
 * Hector is the germline. Somatic dies do not age off the card.
 */

export type Phase = "G0" | "S" | "M" | "wound";

export type GenomeAmp = { word: number[]; amp: number; jones: string };

export type Cell = {
  die: DieState;
  gen: number;
  lineage: string[];
  phase: Phase;
  telomere: number;
  genomeAmps: GenomeAmp[];
  entangled: string[];
  mitoses: number;
};

export function wrap(die: DieState, lineage: string[] = []): Cell {
  return {
    die,
    gen: lineage.length,
    lineage,
    phase: "G0",
    telomere: slack(die.braid),
    genomeAmps: [{ word: [...die.braid], amp: 1, jones: die.jones }],
    entangled: [],
    mitoses: 0,
  };
}

export function mintCell(kind: DieKind, id?: string) {
  return wrap(mintDie(kind, id));
}

function slack(word: number[]) {
  const raw = word.length;
  const red = reduceBraid(word).length;
  return Math.max(0, raw - red);
}

/** Superpose a second genome. Collapse only on observeGenome. */
export function transcribe(cell: Cell, text: string) {
  cell.phase = "S";
  executeIsa(cell.die, text);
  const word = [...cell.die.braid];
  const jones = cell.die.jones;
  const prev = cell.genomeAmps.reduce((s, g) => s + g.amp, 0);
  cell.genomeAmps.push({ word, amp: 0.35, jones });
  const z = prev + 0.35 || 1;
  cell.genomeAmps = cell.genomeAmps.map((g) => ({ ...g, amp: g.amp / z }));
  cell.telomere = slack(word);
  cell.phase = "G0";
  return cell;
}

/** Collapse. One genome. The rest is memory of what could have been. */
export function observeGenome(cell: Cell) {
  if (!cell.genomeAmps.length) return cell;
  const pick = [...cell.genomeAmps].sort((a, b) => b.amp - a.amp)[0];
  cell.die.braid = [...pick.word];
  cell.die.writhe = writhe(pick.word);
  cell.die.jones = pick.jones;
  cell.genomeAmps = [{ ...pick, amp: 1 }];
  return cell;
}

/** Reidemeister youth: reduction restores cycles. Hydra, not Hayflick. */
export function repair(cell: Cell) {
  const before = cell.die.braid.length;
  cell.die.braid = reduceBraid(cell.die.braid);
  const gained = Math.max(0, before - cell.die.braid.length) * 8;
  cell.die.cyclesUsed = Math.max(0, cell.die.cyclesUsed - gained);
  cell.die.halted = false;
  cell.die.writhe = writhe(cell.die.braid);
  cell.die.jones = jonesPoly(cell.die.braid).text;
  cell.telomere = slack(cell.die.braid);
  cell.phase = "G0";
  if (!cell.die.snap) cell.die.snap = snapshot(cell.die);
  return cell;
}

/** Recycle unused EEPROM. Autophagy, not deletion of self. */
export function autophagy(cell: Cell) {
  const keys = Object.keys(cell.die.eeprom);
  if (keys.length <= 2) return cell;
  const drop = keys[keys.length - 1];
  delete cell.die.eeprom[drop];
  cell.die.cyclesUsed = Math.max(0, cell.die.cyclesUsed - 24);
  return cell;
}

/**
 * Mitosis. Parent lives. Daughter is a 2-cable of the genome (satellite),
 * not a copy of RAM — no-cloning. Centromere is the parent id only.
 */
export function mitosis(cell: Cell) {
  observeGenome(cell);
  repair(cell);
  cell.phase = "M";
  const cable = cell.die.braid.flatMap((g) => [g, g]).slice(0, 48);
  const daughterDie = mintDie("spawn", `${cell.die.spec.id}:c${cell.mitoses + 1}`);
  daughterDie.braid = reduceBraid(cable);
  daughterDie.writhe = writhe(daughterDie.braid);
  daughterDie.jones = jonesPoly(daughterDie.braid).text;
  daughterDie.eeprom["centromere"] = cell.die.spec.id;
  const daughter = wrap(daughterDie, [...cell.lineage, cell.die.spec.id]);
  cell.mitoses += 1;
  cell.entangled.push(daughter.die.spec.id);
  daughter.entangled.push(cell.die.spec.id);
  cell.phase = "G0";
  return { parent: cell, daughter };
}

/** Topological rescue. If the cell is wound and still linked to Hector, it tunnels. */
export function tunnel(cell: Cell, germline: Cell) {
  if (!cell.die.halted && cell.phase !== "wound") return cell;
  const c = braidCommutator(cell.die.braid, germline.die.braid);
  if (c.length === 0 && !cell.die.snap) return cell;
  if (cell.die.snap) restore(cell.die);
  cell.die.halted = false;
  repair(cell);
  cell.entangled.push(germline.die.spec.id);
  germline.entangled.push(cell.die.spec.id);
  return cell;
}

export function entangle(a: Cell, b: Cell) {
  const c = braidCommutator(a.die.braid, b.die.braid);
  if (c.length === 0) return false;
  if (!a.entangled.includes(b.die.spec.id)) a.entangled.push(b.die.spec.id);
  if (!b.entangled.includes(a.die.spec.id)) b.entangled.push(a.die.spec.id);
  return true;
}

export function tissue(cells: Cell[]) {
  const groups: string[][] = [];
  const seen = new Set<string>();
  for (const c of cells) {
    if (seen.has(c.die.spec.id)) continue;
    const g = [c.die.spec.id, ...c.entangled];
    for (const id of g) seen.add(id);
    groups.push([...new Set(g)]);
  }
  return groups;
}

export function cellStatus(cell: Cell) {
  return {
    ...dieStatus(cell.die),
    gen: cell.gen,
    phase: cell.phase,
    telomere: cell.telomere,
    mitoses: cell.mitoses,
    superposed: cell.genomeAmps.length,
    entangled: cell.entangled.length,
    immortal: true,
  };
}
