import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "node:child_process";

export type WslJob = "status" | "embed" | "packages" | "ollama" | "models" | "vllm" | "onion" | "revoke";

export type WslStatus = {
  embedded: true;
  platform: "windows" | "linux" | "other";
  ready: boolean;
  distro: string;
  via: "wsl" | "native-linux" | "none";
  note: string;
};

export const JOBS: WslJob[] = ["status", "embed", "packages", "ollama", "models", "vllm", "onion", "revoke"];

export function isWslJob(raw: string): raw is WslJob {
  return JOBS.includes(raw as WslJob);
}

/** NTFS path → WSL mount. C:\foo → /mnt/c/foo */
export function winToWsl(path: string) {
  const m = path.replace(/\//g, "\\").match(/^([A-Za-z]):\\(.*)$/);
  if (!m) return path.replace(/\\/g, "/");
  return `/mnt/${m[1]!.toLowerCase()}/${m[2]!.replace(/\\/g, "/")}`;
}

function wslExe() {
  if (process.platform !== "win32") return null;
  const p = join(process.env.SystemRoot || "C:\\Windows", "System32", "wsl.exe");
  return existsSync(p) ? p : "wsl.exe";
}

export function wslStatus(): WslStatus {
  if (process.platform === "linux") {
    return {
      embedded: true,
      platform: "linux",
      ready: true,
      distro: "native",
      via: "native-linux",
      note: "This box is already Linux. WSL is the Windows twin.",
    };
  }
  if (process.platform !== "win32") {
    return {
      embedded: true,
      platform: "other",
      ready: false,
      distro: "",
      via: "none",
      note: "WSL is a Windows install. Native Node is used here.",
    };
  }
  const bin = wslExe();
  if (!bin) {
    return {
      embedded: true,
      platform: "windows",
      ready: false,
      distro: "Ubuntu",
      via: "wsl",
      note: "WSL is not on this PC yet. Install.bat enables it.",
    };
  }
  return {
    embedded: true,
    platform: "windows",
    ready: true,
    distro: "Ubuntu",
    via: "wsl",
    note: "WSL Ubuntu is the install layer. apt, nala, pipx are configured.",
  };
}

function run(cmd: string, args: string[], cwd?: string) {
  return new Promise<{ ok: boolean; out: string }>((resolve) => {
    const child = spawn(cmd, args, { cwd, windowsHide: true });
    let out = "";
    child.stdout?.on("data", (d) => {
      out += String(d);
    });
    child.stderr?.on("data", (d) => {
      out += String(d);
    });
    child.on("error", (err) => resolve({ ok: false, out: err.message }));
    child.on("close", (code) => resolve({ ok: code === 0, out: out.slice(-8000) }));
  });
}

function guestScript() {
  const root = process.cwd();
  if (process.platform === "win32") return `${winToWsl(root)}/packaging/linux/wsl-guest.sh`;
  return join(root, "packaging/linux/wsl-guest.sh");
}

export async function wslRun(job: WslJob) {
  const status = wslStatus();
  if (job === "status") return { ok: true, out: JSON.stringify(status), status };

  if (status.via === "native-linux") {
    const script = guestScript();
    const r = await run("bash", [script, job]);
    return { ...r, status };
  }

  const bin = wslExe();
  if (!bin) return { ok: false, out: "wsl.exe missing", status };

  const script = guestScript();
  const r = await run(bin, ["-d", "Ubuntu", "--", "bash", script, job]);
  return { ...r, status: { ...status, ready: r.ok } };
}
