import { createFileRoute } from "@tanstack/react-router";
import { bearerFrom } from "@/lib/hector-api/cloud";
import { CLOUD_MODELS, LOCAL_MODELS, jsonApi } from "@/lib/hector-api/complete";

export const Route = createFileRoute("/api/v1/models")({
  server: {
    handlers: {
      GET: ({ request }: { request: Request }) => {
        const key = bearerFrom(request) || process.env.XAI_API_KEY || "";
        const data = key ? [...LOCAL_MODELS, ...CLOUD_MODELS] : LOCAL_MODELS;
        return jsonApi({ object: "list", data });
      },
      OPTIONS: () =>
        new Response(null, {
          status: 204,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "GET, OPTIONS",
          },
        }),
    },
  },
});
