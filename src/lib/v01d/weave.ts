/** Workspace connectors. Parts live on desks. Hector wires them into one build. */

import type { AppId } from "@/lib/horsemen/layout";

export type Kind = "code" | "art" | "sound" | "play" | "files" | "web" | "bot" | "note";
export type Dir = "in" | "out";
export type Port = { id: string; dir: Dir; name: string; takes: string };
export type Part = { id: string; desk: number; app: AppId; title: string; kind: Kind; ports: Port[] };
export type Wire = { id: string; from: string; out: string; to: string; inn: string };
export type Step = { n: number; part: string; do: string; path: string };
export type BuildFile = { path: string; body: string };
export type Join = { at: number; order: string[]; note: string; missing: string[]; files: BuildFile[]; steps: Step[] };
export type Weave = { parts: Part[]; wires: Wire[]; join: Join | null };

const KEY = "v01d.weave";

const PORTS: Record<Kind, Port[]> = {
  code: [
    { id: "spec", dir: "in", name: "spec", takes: "spec" },
    { id: "assets", dir: "in", name: "assets", takes: "asset" },
    { id: "build", dir: "out", name: "build", takes: "build" },
  ],
  art: [{ id: "asset", dir: "out", name: "art", takes: "asset" }],
  sound: [{ id: "asset", dir: "out", name: "sound", takes: "asset" }],
  play: [
    { id: "build", dir: "in", name: "build", takes: "build" },
    { id: "assets", dir: "in", name: "assets", takes: "asset" },
    { id: "play", dir: "out", name: "play", takes: "play" },
  ],
  files: [{ id: "files", dir: "out", name: "files", takes: "asset" }],
  web: [{ id: "url", dir: "out", name: "page", takes: "spec" }],
  bot: [
    { id: "build", dir: "in", name: "build", takes: "build" },
    { id: "body", dir: "out", name: "body", takes: "asset" },
  ],
  note: [{ id: "spec", dir: "out", name: "notes", takes: "spec" }],
};

export function kindOf(app: AppId): Kind {
  if (app === "code" || app === "helix" || app === "terminal") return "code";
  if (app === "suite") return "art";
  if (app === "forge") return "sound";
  if (app === "portal") return "play";
  if (app === "files" || app === "programs") return "files";
  if (app === "ghostwalk") return "web";
  if (app === "asimov") return "bot";
  return "note";
}

function empty(): Weave {
  return { parts: [], wires: [], join: null };
}

let live: Weave = empty();

export function loadWeave(): Weave {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const w = JSON.parse(raw) as Weave;
    live = { parts: w.parts || [], wires: w.wires || [], join: w.join || null };
    return live;
  } catch {
    return empty();
  }
}

export function saveWeave(w: Weave) {
  live = w;
  try {
    localStorage.setItem(KEY, JSON.stringify(w));
  } catch {
    /* */
  }
  return live;
}

export function weave() {
  return live;
}

export function pin(desk: number, app: AppId, title: string) {
  const id = `${desk}:${app}`;
  const kind = kindOf(app);
  const part: Part = { id, desk, app, title, kind, ports: PORTS[kind].map((p) => ({ ...p })) };
  const parts = live.parts.filter((p) => p.id !== id).concat(part);
  return saveWeave({ ...live, parts, join: null });
}

export function unpin(id: string) {
  return saveWeave({
    ...live,
    parts: live.parts.filter((p) => p.id !== id),
    wires: live.wires.filter((w) => w.from !== id && w.to !== id),
    join: null,
  });
}

export function pinDesks(spaces: { panes: { app: AppId; title: string; leaving?: boolean }[] }[]) {
  const keep = new Set<string>();
  for (let i = 0; i < spaces.length; i++) {
    for (const p of spaces[i]!.panes) {
      if (p.leaving) continue;
      pin(i, p.app, p.title);
      keep.add(`${i}:${p.app}`);
    }
  }
  const parts = live.parts.filter((p) => keep.has(p.id));
  const wires = live.wires.filter((w) => keep.has(w.from) && keep.has(w.to));
  return saveWeave({ ...live, parts, wires });
}

export function connect(from: string, out: string, to: string, inn: string) {
  if (from === to) return live;
  const a = live.parts.find((p) => p.id === from);
  const b = live.parts.find((p) => p.id === to);
  if (!a || !b) return live;
  const po = a.ports.find((p) => p.id === out && p.dir === "out");
  const pi = b.ports.find((p) => p.id === inn && p.dir === "in");
  if (!po || !pi || po.takes !== pi.takes) return live;
  const id = `${from}.${out}->${to}.${inn}`;
  const wires = live.wires.filter((w) => w.id !== id && !(w.to === to && w.inn === inn)).concat({ id, from, out, to, inn });
  return saveWeave({ ...live, wires, join: null });
}

