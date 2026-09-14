import { mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { createFileRoute } from "@tanstack/react-router";
import { autoWire, joinBuild, loadWeave, pin, weave, type BuildFile } from "@/lib/v01d/weave";
import type { AppId } from "@/lib/horsemen/layout";

function materialize(files: BuildFile[]) {
  const root = join(process.env.HECTOR_PREFIX || homedir(), "v01d");
  for (const f of files) {
    const rel = f.path.replace(/^\/v01d\//, "");
    const dest = join(root, rel);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, f.body, "utf8");
  }
}

export const Route = createFileRoute("/api/v1/v01d/weave")({
  server: {
    handlers: {
      GET: () => Response.json(loadWeave()),
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as {
          act?: string;
          desk?: number;
          app?: AppId;
          title?: string;
        };
        if (body.act === "pin" && body.app != null && body.desk != null) {
          pin(body.desk, body.app, body.title || body.app);
        } else if (body.act === "wire") autoWire();
        else {
          const w = joinBuild();
          if (w.join?.files.length) materialize(w.join.files);
        }
        return Response.json(weave());
      },
    },
  },
});
