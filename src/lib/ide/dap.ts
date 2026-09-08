export type DapEvent = {
  seq: number;
  type: "event" | "response";
  event?: string;
  command?: string;
  body?: Record<string, unknown>;
};

export type DapFrame = { id: number; name: string; path: string; line: number };
export type DapVar = { name: string; value: string; type: string };

export type DapSession = {
  adapter: "node" | "python" | "workspace";
  live: boolean;
  stopped: boolean;
  reason: string;
  stack: DapFrame[];
  vars: DapVar[];
  output: string[];
};

export function pickAdapter(path: string): DapSession["adapter"] {
  if (/\.(m?js|cjs|ts|tsx)$/.test(path)) return "node";
  if (path.endsWith(".py")) return "python";
  return "workspace";
}

/** Workspace DAP: step the test runner, stop on breakpoints. LIVE for in-app files. */
export function workspaceLaunch(
  files: Record<string, string>,
  breakpoints: Record<string, number[]>,
  tests: { name: string; pass: boolean; detail: string }[],
): DapSession {
  const hits: DapFrame[] = [];
  for (const [path, lines] of Object.entries(breakpoints)) {
    if (!files[path] || !lines.length) continue;
    for (const line of lines) {
      hits.push({ id: hits.length, name: path.split("/").pop() ?? path, path, line });
    }
  }
  const vars: DapVar[] = tests.slice(-8).map((t) => ({
    name: t.name,
    value: t.pass ? "pass" : "fail",
    type: "check",
  }));
  const stopped = hits.length > 0;
  return {
    adapter: "workspace",
    live: true,
    stopped,
    reason: stopped ? "breakpoint" : "complete",
    stack: stopped ? hits : [{ id: 0, name: "(workspace)", path: Object.keys(files)[0] ?? "", line: 1 }],
    vars,
    output: [
      "DAP workspace adapter LIVE",
      stopped ? `stopped · ${hits.length} breakpoint(s)` : "ran through",
    ],
  };
}

export function dapContinue(session: DapSession): DapSession {
  return { ...session, stopped: false, reason: "continued", output: [...session.output, "continue"] };
}

export function dapNext(session: DapSession): DapSession {
  if (!session.stack.length) return session;
  const top = session.stack[0];
  const next = { ...top, line: top.line + 1, id: top.id + 1 };
  return {
    ...session,
    stopped: true,
    reason: "step",
    stack: [next, ...session.stack.slice(1)],
    output: [...session.output, `next ${next.path}:${next.line}`],
  };
}
