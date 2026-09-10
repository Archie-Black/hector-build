import { createFileRoute } from "@tanstack/react-router";
import { jsonApi } from "@/lib/hector-api/complete";
import { deleteFunction, deployFunction, invokeFunction, listFunctions } from "@/lib/hector-api/hector-cloud";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, content-type",
  "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
};

export const Route = createFileRoute("/api/v1/functions")({
  server: {
    handlers: {
      GET: () => jsonApi({ object: "list", data: listFunctions().map(({ source: _s, ...r }) => r) }),
      POST: async ({ request }: { request: Request }) => {
        const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
        if (!body) return jsonApi({ error: { message: "json required" } }, 400);
        try {
          if (body.event !== undefined || body.invoke === true) {
            return jsonApi(await invokeFunction(String(body.name), body.event ?? {}));
          }
          return jsonApi(deployFunction({ name: String(body.name), source: body.source ? String(body.source) : undefined, entry: body.entry ? String(body.entry) : undefined }));
        } catch (err) {
          return jsonApi({ error: { message: err instanceof Error ? err.message : String(err) } }, 400);
        }
      },
      DELETE: async ({ request }: { request: Request }) => {
        const url = new URL(request.url);
        const name = url.searchParams.get("name") || "";
        return jsonApi({ deleted: deleteFunction(name) });
      },
      OPTIONS: () => new Response(null, { status: 204, headers: CORS }),
    },
  },
});
