import { createFileRoute } from "@tanstack/react-router";
import { jsonApi } from "@/lib/hector-api/complete";
import { boot, osStatus, setPersist, shutdown, wipe } from "@/lib/os/kernel";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, content-type",
  "access-control-allow-methods": "GET, POST, OPTIONS",
};

export const Route = createFileRoute("/api/v1/os")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { status: 204, headers: CORS }),
      GET: () => jsonApi(osStatus()),
      POST: async ({ request }: { request: Request }) => {
        const body = (await request.json().catch(() => null)) as { op?: string; persist?: boolean } | null;
        const op = String(body?.op ?? "status");
        if (op === "boot") return jsonApi({ ...osStatus(), session: boot() });
        if (op === "shutdown") return jsonApi(shutdown());
        if (op === "wipe") return jsonApi(wipe());
        if (op === "persist") return jsonApi(setPersist(Boolean(body?.persist)));
        return jsonApi(osStatus());
      },
    },
  },
});
