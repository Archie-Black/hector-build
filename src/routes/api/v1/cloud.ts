import { createFileRoute } from "@tanstack/react-router";
import { jsonApi } from "@/lib/hector-api/complete";
import {
  cloudStatus,
  deleteFunction,
  deployFunction,
  getObject,
  invokeFunction,
  listFunctions,
  listObjects,
  putObject,
} from "@/lib/hector-api/hector-cloud";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, content-type",
  "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
};

export const Route = createFileRoute("/api/v1/cloud")({
  server: {
    handlers: {
      GET: () => jsonApi({ object: "hector.cloud", ...cloudStatus(), functions: listFunctions().map(({ source: _s, ...r }) => r), objects: listObjects() }),
      POST: async ({ request }: { request: Request }) => {
        const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
        if (!body) return jsonApi({ error: { message: "json required" } }, 400);
        const op = String(body.op || body.action || "");
        try {
          if (op === "deploy") return jsonApi(deployFunction({ name: String(body.name), source: body.source ? String(body.source) : undefined, entry: body.entry ? String(body.entry) : undefined }));
          if (op === "invoke") return jsonApi(await invokeFunction(String(body.name), body.event ?? body.payload ?? {}));
          if (op === "delete") return jsonApi({ deleted: deleteFunction(String(body.name)) });
          if (op === "object.put") return jsonApi(putObject(String(body.key), String(body.body ?? "")));
          if (op === "object.get") return jsonApi(getObject(String(body.key)));
          if (op === "object.list") return jsonApi({ objects: listObjects() });
          return jsonApi({ error: { message: "op: deploy | invoke | delete | object.put | object.get | object.list" } }, 400);
        } catch (err) {
          return jsonApi({ error: { message: err instanceof Error ? err.message : String(err) } }, 400);
        }
      },
      OPTIONS: () => new Response(null, { status: 204, headers: CORS }),
    },
  },
});
