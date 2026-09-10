import { applyUnifiedDiff, PatchError } from "./patch";
import { grepFiles, globFiles, listFilePaths } from "./search";
import { executeLattice } from "@/lib/geometry/lattice";
import { observe, ontologyLine } from "@/lib/geometry/ontology";
import { runWorkspaceTests } from "./run-tests";
import { prove, proofLine } from "./prove";
import { normalizePath, pathAllowed } from "./acl";
import { diagnostics, formatFile, findDefinition, findReferences, renameSymbol } from "@/lib/ide/symbols";
import type { AgentTodo, ForgeMode, ToolTrace } from "./types";
import { gate } from "@/lib/horsemen/gateway.ts";
import { ackNote, ingestInbox, joinPeer, leasePath, listLinks, materializeShare, postNote, registerLink, shareStatus, syncFile } from "@/lib/share/room";
import { describeLink, execSsh, listTerms, openTerm, readTerm, writeTerm } from "@/lib/share/term";
import { isOnionHost, safeSshHost } from "@/lib/share/wire";
import { onionStatus, startOnionDaemon, newNym } from "@/lib/share/onion";
import { authorizeKey, generateIdentity, keyStatus, listIdentities, revokeKey, rotateHostKey, rotateIdentity, settleRotations } from "@/lib/share/keys";

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

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  files: Record<string, string>,
  mode: ForgeMode,
): Promise<ToolResult> {
  const g = gate(name, args, "death");
  if (!g.ok) return refuse(files, name, g.reason);
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
    case "lattice_search":
    case "observe": {
      const query = String(args.query ?? "");
      const found = observe(files, query, 8);
      const payload = {
        geo: ontologyLine(found.phase),
        hits: found.phase.amplitudes.map((h) => ({
          path: h.path,
          offset: h.offset,
          amp: h.amp,
          text: h.text.slice(0, 280),
        })),
      };
      return ok(files, name, payload, `${payload.hits.length} observed · ${payload.geo}`);
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
      const all = Boolean(args.replace_all);
      const updated = replaceInFile(original, oldText, nextText, all) ?? shrinkReplace(original, oldText, nextText, all);
      if (!updated) {
        const near = executeLattice({ [path]: original }, oldText, 2).hits[0];
        const hint = near ? ` Nearest chunk @${near.offset}: ${near.text.slice(0, 80)}` : "";
        return refuse(files, name, "old_string not found." + hint);
      }
      return ok({ ...files, [path]: updated }, name, { path }, `replaced in ${path}`);
    }
    case "get_diagnostics": {
      const lints = diagnostics(files);
      return ok(files, name, lints, `${lints.length} lint(s)`);
    }
    case "read_symbol": {
      const ident = String(args.name ?? args.symbol ?? "");
      const hit = findDefinition(files, ident, String(args.path ?? ""));
      if (!hit) return refuse(files, name, `No definition for ${ident}`);
      const lines = (files[hit.path] ?? "").split("\n");
      const slice = lines.slice(Math.max(0, hit.line - 2), hit.line + 12).join("\n");
      return ok(files, name, { ...hit, body: slice }, `${hit.path}:${hit.line}`);
    }
    case "find_references": {
      const ident = String(args.name ?? args.symbol ?? "");
      const hits = findReferences(files, ident);
      return ok(files, name, hits.slice(0, 40), `${hits.length} ref(s)`);
    }
    case "rename_symbol": {
      if (!WRITE_MODES.includes(mode)) return refuse(files, name, "Rename refused in this mode");
      const from = String(args.from ?? args.name ?? "");
      const to = String(args.to ?? args.next ?? "");
      const next = renameSymbol(files, from, to);
      const changed = Object.keys(next).filter((p) => next[p] !== files[p]).length;
      return ok(next, name, { from, to, files: changed }, `renamed ${from} → ${to} in ${changed} file(s)`);
    }
    case "format_file": {
      if (!WRITE_MODES.includes(mode)) return refuse(files, name, "Format refused in this mode");
      const path = normalizePath(String(args.path ?? ""));
      if (files[path] === undefined) return refuse(files, name, `Missing file: ${path}`);
      const content = formatFile(path, files[path]);
      return ok({ ...files, [path]: content }, name, { path }, `formatted ${path}`);
    }
    case "run_tests": {
      const tests = runWorkspaceTests(files);
      const failed = tests.filter((t) => !t.pass).length;
      return ok(files, name, tests, `${tests.length - failed}/${tests.length} passing`);
    }
    case "prove": {
      const p = prove(files);
      return ok(files, name, p, proofLine(p));
    }
    case "close_job": {
      const p = prove(files);
      if (!p.done) return refuse(files, name, proofLine(p));
      return ok(files, name, p, "HOLD");
    }
    case "share_join": {
      const peer = joinPeer({ name: String(args.name ?? "bot"), kind: args.kind as never, id: args.id ? String(args.id) : undefined });
      return ok(materializeShare(files), name, peer.peer, `joined ${peer.peer.id}`);
    }
    case "share_post": {
      ingestInbox(files);
      const note = postNote({
        from: String(args.from ?? "hector"),
        to: args.to ? String(args.to) : "hector",
        kind: args.kind as "task" | "result" | "note",
        body: String(args.body ?? args.message ?? ""),
      });
      return ok(materializeShare(files), name, note, `posted ${note.id}`);
    }
    case "share_lease": {
      const r = leasePath({ bot: String(args.bot ?? "hector"), path: String(args.path ?? ""), seconds: args.seconds ? Number(args.seconds) : undefined });
      return r.ok ? ok(materializeShare(files), name, r.lease, `leased ${r.lease.path}`) : refuse(files, name, r.reason);
    }
    case "share_sync": {
      const r = syncFile({
        bot: String(args.bot ?? "hector"),
        path: String(args.path ?? ""),
        content: String(args.content ?? ""),
        expect: args.expect ? String(args.expect) : undefined,
      });
      if (!r.ok) return refuse(files, name, r.reason);
      const next = { ...files, [String(args.path)]: String(args.content ?? "") };
      return ok(materializeShare(next), name, r.head, `synced ${r.head.path}`);
    }
    case "share_pull": {
      ingestInbox(files);
      return ok(materializeShare(files), name, { ...shareStatus(), terms: listTerms(), links: listLinks(), onion: onionStatus() }, "share room");
    }
    case "share_term": {
      const session = args.session ? String(args.session) : "";
      if (!session && (args.command === undefined || args.command === "")) {
        const opened = openTerm(String(args.bot ?? "hector"));
        return ok(materializeShare(files), name, opened, `term ${opened.id}`);
      }
      if (args.command && !session) {
        const opened = openTerm(String(args.bot ?? "hector"));
        const r = writeTerm(opened.id, String(args.bot ?? "hector"), String(args.command), true);
        return r.ok ? ok(materializeShare(files), name, r, r.out.slice(-400)) : refuse(files, name, r.out);
      }
      if (String(args.command ?? "") === "" && session) {
        const r = readTerm(session);
        return r.ok ? ok(files, name, r, r.out.slice(-400)) : refuse(files, name, r.out);
      }
      const r = writeTerm(session, String(args.bot ?? "hector"), String(args.command ?? ""), true);
      return r.ok ? ok(files, name, r, r.out.slice(-400)) : refuse(files, name, r.out);
    }
    case "share_ssh": {
      const host = String(args.host ?? "");
      if (!safeSshHost(host, "bot")) return refuse(files, name, "Host not allowed for bots.");
      const result = await execSsh({
        host,
        port: args.port ? Number(args.port) : 22,
        username: String(args.user ?? args.username ?? "hector"),
        password: args.password ? String(args.password) : undefined,
        privateKey: args.key ? String(args.key) : undefined,
        command: String(args.command ?? "uname -a"),
        collab: true,
        bot: String(args.bot ?? "hector"),
      });
      return result.ok ? ok(materializeShare(files), name, { output: result.output }, result.output.slice(0, 400)) : refuse(files, name, result.output);
    }
    case "share_link": {
      const host = String(args.host ?? "127.0.0.1");
      const kind = isOnionHost(host) || args.kind === "onion" ? "onion" : args.kind === "putty" || args.kind === "term" ? args.kind : "ssh";
      if (kind === "onion") startOnionDaemon();
      const link = registerLink({
        from: String(args.from ?? "hector"),
        to: String(args.to ?? "*"),
        kind,
        host,
        port: args.port ? Number(args.port) : 22,
        user: String(args.user ?? "hector"),
        session: args.session ? String(args.session) : undefined,
        password: args.password ? String(args.password) : undefined,
        privateKey: args.key || args.privateKey ? String(args.key ?? args.privateKey) : undefined,
      });
      return ok(materializeShare(files), name, describeLink(link), `${kind} ${link.user}@${link.host}`);
    }
    case "share_keys": {
      const action = String(args.action ?? "list");
      if (action === "generate") {
        const id = generateIdentity(String(args.user ?? "hector"), args.comment ? String(args.comment) : undefined);
        return ok(files, name, id, id.fingerprint);
      }
      if (action === "authorize") {
        const fp = authorizeKey(String(args.public ?? ""), String(args.user ?? "hector"));
        return fp ? ok(files, name, { fingerprint: fp }, fp) : refuse(files, name, "bad public key");
      }
      if (action === "revoke") {
        const hit = revokeKey(String(args.fingerprint ?? ""));
        return hit ? ok(files, name, { revoked: true }, "revoked") : refuse(files, name, "unknown key");
      }
      if (action === "rotate") {
        const r = rotateIdentity(String(args.user ?? "hector"));
        void newNym();
        return ok(files, name, r, r.current.fingerprint);
      }
      if (action === "settle") return ok(files, name, { settled: settleRotations() }, "settled");
      if (action === "rotate-host") {
        const r = rotateHostKey();
        void newNym();
        return ok(files, name, r, r.current);
      }
      if (action === "newnym") {
        const r = await newNym();
        return r.ok ? ok(files, name, r, r.note) : refuse(files, name, r.note);
      }
      return ok(files, name, { ...keyStatus(), identities: listIdentities() }, "ssh keys");
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

function replaceInFile(src: string, oldText: string, nextText: string, all: boolean): string | null {
  if (!oldText) return null;
  if (src.includes(oldText)) return all ? src.split(oldText).join(nextText) : src.replace(oldText, nextText);
  const lines = src.split("\n");
  const oldLines = oldText.replace(/\r\n/g, "\n").split("\n");
  const nextLines = nextText.replace(/\r\n/g, "\n").split("\n");
  let hit = false;
  const copy = [...lines];
  for (let i = 0; i <= copy.length - oldLines.length; i++) {
    if (oldLines.every((l, j) => copy[i + j].trim() === l.trim())) {
      copy.splice(i, oldLines.length, ...nextLines);
      hit = true;
      if (!all) return copy.join("\n");
      i += nextLines.length - 1;
    }
  }
  return hit ? copy.join("\n") : null;
}

function shrinkReplace(src: string, oldText: string, nextText: string, all: boolean): string | null {
  const lines = oldText.replace(/\r\n/g, "\n").split("\n");
  if (lines.length < 3) return null;
  for (let drop = 1; drop <= lines.length - 2; drop++) {
    const head = lines.slice(0, lines.length - drop).join("\n");
    const tail = lines.slice(drop).join("\n");
    const hit = replaceInFile(src, head, nextText, all) ?? replaceInFile(src, tail, nextText, all);
    if (hit) return hit;
  }
  return null;
}
