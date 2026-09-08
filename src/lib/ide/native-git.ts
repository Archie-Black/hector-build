import { createServerFn } from "@tanstack/react-start";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

function runGit(args: string[], cwd = "/workspace"): Promise<{ ok: boolean; text: string; live: boolean }> {
  return new Promise((resolve) => {
    if (!existsSync("/usr/bin/git") && !existsSync("/usr/local/bin/git")) {
      resolve({ ok: false, text: "STUB native git missing", live: false });
      return;
    }
    const chunks: Buffer[] = [];
    const child = spawn("git", args, { cwd });
    child.stdout.on("data", (d: Buffer) => chunks.push(d));
    child.stderr.on("data", (d: Buffer) => chunks.push(d));
    child.on("exit", (code) => {
      resolve({ ok: code === 0, text: Buffer.concat(chunks).toString("utf8").trim(), live: true });
    });
    child.on("error", () => resolve({ ok: false, text: "STUB git spawn failed", live: false }));
  });
}

export const gitNativeStatus = createServerFn({ method: "POST" }).handler(async () => {
  const r = await runGit(["status", "--porcelain=v1", "-b"]);
  return r;
});

export const gitNativeLog = createServerFn({ method: "POST" }).handler(async () => {
  const r = await runGit(["log", "-12", "--oneline"]);
  return r;
});

export const gitNativeCommit = createServerFn({ method: "POST" })
  .validator((message: string) => String(message || "workspace").slice(0, 200))
  .handler(async ({ data: message }) => {
    await runGit(["add", "-A"]);
    return runGit(["commit", "-m", message, "--allow-empty"]);
  });
