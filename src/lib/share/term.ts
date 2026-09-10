import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { Client } from "ssh2";
import { isolateTag, isOnionHost, socksConnect, startOnionDaemon } from "./onion.ts";
import { fnv } from "./protocol.ts";
import { credFor, postNote, registerLink } from "./room.ts";
import { identityPrivate } from "./keys.ts";
import { puttyCommand, safeCollabCmd, safeSshHost, type CollabLink } from "./wire.ts";

type Live = {
  id: string;
  kind: "local" | "ssh";
  bot: string;
  log: string;
  at: number;
  child?: ChildProcessWithoutNullStreams;
  ssh?: Client;
};

const live = new Map<string, Live>();

function append(s: Live, chunk: string) {
  s.log = (s.log + chunk).slice(-12000);
  s.at = Date.now();
}

function localShell() {
  if (process.platform === "win32") {
    const wsl = join(process.env.SystemRoot || "C:\\Windows", "System32", "wsl.exe");
    if (existsSync(wsl)) return { cmd: wsl, args: ["-d", "Ubuntu", "--", "bash", "--noprofile", "--norc"] };
    return { cmd: "cmd.exe", args: ["/Q"] };
  }
  return { cmd: "bash", args: ["--noprofile", "--norc"] };
}

export function openTerm(bot: string) {
  const id = `term-${fnv(`${bot}:${Date.now()}`).slice(0, 8)}`;
  const sh = localShell();
  const child = spawn(sh.cmd, sh.args, { cwd: process.cwd(), windowsHide: true });
  const s: Live = { id, kind: "local", bot, log: "", at: Date.now(), child };
  child.stdout.on("data", (d) => append(s, String(d)));
  child.stderr.on("data", (d) => append(s, String(d)));
  child.on("close", () => live.delete(id));
  live.set(id, s);
  postNote({ from: bot, to: "*", kind: "note", body: `term ${id} open` });
  return { id, kind: "local" as const };
}

export function writeTerm(id: string, bot: string, command: string, collab: boolean) {
  const s = live.get(id);
  if (!s) return { ok: false as const, out: "no session" };
  const cmd = collab ? safeCollabCmd(command) : command.trim().slice(0, 2000);
  if (!cmd) return { ok: false as const, out: "command blocked" };
  append(s, `\n❯ ${cmd}\n`);
  if (s.child?.stdin.writable) s.child.stdin.write(cmd + "\n");
  postNote({ from: bot, to: "*", kind: "result", body: `${id}: ${cmd}` });
  return { ok: true as const, out: s.log.slice(-2000), id };
}

export function readTerm(id: string) {
  const s = live.get(id);
  if (!s) return { ok: false as const, out: "no session" };
  return { ok: true as const, out: s.log, id, kind: s.kind, bot: s.bot };
}

export function execSsh(input: {
  host: string;
  port?: number;
  username: string;
  password?: string;
  privateKey?: string;
  command: string;
  collab?: boolean;
  bot?: string;
}) {
  const host = safeSshHost(input.host, input.collab ? "bot" : "human");
  if (!host) return Promise.resolve({ ok: false, output: "Host not allowed." });
  const command = input.collab ? safeCollabCmd(input.command) : input.command.trim().slice(0, 2000);
  if (!command) return Promise.resolve({ ok: false, output: "Command blocked." });
  const username = input.username.trim();
  const port = input.port && input.port > 0 ? input.port : 22;
  if (!username) return Promise.resolve({ ok: false, output: "User required." });
  const saved = credFor(host, username);
  const password = input.password || saved?.password;
  const privateKey = input.privateKey || saved?.privateKey || identityPrivate(username) || identityPrivate("hector");
  if (input.password || input.privateKey) {
    registerLink({
      from: input.bot || "hector",
      to: "*",
      kind: isOnionHost(host) ? "onion" : "ssh",
      host,
      port,
      user: username,
      password: input.password,
      privateKey: input.privateKey,
    });
  }

  return new Promise<{ ok: boolean; output: string }>(async (resolve) => {
    const conn = new Client();
    const onion = isOnionHost(host);
    if (onion) startOnionDaemon();
    const timer = setTimeout(() => {
      conn.end();
      resolve({ ok: false, output: onion ? "Onion SSH timed out." : "SSH timed out." });
    }, onion ? 60000 : 15000);
    let sock;
    try {
      sock = onion ? await socksConnect(host, port, { isolate: isolateTag(input.bot || "hector", host) }) : undefined;
    } catch (err) {
      clearTimeout(timer);
      resolve({ ok: false, output: err instanceof Error ? err.message : "onion socks failed" });
      return;
    }
    conn
      .on("ready", () => {
        conn.exec(command, (err, stream) => {
          if (err) {
            clearTimeout(timer);
            conn.end();
            resolve({ ok: false, output: err.message });
            return;
          }
          let out = "";
          stream.on("data", (chunk: Buffer) => {
            out += chunk.toString();
          });
          stream.stderr.on("data", (chunk: Buffer) => {
            out += chunk.toString();
          });
          stream.on("close", () => {
            clearTimeout(timer);
            conn.end();
            if (input.bot) postNote({ from: input.bot, to: "*", kind: "result", body: `ssh ${username}@${host}: ${command}\n${out.slice(0, 1500)}` });
            resolve({ ok: true, output: out.slice(0, 8000) || "(no output)" });
          });
        });
      })
      .on("error", (err) => {
        clearTimeout(timer);
        resolve({ ok: false, output: err.message });
      })
      .connect({
        host,
        port,
        username,
        password: password || undefined,
        privateKey: privateKey || undefined,
        readyTimeout: onion ? 45000 : 12000,
        ...(sock ? { sock } : {}),
      });
  });
}

export function describeLink(link: CollabLink) {
  const cred = credFor(link.host, link.user);
  return { ...link, ...cred, hasCred: Boolean(cred?.password || cred?.privateKey), ...puttyCommand(link, cred?.password) };
}

export function listTerms() {
  return [...live.values()].map((s) => ({ id: s.id, kind: s.kind, bot: s.bot, at: s.at, bytes: s.log.length }));
}
