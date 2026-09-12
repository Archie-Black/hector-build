import { createFileRoute } from "@tanstack/react-router";
import { list } from "@/lib/v01d/vfs";

export const Route = createFileRoute("/api/v1/v01d/fs")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const at = new URL(request.url).searchParams.get("at") || "/v01d/home";
        return Response.json({ at, items: list(at) });
      },
    },
  },
});
