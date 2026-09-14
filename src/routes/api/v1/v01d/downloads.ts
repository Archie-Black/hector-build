import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { createFileRoute } from "@tanstack/react-router";
import { IMAGES, MIRROR } from "@/lib/v01d/downloads";

function fetchLand() {
  const script = join(process.cwd(), "packaging/linux/fetch-images.sh");
  if (!existsSync(script)) return false;
  try {
    spawn("bash", [script], { detached: true, stdio: "ignore" }).unref();
    return true;
  } catch {
    return false;
  }
}

export const Route = createFileRoute("/api/v1/v01d/downloads")({
  server: {
    handlers: {
      GET: async () =>
        Response.json({
          ok: true,
          land: MIRROR.downloads,
          www: MIRROR.www,
          y: MIRROR.y,
          images: IMAGES,
        }),
      POST: async () =>
        Response.json({
          ok: true,
          land: MIRROR.downloads,
          pulled: fetchLand(),
          note: `Fetching from ${MIRROR.downloads}`,
        }),
    },
  },
});
