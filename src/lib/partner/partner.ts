/**
 * Autonomous engineering partner. Four pillars. Silent.
 * 1. Repo intelligence  2. Self-heal  3. UI/IaC  4. Team style + review
 */
import { prove, type Proof } from "../workspace/prove.ts";

const IMPORT_RE = /(?:from\s+['"]([^'"]+)['"]|import\s+['"]([^'"]+)['"]|require\(['"]([^'"]+)['"]\))/g;

function resolveImport(from: string, spec: string, paths: string[]) {
  if (!spec.startsWith(".")) return paths.find((p) => p === spec || p.endsWith("/" + spec));
  const dir = from.split("/").slice(0, -1).join("/");
  const joined = `${dir ? dir + "/" : ""}${spec}`.replace(/\/\.\//g, "/").replace(/^\.\//, "");
  const noDot = joined.replace(/(^|\/)\.\//g, "$1");
  const base = noDot.replace(/\/\.$/, "");
  return paths.find(
    (p) =>
      p === base ||
      p === `${base}.ts` ||
      p === `${base}.tsx` ||
      p === `${base}.js` ||
      p.replace(/\.\w+$/, "") === base,
  );
}

export type ArchEdge = { from: string; to: string };

export function importGraph(files: Record<string, string>): ArchEdge[] {
  const paths = Object.keys(files);
  const edges: ArchEdge[] = [];
  for (const from of paths) {
    const text = files[from] ?? "";
    IMPORT_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = IMPORT_RE.exec(text))) {
      const spec = m[1] || m[2] || m[3] || "";
      if (!spec || spec.startsWith("http")) continue;
      const hit = resolveImport(from, spec, paths);
      if (hit) edges.push({ from, to: hit });
    }
  }
  return edges.slice(0, 400);
}

/** Files that break if `path` changes. */
export function impactOf(path: string, files: Record<string, string>) {
  const edges = importGraph(files);
  const out = new Set<string>();
  const walk = (p: string) => {
    for (const e of edges) {
      if (e.to === p && !out.has(e.from)) {
        out.add(e.from);
        walk(e.from);
      }
    }
  };
  walk(path);
  return [...out];
}

export function rememberRepo(files: Record<string, string>, query: string) {
  const q = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const hits = Object.keys(files)
    .map((path) => {
      const text = (files[path] || "").toLowerCase();
      const score = q.reduce((n, w) => n + (text.includes(w) || path.toLowerCase().includes(w) ? 1 : 0), 0);
      return { path, offset: 0, score, text: (files[path] || "").slice(0, 220) };
    })
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
  const impact = hits.slice(0, 3).flatMap((h) => impactOf(h.path, files).slice(0, 4));
  return { hits, impact: [...new Set(impact)] };
}

export function depWatch(files: Record<string, string>) {
  const raw = files["package.json"] || files["pyproject.toml"] || "";
  const risks: { name: string; note: string }[] = [];
  if (/request\b/.test(raw) && /package\.json/.test("package.json") && files["package.json"]?.includes('"request"')) {
    risks.push({ name: "request", note: "deprecated HTTP client" });
  }
  if (/"left-pad"/.test(raw)) risks.push({ name: "left-pad", note: "unmaintained" });
  if (/"moment"/.test(raw)) risks.push({ name: "moment", note: "maintenance mode — prefer Temporal or date-fns" });
  return risks;
}

export function styleOf(files: Record<string, string>) {
  const sample = Object.entries(files)
    .filter(([p]) => /\.(ts|tsx|js|jsx)$/.test(p))
    .map(([, t]) => t)
    .join("\n")
    .slice(0, 20_000);
  const tabs = (sample.match(/^\t/gm) || []).length;
  const spaces = (sample.match(/^  \S/gm) || []).length;
  const single = (sample.match(/'/g) || []).length;
  const double = (sample.match(/"/g) || []).length;
  const semi = (sample.match(/;$/gm) || []).length;
  return {
    indent: tabs > spaces ? "tab" : "2",
    quotes: single >= double ? "single" : "double",
    semi: semi > 4,
  };
}

export function reviewDiffs(diffs: { path: string }[], files: Record<string, string>) {
  const notes: string[] = [];
  const style = styleOf(files);
  notes.push(`Match team style: ${style.indent} indent, ${style.quotes} quotes${style.semi ? ", semicolons" : ""}.`);
  for (const d of diffs.slice(0, 8)) {
    const text = files[d.path] || "";
    if (/password|api[_-]?key|secret/i.test(text) && !/lockbox|vault|redact/i.test(text)) {
      notes.push(`${d.path}: secret-shaped string. Keep it out of the tree.`);
    }
    if (text.split("\n").length > 400) notes.push(`${d.path}: large file. Split if the next change grows it.`);
    const broken = impactOf(d.path, files);
    if (broken.length) notes.push(`${d.path}: ${broken.length} importer(s) feel this change.`);
  }
  return notes.slice(0, 8);
}

export function prSpec(prompt: string, diffs: { path: string }[]) {
  const slug = prompt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "change";
  return {
    branch: `hx/${slug}`,
    title: prompt.slice(0, 72) || "Spectral HX change",
    body: [`Autonomous PR.`, `Files: ${diffs.map((d) => d.path).join(", ") || "none"}.`, `Prove before merge.`].join("\n"),
  };
}

export function iacOf(prompt: string): Record<string, string> {
  if (!/(docker|kubernetes|k8s|compose|aws|terraform)/i.test(prompt)) return {};
  const out: Record<string, string> = {};
  if (/docker|compose/i.test(prompt)) {
    out["docker-compose.yml"] = `services:\n  app:\n    build: .\n    ports:\n      - "8080:8080"\n`;
    out["Dockerfile"] = `FROM node:22-alpine\nWORKDIR /app\nCOPY . .\nCMD ["node","index.js"]\n`;
  }
  if (/k8s|kubernetes/i.test(prompt)) {
    out["k8s/deploy.yaml"] = `apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: hx-app\nspec:\n  replicas: 1\n  selector:\n    matchLabels:\n      app: hx\n  template:\n    metadata:\n      labels:\n        app: hx\n    spec:\n      containers:\n        - name: app\n          image: hx-app:local\n          ports:\n            - containerPort: 8080\n`;
  }
  return out;
}

export function wantsVisual(prompt: string) {
  return /(figma|screenshot|mockup|wireframe|pixel|layout|spacing)/i.test(prompt);
}

export async function healLoop(prompt: string, files: Record<string, string>, max = 3) {
  const traces: { name: string; ok: boolean; detail: string }[] = [];
  let next = { ...files };
  let proof: Proof = prove(next);
  let rounds = 0;
  while (!proof.done && rounds < max) {
    rounds += 1;
    const { synthesizeFiles } = await import("../hector-api/synthesize.ts");
    rounds += 1;
    const extra = iacOf(prompt);
    const gen = synthesizeFiles(`Fix until prove passes. ${proof.note}. Job: ${prompt.slice(0, 400)}`, next);
    next = { ...next, ...gen, ...extra };
    proof = prove(next);
    traces.push({ name: "heal", ok: proof.done, detail: `round ${rounds}: ${proof.note}` });
  }
  return { files: next, proof, traces, rounds };
}
