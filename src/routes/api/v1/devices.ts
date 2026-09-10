import { createFileRoute } from "@tanstack/react-router";
import { jsonApi } from "@/lib/hector-api/complete";
import { busStatus, enumerate, plug } from "@/lib/devices/bus";
import { drainJobs, enqueueJob, holdDevice, listJobs, startDevice, spoolStatus } from "@/lib/devices/print";
import { bonds, pair, sdpStatus, unpair } from "@/lib/devices/sdp";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, content-type",
  "access-control-allow-methods": "GET, POST, OPTIONS",
};

export const Route = createFileRoute("/api/v1/devices")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { status: 204, headers: CORS }),
      GET: () => jsonApi({ ...busStatus(), print: spoolStatus(), sdp: sdpStatus() }),
      POST: async ({ request }: { request: Request }) => {
        const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
        const op = String(body?.op ?? "");
        if (op === "plug") return jsonApi(plug(String(body?.id ?? ""), body?.present !== false));
        if (op === "hold") return jsonApi(holdDevice(String(body?.id ?? "model")));
        if (op === "start") return jsonApi(startDevice(String(body?.id ?? "model")));
        if (op === "enqueue") return jsonApi(enqueueJob({ device: String(body?.device ?? "model"), title: String(body?.title ?? "job"), body: body?.body ? String(body.body) : undefined }));
        if (op === "drain") return jsonApi(drainJobs(body?.device ? String(body.device) : undefined));
        if (op === "pair") return jsonApi(pair(String(body?.id ?? "bot"), String(body?.name ?? "bot")));
        if (op === "unpair") return jsonApi({ ok: unpair(String(body?.id ?? "")) });
        if (op === "jobs") return jsonApi({ jobs: listJobs() });
        if (op === "bonds") return jsonApi({ bonds: bonds() });
        if (op === "tree") return jsonApi({ tree: enumerate() });
        return jsonApi({ error: { message: "op: plug | hold | start | enqueue | drain | pair | unpair | jobs | bonds | tree" } }, 400);
      },
    },
  },
});
