import { createFileRoute } from "@tanstack/react-router";
import { jsonApi } from "@/lib/hector-api/complete";
import { idleSpool, spool, spoolFor, spoolStatus } from "@/lib/spool/spooler";
import { lookAhead } from "@/lib/spool/look-ahead";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, content-type",
  "access-control-allow-methods": "GET, POST, OPTIONS",
};

export const Route = createFileRoute("/api/v1/spool")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { status: 204, headers: CORS }),
      GET: () => jsonApi(spoolStatus()),
      POST: async ({ request }: { request: Request }) => {
        const body = (await request.json().catch(() => null)) as { prompt?: string; idle?: boolean; lanes?: string[] } | null;
        if (body?.idle) return jsonApi(await idleSpool());
        if (body?.prompt) return jsonApi(await spoolFor(body.prompt));
        if (Array.isArray(body?.lanes)) return jsonApi(await spool(lookAhead(body.lanes.join(" "))));
        return jsonApi(spoolStatus());
      },
    },
  },
});
