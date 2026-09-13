import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { promisify } from "node:util";
import { createFileRoute } from "@tanstack/react-router";
import { status } from "@/lib/v01d/cloud";
import { span } from "@/lib/v01d/otel";
import { tqcOp } from "@/lib/v01d/geom";
import { mind, remember } from "@/lib/v01d/learn";
import { parseComposePs, planRepair, summarize } from "@/lib/v01d/repair";

const run = promisify(execFile);

function find(name: string) {
  const roots = [
    join(process.cwd(), "packaging/cloud", name),
    join("/opt/osv01d/cloud", name),
    join(process.env.HECTOR_PREFIX || "", "packaging/cloud", name),
  ];
  return roots.find((p) => p && existsSync(p));
}

export const Route = createFileRoute("/api/v1/v01d/cloud")({
  server: {
    handlers: {
      GET: async () =>
        span("GET /api/v1/v01d/cloud", async () => {
          const sh = find("health.sh");
          if (!sh) {
            return Response.json({ ...status(), ok: false, note: "This machine is not hosting the website.", services: [] });
          }
          try {
            const { stdout } = await run("bash", [sh], { timeout: 8000 });
            const services = parseComposePs(stdout);
            remember(services);
            const steps = planRepair(services);
            const work = steps.filter((s) => s.action !== "skip");
            const ok = work.length === 0 && services.length > 0;
            return Response.json({
              ...status(),
              ok,
              note: ok ? "All website services are up." : summarize(steps),
              services,
              steps: work,
              tqc: tqcOp(services),
              learned: mind().ticks,
            });
          } catch {
            return Response.json({ ...status(), ok: false, note: "Docker is not running on this machine.", services: [] });
          }
        }),
      POST: async ({ request }) =>
        span("POST /api/v1/v01d/cloud", async () => {
          const body = (await request.json().catch(() => ({}))) as { action?: string; copies?: number; peer?: string; dump?: string };
          const action = body.action || "repair";
          if (action === "restore") {
            const sh = find("restore.sh");
            if (!sh) return Response.json({ ok: false, note: "This machine is not hosting the website." });
            try {
              const args = body.dump ? [sh, body.dump] : [sh];
              const { stdout } = await run("bash", args, { timeout: 180000 });
              return Response.json({ ok: true, note: stdout.trim() });
            } catch (err) {
              const msg = err && typeof err === "object" && "stdout" in err ? String((err as { stdout?: string }).stdout || "") : "";
              return Response.json({ ok: false, note: msg.trim() || "Could not restore the database." }, { status: 422 });
            }
          }
          if (action === "mesh") {
            const sh = find("mesh.sh");
            if (!sh) return Response.json({ ok: false, note: "This machine is not hosting the website." });
            const args = body.peer ? [sh, "join", body.peer] : [sh, "sync"];
            try {
              const { stdout } = await run("bash", args, { timeout: 60000 });
              return Response.json({ ok: true, note: stdout.trim() });
            } catch (err) {
              const msg = err && typeof err === "object" && "stdout" in err ? String((err as { stdout?: string }).stdout || "") : "";
              return Response.json({ ok: false, note: msg.trim() || "Could not talk to the second box." }, { status: 422 });
            }
          }
          if (action === "backup") {
            const sh = find("backup.sh");
            if (!sh) return Response.json({ ok: false, note: "This machine is not hosting the website." });
            try {
              const { stdout } = await run("bash", [sh], { timeout: 120000 });
              return Response.json({ ok: true, note: stdout.trim() });
            } catch (err) {
              const msg = err && typeof err === "object" && "stdout" in err ? String((err as { stdout?: string }).stdout || "") : "";
              return Response.json({ ok: false, note: msg.trim() || "Could not copy the database." }, { status: 422 });
            }
          }
          if (action === "scale" || action === "roll" || action === "status") {
            const sh = find("orchestrate.sh");
            if (!sh) return Response.json({ ok: false, note: "This machine is not hosting the website." });
            const args = action === "scale" ? [sh, "scale", String(body.copies || 2)] : [sh, action];
            try {
              const { stdout } = await run("bash", args, { timeout: 90000 });
              return Response.json({ ok: true, note: stdout.trim() });
            } catch (err) {
              const msg = err && typeof err === "object" && "stdout" in err ? String((err as { stdout?: string }).stdout || "") : "";
              return Response.json({ ok: false, note: msg.trim() || "Could not change website copies." }, { status: 422 });
            }
          }
          const sh = find("repair.sh");
          if (!sh) {
            return Response.json({ ok: false, note: "This machine is not hosting the website." });
          }
          try {
            const { stdout } = await run("bash", [sh], { timeout: 60000 });
            return Response.json({ ok: true, note: stdout.trim() || "Restarted website services." });
          } catch (err) {
            const msg = err && typeof err === "object" && "stdout" in err ? String((err as { stdout?: string }).stdout || "") : "";
            return Response.json({ ok: false, note: msg.trim() || "Could not restart website services." }, { status: 422 });
          }
        }),
    },
  },
});
