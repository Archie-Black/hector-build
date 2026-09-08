const HUNK_RE = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/;

export class PatchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PatchError";
  }
}

export function applyUnifiedDiff(original: string, diffText: string): string {
  const out = original.split("\n");
  if (out.length && out[out.length - 1] === "") out.pop();
  const hunks = parseHunks(diffText);
  if (!hunks.length) throw new PatchError("No unified-diff hunks found");

  for (const hunk of [...hunks].reverse()) {
    const startHint = Math.max(hunk.oldStart - 1, 0);
    const endHint = startHint + hunk.oldCount;
    let start = startHint;
    let end = endHint;
    const window = out.slice(start, end);
    if (hunk.oldExpect.length && !same(window, hunk.oldExpect)) {
      const found = findWindow(out, hunk.oldExpect, startHint);
      if (!found) throw new PatchError("Hunk context mismatch near line " + hunk.oldStart);
      start = found[0];
      end = found[1];
    }
    out.splice(start, end - start, ...hunk.newLines);
  }

  let text = out.join("\n");
  if (original.endsWith("\n") && !text.endsWith("\n")) text += "\n";
  return text;
}

type Hunk = {
  oldStart: number;
  oldCount: number;
  newLines: string[];
  oldExpect: string[];
};

function parseHunks(diffText: string): Hunk[] {
  const hunks: Hunk[] = [];
  let header: [number, number] | null = null;
  let body: string[] = [];

  const close = () => {
    if (!header) return;
    const [oldStart, oldCount] = header;
    const oldExpect: string[] = [];
    const newLines: string[] = [];
    for (const line of body) {
      if (line.startsWith("\\")) continue;
      const prefix = line[0] ?? " ";
      const rest = line.slice(1);
      if (prefix === " ") {
        oldExpect.push(rest);
        newLines.push(rest);
      } else if (prefix === "-") {
        oldExpect.push(rest);
      } else if (prefix === "+") {
        newLines.push(rest);
      } else {
        oldExpect.push(line);
        newLines.push(line);
      }
    }
    hunks.push({ oldStart, oldCount, newLines, oldExpect });
  };

  for (const line of diffText.split("\n")) {
    if (
      line.startsWith("--- ") ||
      line.startsWith("+++ ") ||
      line.startsWith("diff ") ||
      line.startsWith("index ")
    ) {
      continue;
    }
    const m = HUNK_RE.exec(line);
    if (m) {
      close();
      header = [Number(m[1]), Number(m[2] ?? "1")];
      body = [];
      continue;
    }
    if (header) body.push(line);
  }
  close();
  return hunks;
}

function same(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

function findWindow(hay: string[], needle: string[], hint: number): [number, number] | null {
  const n = needle.length;
  if (!n) return [hint, hint];
  const lo = Math.max(0, hint - 40);
  const hi = Math.min(hay.length, hint + 40);
  for (let i = lo; i <= hi - n; i++) {
    if (same(hay.slice(i, i + n), needle)) return [i, i + n];
  }
  for (let i = 0; i <= hay.length - n; i++) {
    if (same(hay.slice(i, i + n), needle)) return [i, i + n];
  }
  return null;
}
