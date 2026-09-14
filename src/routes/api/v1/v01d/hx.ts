import { execFile, spawn } from "node:child_process";
import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { promisify } from "node:util";
import { createFileRoute } from "@tanstack/react-router";

const run = promisify(execFile);

function codiumBin() {
  const hits = [
    process.env.CODIUM,
    "/opt/vscodium/bin/codium",
    join(process.env.HECTOR_PREFIX || "", "runtime/vscodium/bin/codium"),
    join(homedir(), ".local/share/hector-build/runtime/vscodium/bin/codium"),
    join(homedir(), ".local/bin/codium"),
    "/usr/bin/codium",
    "/usr/local/bin/codium",
  ].filter(Boolean) as string[];
  return hits.find((p) => existsSync(p)) || "";
}

function repo() {
  const cwd = process.cwd();
  if (existsSync(join(cwd, ".git"))) return cwd;
  const prefix = process.env.HECTOR_PREFIX;
  if (prefix && existsSync(join(prefix, ".git"))) return prefix;
  return cwd;
}

function desk() {
  const root = join(process.env.HECTOR_PREFIX || homedir(), "v01d", "hx");
  mkdirSync(root, { recursive: true });
  return root;
}

export const Route = createFileRoute("/api/v1/v01d/hx")({
  server: {
    handlers: {
      GET: async () => {
        const cwd = repo();
        let git = "git not on this folder";
        try {
          const { stdout } = await run("git", ["status", "--porcelain", "-b"], { cwd, timeout: 4000 });
          git = stdout.trim() || "clean";
        } catch {
          /* */
        }
        return Response.json({ ok: true, git, home: desk(), codium: codiumBin() || "" });
      },
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as {
          act?: string;
          file?: string;
          body?: string;
          cmd?: string;
        };
        const act = body.act || "save";
        const home = desk();
        if (act === "save") {
          const name = (body.file || "program.ts").replace(/[^a-zA-Z0-9._/-]/g, "");
          const dest = join(home, name);
          mkdirSync(dirname(dest), { recursive: true });
          writeFileSync(dest, body.body || "", "utf8");
          return Response.json({ ok: true, note: `Saved ${name}.`, path: dest });
        }
        if (act === "git") {
          const cwd = repo();
          const sub = (body.cmd || "status").split(/\s+/).filter(Boolean);
          const allow = new Set(["status", "diff", "log", "add", "commit", "push", "pull", "branch"]);
          if (!allow.has(sub[0] || "")) return Response.json({ ok: false, note: "Git stays on the safe list." }, { status: 422 });
          try {
            const { stdout, stderr } = await run("git", sub, { cwd, timeout: 20000 });
            return Response.json({ ok: true, note: (stdout || stderr).trim() || "done" });
          } catch (err) {
            const msg = err && typeof err === "object" && "stderr" in err ? String((err as { stderr?: string }).stderr || "") : "";
            return Response.json({ ok: false, note: msg.trim() || "git failed" }, { status: 422 });
          }
        }
        if (act === "codium") {
          const bin = codiumBin();
          if (!bin) return Response.json({ ok: false, note: "VSCodium is not on this machine yet. packaging/linux/install-vscodium.sh" }, { status: 424 });
          const cwd = repo();
          const vsSrc = join(cwd, "packaging/hx/codium/.vscode");
          if (existsSync(vsSrc)) {
            cpSync(vsSrc, join(cwd, ".vscode"), { recursive: true });
            cpSync(vsSrc, join(home, ".vscode"), { recursive: true });
          }
          spawn(bin, [cwd, "--new-window"], { detached: true, stdio: "ignore" }).unref();
          return Response.json({ ok: true, note: `Codium ${cwd}`, path: bin });
        }
        if (act === "run") {
          const name = (body.file || "program.ts").replace(/[^a-zA-Z0-9._/-]/g, "");
          const dest = join(home, name);
          if (!existsSync(dest)) return Response.json({ ok: false, note: "Save first." }, { status: 422 });
          try {
            const bin = dest.endsWith(".py") ? "python3" : dest.endsWith(".sh") ? "bash" : "node";
            const { stdout, stderr } = await run(bin, [dest], { timeout: 15000 });
            return Response.json({ ok: true, note: (stdout || stderr).trim() || "ran" });
          } catch (err) {
            const msg = err && typeof err === "object" && "stderr" in err ? String((err as { stderr?: string }).stderr || "") : "";
            return Response.json({ ok: false, note: msg.trim() || "run failed" }, { status: 422 });
          }
        }
        return Response.json({ ok: false, note: "Unknown act." }, { status: 422 });
      },
    },
  },
});
