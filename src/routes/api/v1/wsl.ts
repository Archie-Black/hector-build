import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { promisify } from "node:util";
import { createFileRoute } from "@tanstack/react-router";

const run = promisify(execFile);

function hook() {
  const roots = [join(process.cwd(), "packaging/wsl/hector-hook.sh"), join(process.env.HECTOR_PREFIX || "", "packaging/wsl/hector-hook.sh")];
  return roots.find((p) => p && existsSync(p));
}

export const Route = createFileRoute("/api/v1/wsl")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as { inner?: string };
        const inner = String(body.inner || "").slice(0, 400);
        if (!inner) return Response.json({ ok: true, out: "", note: "Nothing to run." });
        const sh = hook();
        if (!sh) return Response.json({ ok: false, out: "", note: "Linux room script is missing." }, { status: 500 });
        try {
          const { stdout, stderr } = await run("bash", [sh, inner], { timeout: 120000 });
          return Response.json({ ok: true, out: (stdout || stderr || "").slice(0, 8000), note: "Done in the Linux room." });
        } catch (e) {
          const err = e as { stdout?: string; stderr?: string; message?: string };
          return Response.json({
            ok: false,
            out: (err.stdout || err.stderr || err.message || "").slice(0, 4000),
            note: "The Linux room did not finish. I'll keep the explanation on screen.",
          });
        }
      },
    },
  },
});
