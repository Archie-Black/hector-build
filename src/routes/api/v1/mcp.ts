import { createFileRoute } from "@tanstack/react-router";
import { handleMcp } from "@/lib/hector-api/mcp-server";
import { jsonApi } from "@/lib/hector-api/complete";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, content-type, mcp-session-id",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "mcp-session-id": "hector-cloud",
};

export const Route = createFileRoute("/api/v1/mcp")({
  server: {
    handlers: {
      GET: () =>
        jsonApi({
          name: "hector-cloud",
          protocol: "mcp",
          transport: "streamable-http",
          endpoint: "/api/v1/mcp",
        }),
      POST: async ({ request }: { request: Request }) => {
        const raw = (await request.json().catch(() => null)) as { jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown> } | null;
        if (!raw || !raw.method) return jsonApi({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "parse error" } }, 400);
        const result = await handleMcp(raw);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { "content-type": "application/json", ...CORS },
        });
      },
      OPTIONS: () => new Response(null, { status: 204, headers: CORS }),
    },
  },
});
