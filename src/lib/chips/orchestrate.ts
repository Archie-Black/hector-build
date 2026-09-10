import { dieStatus, eepromWrite, executeIsa, mintDie, snapshot, type DieState } from "./die.ts";
import { couple, residueOf, type Emergent, type Residue } from "./substrate.ts";
import { HECTOR_ID, hectorDelegate, type HorsemanId } from "../horsemen/index.ts";

export type ChipReport = {
  die: ReturnType<typeof dieStatus>;
  top: { path: string; amp: number }[];
};

export type Orchestra = {
  lead: "death";
  prompt: string;
  chips: ChipReport[];
  emergent: Emergent[];
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
  const hector = mintDie("death", "hector");
  hector.snap = snapshot(hector);
  for (const [path, body] of Object.entries(files).slice(0, 24)) {
    try {
      eepromWrite(hector, path, body.slice(0, 4000));
    } catch {
      break;
    }
  }
  const riders = RIDERS.map((k) => mintDie(k));
  return { hector, riders };
}

/** Hector mints three dies, they never share RAM, substrate couples them. */
export function orchestrate(prompt: string, files: Record<string, string>): Orchestra {
  const { hector, riders } = bootCard(files);
  executeIsa(hector, prompt.slice(0, 240));

  const residues: Residue[] = [];
  const chips: ChipReport[] = [];

  const views = [
    { die: riders[0], q: prompt },
    { die: riders[1], q: `${prompt} isolate audit policy deny` },
    { die: riders[2], q: `${prompt} test check prove` },
  ];

  for (const v of views) {
    executeIsa(v.die, v.q.slice(0, 240));
    const top = pathsOf(files, v.q);
    residues.push(residueOf(v.die, top));
    chips.push({ die: dieStatus(v.die), top: top.slice(0, 3) });
  }

  residues.unshift(residueOf(hector, pathsOf(files, prompt)));
  chips.unshift({ die: dieStatus(hector), top: pathsOf(files, prompt).slice(0, 3) });

  const emergent = couple(residues);
  const del = hectorDelegate(prompt);
  const peak = emergent[0];
  const knot = peak?.knot;
  const brief = [
    `Hector leads ${riders.length} dies on one card.`,
    peak ? `Emergent ${peak.path}.` : "No coupling yet.",
    knot ? `Knot: commutator=${knot.commutator} Jones=${knot.jones} split=${knot.split}.` : "",
    del.text,
  ]
    .filter(Boolean)
    .join(" ");

  return { lead: "death", prompt: prompt.slice(0, 240), chips, emergent, brief };
}

export function mintSpawn(parent: DieState, task: string) {
  const child = mintDie("spawn", `${parent.spec.id}:spawn`);
  executeIsa(child, task);
  return { parent: dieStatus(parent), child: dieStatus(child) };
}
