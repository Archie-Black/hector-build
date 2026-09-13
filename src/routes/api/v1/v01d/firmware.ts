import { createFileRoute } from "@tanstack/react-router";
import { readFile } from "node:fs/promises";
import { plan, sayPlan, type Census, type Update } from "@/lib/v01d/firmware";
import { ORIGIN } from "@/lib/v01d/origin";

function kv(raw: string): Record<string, string> {
  const o: Record<string, string> = {};
  for (const line of raw.split("\n")) {
    const i = line.indexOf("=");
    if (i > 0) o[line.slice(0, i)] = line.slice(i + 1).trim();
  }
  return o;
}

export const Route = createFileRoute("/api/v1/v01d/firmware")({
  server: {
    handlers: {
      GET: async () => {
        let c: Census = { vendor: "unknown", board: "unknown", bios: "unknown", date: "", efi: false, ac: true };
        try {
          const raw = await readFile(`${ORIGIN.path}/census`, "utf8");
          const o = kv(raw);
          c = {
            vendor: o.vendor || "unknown",
            board: o.board || "unknown",
            bios: o.bios || "unknown",
            date: o.date || "",
            efi: o.efi === "1",
            ac: o.ac !== "0",
          };
        } catch {
          /* live preview */
        }
        let ups: Update[] = [];
        try {
          const j = JSON.parse(await readFile(`${ORIGIN.path}/updates.json`, "utf8")) as { Devices?: { Name?: string; Releases?: { Version?: string; Flags?: string[] }[] }[] };
          for (const d of j.Devices || []) {
            for (const r of d.Releases || []) {
              ups.push({ id: d.Name || "device", name: d.Name || "device", version: r.Version || "", signed: true });
            }
          }
        } catch {
          /* none */
        }
        const p = plan(c, ups);
        return Response.json({ census: c, plan: p, say: sayPlan(p), origin: ORIGIN.path });
      },
    },
  },
});
