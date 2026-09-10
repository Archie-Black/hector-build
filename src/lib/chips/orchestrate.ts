import { dieStatus, eepromWrite, snapshot, type DieState } from "./die.ts";
import { couple, residueOf, type Emergent, type Residue } from "./substrate.ts";
import { type HorsemanId } from "../horsemen/index.ts";
import { cellStatus, entangle, mintCell, mitosis, repair, transcribe, tunnel, type Cell } from "../cells/cell.ts";

export type ChipReport = {
  die: ReturnType<typeof dieStatus>;
  top: { path: string; amp: number }[];
};

export type Orchestra = {
  lead: "death";
  prompt: string;
  chips: ChipReport[];
  emergent: Emergent[];
  tissue: string[][];
  brief: string;
};

const RIDERS: HorsemanId[] = ["conquest", "war", "famine"];

function pathsOf(files: Record<string, string>, query: string) {
  const q = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  return Object.entries(files)
    .map(([path, text]) => {
      const hay = `${path} ${text}`.toLowerCase();
      let amp = 0.04;
      for (const w of q) if (hay.includes(w)) amp += 0.18;
      return { path, amp: Number(amp.toFixed(4)) };
    })
    .sort((a, b) => b.amp - a.amp)
    .slice(0, 8);
}

function bootCard(files: Record<string, string>) {
  const hector = mintCell("death", "hector");
  hector.die.snap = snapshot(hector.die);
  for (const [path, body] of Object.entries(files).slice(0, 24)) {
    try {
      eepromWrite(hector.die, path, body.slice(0, 4000));
    } catch {
      break;
    }
  }
  const riders = RIDERS.map((k) => mintCell(k));
  return { hector, riders };
}

/** Hector's germline mints immortal somatic cells. No die shares RAM. */
export function orchestrate(prompt: string, files: Record<string, string>): Orchestra {
  const { hector, riders } = bootCard(files);
  transcribe(hector, prompt.slice(0, 240));

  const residues: Residue[] = [];
  const chips: ChipReport[] = [];

  const views: { cell: Cell; q: string }[] = [
    { cell: riders[0]!, q: prompt },
    { cell: riders[1]!, q: `${prompt} isolate audit policy deny` },
    { cell: riders[2]!, q: `${prompt} test check prove` },
  ];

  for (const v of views) {
    transcribe(v.cell, v.q.slice(0, 240));
    repair(v.cell);
    tunnel(v.cell, hector);
    entangle(v.cell, hector);
    const top = pathsOf(files, v.q);
    residues.push(residueOf(v.cell.die, top));
    chips.push({ die: cellStatus(v.cell), top: top.slice(0, 3) });
  }

  residues.unshift(residueOf(hector.die, pathsOf(files, prompt)));
  chips.unshift({ die: cellStatus(hector), top: pathsOf(files, prompt).slice(0, 3) });

  const emergent = couple(residues);
  const tissueIds = [
    [hector.die.spec.id, ...hector.entangled],
    ...riders.map((r) => [r.die.spec.id, ...r.entangled]),
  ];
  return { lead: "death", prompt: prompt.slice(0, 240), chips, emergent, tissue: tissueIds, brief: "" };
}

export function mintSpawn(parent: DieState, task: string) {
  const host = mintCell(parent.spec.kind, parent.spec.id);
  host.die = parent;
  const { daughter } = mitosis(host);
  transcribe(daughter, task);
  return { parent: dieStatus(parent), child: dieStatus(daughter.die) };
}
