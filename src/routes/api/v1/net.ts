import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createFileRoute } from "@tanstack/react-router";

const run = promisify(execFile);

async function ssid(): Promise<{ ssid: string; on: boolean; note: string }> {
  try {
    const { stdout } = await run("nmcli", ["-t", "-f", "active,ssid", "dev", "wifi"], { timeout: 2500 });
    const line = stdout.split("\n").find((l) => l.startsWith("yes:"));
    if (line) return { ssid: line.slice(4).trim() || "Wi-Fi", on: true, note: "live" };
  } catch {
    /* try iw */
  }
  try {
    const { stdout } = await run("iwgetid", ["-r"], { timeout: 1500 });
    const name = stdout.trim();
    if (name) return { ssid: name, on: true, note: "live" };
  } catch {
    /* sandbox */
  }
  return { ssid: "Local", on: true, note: "this machine" };
}

export const Route = createFileRoute("/api/v1/net")({
  server: {
    handlers: {
      GET: async () => Response.json(await ssid()),
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as { ssid?: string; pass?: string };
        const name = (body.ssid || "").trim();
        if (!name) return Response.json({ ssid: "—", on: false, note: "need a name" }, { status: 400 });
        try {
          const args = body.pass ? ["dev", "wifi", "connect", name, "password", body.pass] : ["dev", "wifi", "connect", name];
          await run("nmcli", args, { timeout: 8000 });
          return Response.json({ ssid: name, on: true, note: "joined" });
        } catch {
          return Response.json({ ssid: name, on: false, note: "could not join" }, { status: 422 });
        }
      },
    },
  },
});
