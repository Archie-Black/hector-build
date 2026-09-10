import { createFileRoute } from "@tanstack/react-router";
import { bearerFrom } from "@/lib/hector-api/cloud";
import { executeExtension, extensionStatus, isExtensionTool } from "@/lib/hector-api/extensions";
import { jsonApi } from "@/lib/hector-api/complete";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, content-type, x-api-key, x-arcade-key, x-arcade-user, x-gcp-token, x-gcp-project, x-gcp-mcp",
  "access-control-allow-methods": "GET, POST, OPTIONS",
};

function extFrom(request: Request) {
  return {
    arcadeKey: request.headers.get("x-arcade-key") || bearerFrom(request),
    arcadeUser: request.headers.get("x-arcade-user") || "",
    gcpToken: request.headers.get("x-gcp-token") || "",
    gcpProject: request.headers.get("x-gcp-project") || "",
    gcpMcp: request.headers.get("x-gcp-mcp") || "cli",
  };
}

export const Route = createFileRoute("/api/v1/extensions")({
  server: {
    handlers: {
      GET: ({ request }: { request: Request }) => jsonApi({ object: "hector.extensions", ...extensionStatus(extFrom(request)) }),
      POST: async ({ request }: { request: Request }) => {
        const body = (await request.json().catch(() => null)) as { name?: string; arguments?: Record<string, unknown> } | null;
        const name = body?.name || "";
        if (!isExtensionTool(name)) return jsonApi({ error: { message: "arcade_list | arcade_execute | gcp_mcp_list | gcp_mcp_call" } }, 400);
        const result = await executeExtension(name, body?.arguments ?? {}, extFrom(request));
        return jsonApi(result, result.ok ? 200 : 400);
      },
      OPTIONS: () => new Response(null, { status: 204, headers: CORS }),
    },
  },
});
