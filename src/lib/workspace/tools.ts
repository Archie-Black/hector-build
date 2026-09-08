import { applyUnifiedDiff, PatchError } from "./patch";
import { grepFiles, globFiles, listFilePaths } from "./search";
import { executeLattice } from "@/lib/geometry/lattice";
import { runWorkspaceTests } from "./run-tests";
import { normalizePath, pathAllowed } from "./acl";
import type { AgentTodo, ForgeMode, ToolTrace } from "./types";

const WRITE_MODES: ForgeMode[] = ["patch", "swarm"];

export type ToolResult = {
  files: Record<string, string>;
  trace: ToolTrace;
  payload: unknown;
  todos?: AgentTodo[];
  plan?: string;
};

function ok(
  files: Record<string, string>,
  name: string,
  payload: unknown,
  detail: string,
  extra?: Partial<ToolResult>,
): ToolResult {
  return { files, trace: { name, ok: true, detail }, payload, ...extra };
}

function refuse(files: Record<string, string>, name: string, detail: string): ToolResult {
  return { files, trace: { name, ok: false, detail }, payload: { error: detail } };
}

export function executeTool(
  name: string,
  args: Record<string, unknown>,
  files: Record<string, string>,
  mode: ForgeMode,
): ToolResult {
  switch (name) {
    case "list_files":
    case "list_dir":
      return ok(files, name, listFilePaths(files), "listed workspace");
    case "glob_files": {
      const pattern = String(args.pattern ?? "*");
      const found = globFiles(files, pattern);
      return ok(files, name, found, `${found.length} match(es) for ${pattern}`);
    }
    case "grep_files":
    case "grep": {
      const query = String(args.query ?? args.pattern ?? "");
      const hits = grepFiles(files, query, Boolean(args.regex));
      return ok(files, name, hits, `${hits.length} hit(s)`);
    }
    case "lattice_search": {
      const query = String(args.query ?? "");
      const found = executeLattice(files, query, 8);
      const payload = found.hits.map((h) => ({
        path: h.path,
        offset: h.offset,
        score: Number(h.score.toFixed(4)),
        text: h.text.slice(0, 280),
      }));
      return ok(files, name, payload, `${payload.length} lattice hit(s)`);
    }
    case "read_file": {
      const path = normalizePath(String(args.path ?? ""));
      const content = files[path];
      if (content === undefined) return refuse(files, name, `Missing file: ${path}`);
      const offset = Number(args.offset ?? 0);
      const limit = Number(args.limit ?? 0);
      const lines = content.split("\n");
      const slice = limit > 0 ? lines.slice(offset, offset + limit) : lines.slice(offset);
      return ok(files, name, { path, content: slice.join("\n") }, path);
    }
    case "write_file": {
      if (!WRITE_MODES.includes(mode)) return refuse(files, name, "Writes refused in this mode");
      const path = normalizePath(String(args.path ?? ""));
      if (!pathAllowed(path)) return refuse(files, name, "Path outside workspace ACL");
      const content = String(args.content ?? "");
      return ok({ ...files, [path]: content }, name, { path, bytes: content.length }, `wrote ${path}`);
    }
    case "apply_patch": {
      if (!WRITE_MODES.includes(mode)) return refuse(files, name, "Patches refused in this mode");
      const path = normalizePath(String(args.path ?? ""));
      if (!pathAllowed(path) && files[path] === undefined) return refuse(files, name, "Path outside workspace ACL");
      const diff = String(args.diff ?? "");
      const original = files[path];
      if (original === undefined) return refuse(files, name, `Missing file: ${path}`);
      try {
        const updated = applyUnifiedDiff(original, diff);
        return ok({ ...files, [path]: updated }, name, { path }, `patched ${path}`);
      } catch (error) {
        const msg = error instanceof PatchError ? error.message : String(error);
        return refuse(files, name, msg);
      }
    }
    case "search_replace": {
      if (!WRITE_MODES.includes(mode)) return refuse(files, name, "Edits refused in this mode");
      const path = normalizePath(String(args.path ?? ""));
      if (!pathAllowed(path) && files[path] === undefined) return refuse(files, name, "Path outside workspace ACL");
      const oldText = String(args.old_string ?? args.old ?? "");
      const nextText = String(args.new_string ?? args.new ?? "");
      const original = files[path];
      if (original === undefined) return refuse(files, name, `Missing file: ${path}`);
      if (!oldText || !original.includes(oldText)) {
        const near = executeLattice({ [path]: original }, oldText, 2).hits[0];
        const hint = near ? ` Nearest chunk @${near.offset}: ${near.text.slice(0, 80)}` : "";
        return refuse(files, name, "old_string not found." + hint);
      }
      const updated = original.replace(oldText, nextText);
      return ok({ ...files, [path]: updated }, name, { path }, `replaced in ${path}`);
    }
    case "run_tests": {
      const tests = runWorkspaceTests(files);
      const failed = tests.filter((t) => !t.pass).length;
      return ok(files, name, tests, `${tests.length - failed}/${tests.length} passing`);
    }
    case "todo_write": {
      const raw = Array.isArray(args.todos) ? args.todos : [];
      const todos: AgentTodo[] = raw.map((item, i) => {
        const t = item as Record<string, string>;
        return {
          id: String(t.id ?? i),
          content: String(t.content ?? t.title ?? "task"),
          status: t.status === "done" || t.status === "in_progress" ? t.status : "pending",
        };
      });
      return ok(files, name, todos, `${todos.length} task(s)`, { todos });
    }
    case "enter_plan_mode":
      return ok(files, name, { mode: "plan" }, "plan mode");
    case "exit_plan_mode": {
      const plan = String(args.plan ?? args.summary ?? "");
      return ok(files, name, { plan }, "plan ready", { plan });
    }
    case "bash": {
      const command = String(args.command ?? "").trim();
      if (!command) return refuse(files, name, "Empty command");
      if (/rm\s|sudo|curl\s|wget|chmod|mkfs|dd\s|:()/.test(command)) {
        return refuse(files, name, "Command blocked in the sandbox.");
      }
      if (command === "ls" || command.startsWith("ls ")) {
        return ok(files, name, listFilePaths(files), command);
      }
      if (command.startsWith("cat ")) {
        const path = command.slice(4).trim();
        if (files[path] === undefined) return refuse(files, name, `Missing ${path}`);
        return ok(files, name, files[path].slice(0, 4000), command);
      }
      return refuse(files, name, "Sandbox allows ls and cat on the granted workspace only.");
    }
    default:
      return refuse(files, name, `Unknown tool ${name}`);
  }
}

export function diffsFrom(before: Record<string, string>, after: Record<string, string>) {
  const paths = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...paths]
    .filter((p) => before[p] !== after[p])
    .map((path) => ({ path, before: before[path] ?? "", after: after[path] ?? "" }));
}
