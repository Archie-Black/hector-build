import { createFileRoute } from "@tanstack/react-router";
import { jsonApi, localEmbeddings } from "@/lib/hector-api/complete";

export const Route = createFileRoute("/api/v1/embeddings")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const body = (await request.json().catch(() => null)) as { input?: string | string[]; model?: string } | null;
        if (!body || body.input == null) {
          return jsonApi({ error: { message: "input required", type: "invalid_request_error" } }, 400);
        }
        return jsonApi(localEmbeddings(body.input, body.model || "hector-mdv"));
      },
      OPTIONS: () =>
        new Response(null, {
          status: 204,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-headers": "authorization, content-type, x-api-key",
            "access-control-allow-methods": "POST, OPTIONS",
          },
        }),
    },
  },
});
