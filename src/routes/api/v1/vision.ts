import { createFileRoute } from "@tanstack/react-router";
import { jsonApi } from "@/lib/hector-api/complete";
import { cameraCfg, embodiedTick, ptzTo, setCamera, resetBaseline } from "@/lib/vision";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, content-type",
  "access-control-allow-methods": "GET, POST, OPTIONS",
};

export const Route = createFileRoute("/api/v1/vision")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { status: 204, headers: CORS }),
      GET: () => jsonApi(cameraCfg()),
      POST: async ({ request }: { request: Request }) => {
        const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
        const op = String(body?.op ?? "scan");
        if (op === "cfg") return jsonApi(setCamera({
          host: body?.host != null ? String(body.host) : undefined,
          user: body?.user != null ? String(body.user) : undefined,
          pass: body?.pass != null ? String(body.pass) : undefined,
          focus: body?.focus === "room" ? "room" : body?.focus === "bench" ? "bench" : undefined,
          thermal: body?.thermal != null ? Boolean(body.thermal) : undefined,
        }));
        if (op === "ptz") return jsonApi(await ptzTo(Number(body?.x ?? 0.5), Number(body?.y ?? 0.5), Number(body?.zoom ?? 0.4)));
        if (op === "baseline") return jsonApi(resetBaseline());
        return jsonApi(await embodiedTick({}, { loose: Boolean(body?.loose), led: body?.led === "red" ? "red" : "green" }));
      },
    },
  },
});
