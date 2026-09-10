/** Fail-closed policy. Deny before allow. Broken rule denies. */

export type PolicyCtx = {
  tool: { name: string };
  intent: string;
  bot: { id: string };
  file: { path: string; name: string; extension: string };
};

export type ActionPolicy = {
  deny: string[];
  allow: string[];
};

function get(ctx: PolicyCtx, path: string): unknown {
  const parts = path.split(".");
  let cur: unknown = ctx;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

function lit(raw: string) {
  const t = raw.trim();
  if (t === "true") return true;
  if (t === "false") return false;
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) return t.slice(1, -1);
  return t;
}

function atom(expr: string, ctx: PolicyCtx): boolean {
  const s = expr.trim();
  if (s === "true") return true;
  if (s === "false") return false;

  const contains = s.match(/^([\w.]+)\.contains\((.+)\)$/);
  if (contains) return String(get(ctx, contains[1]) ?? "").includes(String(lit(contains[2])));

  const starts = s.match(/^([\w.]+)\.startsWith\((.+)\)$/);
  if (starts) return String(get(ctx, starts[1]) ?? "").startsWith(String(lit(starts[2])));

  const matches = s.match(/^([\w.]+)\.matches\((.+)\)$/);
  if (matches) {
    try {
      return new RegExp(String(lit(matches[2])), "i").test(String(get(ctx, matches[1]) ?? ""));
    } catch {
      throw new Error("bad matches()");
    }
  }

  const cmp = s.match(/^([\w.]+)\s*(==|!=)\s*(.+)$/);
  if (cmp) {
    const left = get(ctx, cmp[1]);
    const right = lit(cmp[3]);
    return cmp[2] === "==" ? String(left) === String(right) : String(left) !== String(right);
  }

  if (/^[\w.]+$/.test(s)) return Boolean(get(ctx, s));
  throw new Error(`bad cel: ${s}`);
}

function clause(expr: string, ctx: PolicyCtx): boolean {
  const parts = split(expr, "&&");
  if (parts.length > 1) return parts.every((p) => clause(p, ctx));
  const ors = split(expr, "||");
  if (ors.length > 1) return ors.some((p) => clause(p, ctx));
  const t = expr.trim();
  if (t.startsWith("!")) return !clause(t.slice(1), ctx);
  if (t.startsWith("(") && t.endsWith(")")) return clause(t.slice(1, -1), ctx);
  return atom(t, ctx);
}

function split(expr: string, sep: "&&" | "||") {
  const out: string[] = [];
  let buf = "";
  let depth = 0;
  for (let i = 0; i < expr.length; i++) {
    if (expr[i] === "(") depth++;
    if (expr[i] === ")") depth--;
    if (depth === 0 && expr.slice(i, i + sep.length) === sep) {
      out.push(buf);
      buf = "";
      i += sep.length - 1;
      continue;
    }
    buf += expr[i];
  }
  if (out.length) out.push(buf);
  return out.length ? out : [expr];
}

export function evalCel(expr: string, ctx: PolicyCtx): { ok: true; value: boolean } | { ok: false } {
  try {
    return { ok: true, value: clause(expr, ctx) };
  } catch {
    return { ok: false };
  }
}

export function decidePolicy(policy: ActionPolicy, ctx: PolicyCtx): "allow" | "deny" {
  if (!policy.allow.length && !policy.deny.length) return "deny";
  for (const rule of policy.deny) {
    const r = evalCel(rule, ctx);
    if (!r.ok || r.value) return "deny";
  }
  for (const rule of policy.allow) {
    const r = evalCel(rule, ctx);
    if (r.ok && r.value) return "allow";
  }
  return "deny";
}

export const DEFAULT_POLICY: ActionPolicy = {
  deny: [
    'file.path.contains("..")',
    'tool.name == "bash" && intent.contains("rm -rf")',
  ],
  allow: [
    'tool.name == "list_files"',
    'tool.name == "list_dir"',
    'tool.name == "glob_files"',
    'tool.name == "grep_files"',
    'tool.name == "grep"',
    'tool.name == "lattice_search"',
    'tool.name == "observe"',
    'tool.name == "read_file"',
    'tool.name == "get_diagnostics"',
    'tool.name == "run_tests"',
    'tool.name == "write_file"',
    'tool.name == "apply_patch"',
    'tool.name == "search_replace"',
    'tool.name.startsWith("cloud_")',
    'tool.name.startsWith("arcade_")',
    'tool.name.startsWith("gcp_")',
    'tool.name == "web_search"',
    'tool.name == "web_fetch"',
    'tool.name == "spawn_subagent"',
    'tool.name.startsWith("horsemen_")',
  ],
};
