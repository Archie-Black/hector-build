import { createFileRoute } from "@tanstack/react-router";
import { jsonApi } from "@/lib/hector-api/complete";
import { boot, osStatus, setPersist, shutdown, wipe } from "@/lib/os/kernel";
import { consolidate, lessonsFor, mmStatus, recall, recordTurn } from "@/lib/os/mm";

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
        const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
        const op = String(body?.op ?? "status");
        if (op === "boot") return jsonApi({ ...osStatus(), session: boot() });
        if (op === "shutdown") return jsonApi(shutdown());
        if (op === "wipe") return jsonApi(wipe());
        if (op === "persist") return jsonApi(setPersist(Boolean(body?.persist)));
        if (op === "mm") return jsonApi(mmStatus());
        if (op === "recall") return jsonApi({ pages: recall(String(body?.agent ?? "hx"), String(body?.query ?? body?.prompt ?? "")) });
        if (op === "lessons") return jsonApi({ lessons: lessonsFor(String(body?.agent ?? "hx"), String(body?.query ?? "")) });
        if (op === "consolidate") return jsonApi(consolidate(body?.agent ? String(body.agent) : undefined));
        if (op === "improve") {
          return jsonApi({
            pages: recordTurn({
              agent: String(body?.agent ?? "hx"),
              prompt: String(body?.prompt ?? ""),
              ok: body?.ok !== false,
              note: body?.note ? String(body.note) : undefined,
            }),
          });
        }
        return jsonApi(osStatus());
      },
    },
  },
});
