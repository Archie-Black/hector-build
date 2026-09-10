import { createServerFn } from "@tanstack/react-start";
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { promisify } from "node:util";

const exec = promisify(execFile);
const ROOT = process.cwd();
const FNM = join(ROOT, "runtime/fnm/fnm");
const FNM_DIR = join(ROOT, "runtime/fnm-root");
const BUNDLED = join(ROOT, "runtime/node/bin/node");

export type NodeRuntime = {
  current: string;
  versions: string[];
  tool: "fnm" | "bundled" | "system";
  live: boolean;
  pin?: string;
};

function run(args: string[], timeout = 120_000) {
  return exec(FNM, args, {
    timeout,
    env: { ...process.env, FNM_DIR },
  });
}

async function currentNode(): Promise<{ ver: string; tool: NodeRuntime["tool"]; live: boolean }> {
  if (existsSync(FNM)) {
    try {
      const { stdout } = await run(["current"]);
      const ver = stdout.trim() || "";
      if (ver && ver !== "none" && ver !== "system") return { ver: ver.replace(/^v/, ""), tool: "fnm", live: true };
    } catch {
      /* fall through */
    }
  }
  if (existsSync(BUNDLED)) {
    try {
      const { stdout } = await exec(BUNDLED, ["-v"]);
      return { ver: stdout.trim().replace(/^v/, ""), tool: "bundled", live: true };
    } catch {
      /* fall through */
    }
  }
  try {
    const { stdout } = await exec("node", ["-v"]);
    return { ver: stdout.trim().replace(/^v/, ""), tool: "system", live: true };
  } catch {
    return { ver: "", tool: "system", live: false };
  }
}

async function listVersions(): Promise<string[]> {
  if (!existsSync(FNM)) return [];
  try {
    const { stdout } = await run(["list"]);
    return [...new Set(
      stdout
        .split("\n")
        .map((l) => l.match(/v?(\d+\.\d+\.\d+)/)?.[1] ?? "")
        .filter(Boolean),
    )];
  } catch {
    return [];
  }
}

export const nodeRuntimeStatus = createServerFn({ method: "POST" }).handler(async (): Promise<NodeRuntime> => {
  const cur = await currentNode();
  const versions = await listVersions();
  if (cur.ver && !versions.includes(cur.ver)) versions.unshift(cur.ver);
  return { current: cur.ver, versions, tool: cur.tool, live: cur.live };
});

export const nodeRuntimeUse = createServerFn({ method: "POST" })
  .validator((version: string) => String(version || "22").replace(/^v/, "").slice(0, 24))
  .handler(async ({ data: version }): Promise<NodeRuntime & { log: string }> => {
    if (!existsSync(FNM)) {
      const cur = await currentNode();
      return { current: cur.ver, versions: cur.ver ? [cur.ver] : [], tool: cur.tool, live: cur.live, pin: version, log: "STUB fnm missing" };
    }
    const { stdout, stderr } = await run(["install", version, "--fnm-dir", FNM_DIR]);
    await run(["default", version, "--fnm-dir", FNM_DIR]).catch(() => undefined);
    await run(["use", version, "--install-if-missing", "--fnm-dir", FNM_DIR]).catch(() => undefined);
    const cur = await currentNode();
    const versions = await listVersions();
    return {
      current: cur.ver,
      versions,
      tool: cur.tool,
      live: cur.live,
      pin: version,
      log: (stdout + "\n" + stderr).trim().slice(0, 400),
    };
  });