export function autoWire() {
  const used = new Set(live.wires.map((w) => `${w.to}.${w.inn}`));
  let w = live;
  for (const a of live.parts) {
    for (const po of a.ports.filter((p) => p.dir === "out")) {
      for (const b of live.parts) {
        if (a.id === b.id) continue;
        for (const pi of b.ports.filter((p) => p.dir === "in" && p.takes === po.takes)) {
          if (used.has(`${b.id}.${pi.id}`)) continue;
          w = connect(a.id, po.id, b.id, pi.id);
          used.add(`${b.id}.${pi.id}`);
        }
      }
    }
  }
  return w;
}

export function order(parts = live.parts, wires = live.wires) {
  const ids = parts.map((p) => p.id);
  const deg = new Map(ids.map((id) => [id, 0]));
  const next = new Map(ids.map((id) => [id, [] as string[]]));
  for (const w of wires) {
    deg.set(w.to, (deg.get(w.to) || 0) + 1);
    next.get(w.from)?.push(w.to);
  }
  const q = ids.filter((id) => (deg.get(id) || 0) === 0);
  const out: string[] = [];
  while (q.length) {
    const id = q.shift()!;
    out.push(id);
    for (const n of next.get(id) || []) {
      const d = (deg.get(n) || 1) - 1;
      deg.set(n, d);
      if (d === 0) q.push(n);
    }
  }
  return out.length === ids.length ? out : parts.map((p) => p.id);
}

export function missing(parts = live.parts, wires = live.wires) {
  const hit = new Set(wires.map((w) => `${w.to}.${w.inn}`));
  const need: string[] = [];
  for (const p of parts) {
    for (const port of p.ports.filter((x) => x.dir === "in")) {
      if (!hit.has(`${p.id}.${port.id}`)) need.push(`${p.title} needs ${port.name}`);
    }
  }
  return need;
}

function recipe(seq: string[], gap: string[], desks: number) {
  const stamp = Date.now();
  const root = `/v01d/builds/${stamp}`;
  const titles = seq.map((id) => live.parts.find((p) => p.id === id)?.title).filter(Boolean) as string[];
  const steps: Step[] = seq.map((id, i) => {
    const p = live.parts.find((x) => x.id === id);
    const title = p?.title || id;
    const kind = p?.kind || "note";
    const path = `${root}/${String(i + 1).padStart(2, "0")}-${kind}.md`;
    const work =
      kind === "code"
        ? "Spectral HX compiles this part."
        : kind === "art"
          ? "Genesis HX drops art into assets."
          : kind === "sound"
            ? "Forge seals the bounce."
            : kind === "play"
              ? "Portal 00:13 plays the focused title."
              : kind === "bot"
                ? "Asimov 01 runs the body."
                : kind === "web"
                  ? "GhostWalk opens the page."
                  : "Files land in the build folder.";
    return { n: i + 1, part: title, do: work, path };
  });
  const orderBody = titles.map((t, i) => `${i + 1}. ${t}`).join("\n") || "empty";
  const note = gap.length
    ? `Hector wired ${live.wires.length} connector${live.wires.length === 1 ? "" : "s"} across ${desks} workspace${desks === 1 ? "" : "s"}. Still open: ${gap.join(". ")}.`
    : `Hector joined ${live.parts.length} part${live.parts.length === 1 ? "" : "s"} on ${desks} workspace${desks === 1 ? "" : "s"} into one build. ${titles.join(" → ")}.`;
  const files: BuildFile[] = [
    { path: `${root}/ORDER`, body: `${orderBody}\n` },
    {
      path: `${root}/BUILD.md`,
      body: `# One build\n\n${note}\n\n${steps.map((s) => `${s.n}. ${s.part} — ${s.do} (${s.path})`).join("\n")}\n`,
    },
    ...steps.map((s) => ({
      path: s.path,
      body: `# ${s.part}\n\n${s.do}\n`,
    })),
  ];
  return { at: stamp, order: seq, note, missing: gap, files, steps };
}

export function joinBuild() {
  autoWire();
  const seq = order();
  const gap = missing();
  const desks = new Set(live.parts.map((p) => p.desk + 1)).size;
  return saveWeave({ ...live, join: recipe(seq, gap, desks) });
}

export function seams() {
  return live.wires.map((w) => {
    const a = live.parts.find((p) => p.id === w.from);
    const b = live.parts.find((p) => p.id === w.to);
    return {
      id: w.id,
      from: a?.desk ?? 0,
      to: b?.desk ?? 0,
      label: `${a?.title || "part"} → ${b?.title || "part"}`,
    };
  });
}

export function wantsJoin(text: string) {
  return /\b(join|combine|wire|connect).{0,24}\b(workspace|desk|build|part|face|hex)\b/i.test(text) || /\b(one build|join the (ball|faces|desks))\b/i.test(text);
}

export function sayJoin() {
  const j = live.join || joinBuild().join;
  return j?.note || "Put work on more than one workspace. Hector will wire the parts.";
}
