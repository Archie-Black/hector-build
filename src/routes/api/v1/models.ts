import { createFileRoute } from "@tanstack/react-router";
import { HECTOR_MODELS } from "@/lib/hector-api/local-turn";

export const Route = createFileRoute("/api/v1/models")({
  server: {
    handlers: {
      GET: () =>
        new Response(JSON.stringify({ object: "list", data: HECTOR_MODELS }), {
          headers: { "content-type": "application/json", "cache-control": "no-store" },
        }),
    },
  },
});
