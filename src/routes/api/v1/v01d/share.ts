import { createFileRoute } from "@tanstack/react-router";
import { conf, listing, mayShare } from "@/lib/v01d/samba";

export const Route = createFileRoute("/api/v1/v01d/share")({
  server: {
    handlers: {
      GET: async () => Response.json({ shares: listing(), conf: conf() }),
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as { prompt?: string };
        const gate = mayShare(body.prompt || "share files on this network");
        if (!gate.ok) return Response.json(gate, { status: 403 });
        return Response.json({ ...gate, shares: listing() });
      },
    },
  },
});
