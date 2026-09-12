import { createFileRoute } from "@tanstack/react-router";
import { author } from "@/lib/hx/author";
import { boot } from "@/lib/hx/horizon";
import { market } from "@/lib/hx/market";
import { readIntent } from "@/lib/v01d/intent";

export const Route = createFileRoute("/api/v1/hx/market")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as { want?: string };
        const want = body.want || "Spectral Horizon";
        const intent = readIntent({ tool: "hector", prompt: want });
        if (intent.stance === "deny") return Response.json({ ok: false, note: intent.why }, { status: 403 });
        const kit = author(want);
        return Response.json({ ok: true, kit, market: market(kit, boot()) });
      },
    },
  },
});
