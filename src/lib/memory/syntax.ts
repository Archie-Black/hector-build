/** Syntax: a query language for lattice memory, graph hops, and vector search. */

export type SyntaxQuery = {
  from: string;
  match: string;
  layers: string[];
  hopRel: string | null;
  hopDepth: number;
  k: number;
  minScore: number;
};

const LAYERS = new Set(["working", "episodic", "semantic", "procedural", "constitutional"]);

export function looksLikeSyntax(src: string): boolean {
  return /^(FROM|MATCH|LAYER|HOP|K|WHERE|SYNTAX)\b/i.test(src.trim());
}

export function parseSyntax(src: string): { ok: true; query: SyntaxQuery } | { ok: false; error: string } {
  const text = src.trim();
  if (!text) return { ok: false, error: "Empty Syntax query." };
  const query: SyntaxQuery = {
    from: "lattice",
    match: looksLikeSyntax(text) ? "" : text.replace(/^["']|["']$/g, ""),
    layers: [],
    hopRel: null,
    hopDepth: 0,
    k: 12,
    minScore: 0,
  };
  if (!looksLikeSyntax(text)) return { ok: true, query };

  const lines = text.replace(/\r/g, "").split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
  const blob = lines.join(" ");
  const tokens = blob.match(/"[^"]*"|'[^']*'|\S+/g) ?? [];
  let i = 0;
  while (i < tokens.length) {
    const tok = tokens[i].toUpperCase();
    if (tok === "SYNTAX") {
      i += 1;
      continue;
    }
    if (tok === "FROM" && tokens[i + 1]) {
      query.from = tokens[i + 1].replace(/[;,]/g, "");
      i += 2;
      continue;
    }
    if (tok === "MATCH" && tokens[i + 1]) {
      query.match = tokens[i + 1].replace(/^["']|["']$/g, "");
      i += 2;
      continue;
    }
    if (tok === "LAYER" || tok === "LAYERS") {
      i += 1;
      while (i < tokens.length && !/^(FROM|MATCH|LAYER|HOP|K|WHERE|SYNTAX)$/i.test(tokens[i])) {
        const name = tokens[i].replace(/[;,]/g, "").toLowerCase();
        if (LAYERS.has(name)) query.layers.push(name);
        i += 1;
      }
      continue;
    }
    if (tok === "HOP" && tokens[i + 1]) {
      query.hopRel = tokens[i + 1].replace(/[;,]/g, "");
      i += 2;
      if (tokens[i] && /^\d+$/.test(tokens[i])) {
        query.hopDepth = Number(tokens[i]);
        i += 1;
      } else {
        query.hopDepth = 1;
      }
      continue;
    }
    if (tok === "K" && tokens[i + 1]) {
      query.k = Math.max(1, Math.min(50, Number(tokens[i + 1]) || 12));
      i += 2;
      continue;
    }
    if (tok === "WHERE") {
      i += 1;
      continue;
    }
    if (tok === "SIMILAR" || tok === "SIMILAR>=" || tokens[i] === ">=") {
      const maybe = tokens[i + 1] || tokens[i];
      const n = Number(String(maybe).replace(/[^0-9.]/g, ""));
      if (!Number.isNaN(n)) query.minScore = n;
      i += 2;
      continue;
    }
    i += 1;
  }
  if (!query.match) return { ok: false, error: "Syntax needs MATCH \"text\"." };
  return { ok: true, query };
}

export const SYNTAX_HELP = `FROM lattice
MATCH "tests hello"
LAYER semantic, episodic
HOP Distills 1
K 12`;
