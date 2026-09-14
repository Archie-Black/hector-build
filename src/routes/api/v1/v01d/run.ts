import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { createFileRoute } from "@tanstack/react-router";
import { hxExecCmd } from "@/lib/v01d/hx-exec";
import { readIntent } from "@/lib/v01d/intent";
import { carry } from "@/lib/v01d/netguard";
import { PBX } from "@/lib/v01d/pbx-bridge";
import { findProg } from "@/lib/v01d/programs";
import { admit } from "@/lib/v01d/range";
import { plan } from "@/lib/v01d/runtime";

function fire(path: string, args: string[] = []) {
  if (!path || path.startsWith("v01d://") || path.startsWith("http") || path.includes("wine-staging")) {
    return false;
  }
  if (!existsSync(path)) return false;
  try {
    spawn(path, args, { detached: true, stdio: "ignore" }).unref();
    return true;
  } catch {
    return false;
  }
}

function fireHx(folder: string) {
  const cmd = hxExecCmd({ folder });
  const script = join(process.cwd(), PBX.script);
  if (!existsSync(script)) return false;
  try {
    spawn(cmd[0]!, [script, folder], { detached: true, stdio: "ignore" }).unref();
    return true;
  } catch {
    return false;
  }
}

export const Route = createFileRoute("/api/v1/v01d/run")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as { file?: string; prompt?: string; args?: string[] };
        const file = body.file || "";
        const prompt = body.prompt || "";
        const intent = readIntent({ tool: file, prompt });
        if (intent.stance === "deny") return Response.json({ ok: false, intent }, { status: 403 });
        if (intent.stance === "range") return Response.json({ ok: true, intent, range: admit(prompt) });
        const wire = carry({ to: "local", tool: file, prompt });
        if (!wire.ok) return Response.json({ ok: false, intent, wire }, { status: 403 });
        if (/^https?:\/\//i.test(file)) {
          return Response.json({
            ok: true,
            intent,
            walk: file,
            launch: { ok: true, how: "ghostwalk", note: "Opening in GhostWalk.", path: file },
            wire,
          });
        }
        const launch = plan(file);
        const prog = findProg(file);
        const pbx = Boolean(prog && (prog.bin === "codium" || prog.bin === "pbx"));
        const spawned = pbx
          ? fireHx(process.cwd()) || fire(prog!.linux, body.args || [])
          : fire(launch.path, body.args || []) || (prog ? fire(prog.linux, body.args || []) : false);
        return Response.json({
          ok: true,
          intent,
          launch,
          spawned,
          wire,
          swarm: pbx ? PBX.swarm : "",
          exec: pbx ? PBX.exec : "",
        });
      },
    },
  },
});
