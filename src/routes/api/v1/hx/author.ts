import { createFileRoute } from "@tanstack/react-router";
import { author } from "@/lib/hx/author";
import { readIntent } from "@/lib/v01d/intent";

export const Route = createFileRoute("/api/v1/hx/author")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as { want?: string };
        const want = body.want || "Spectral Horizon";
        const intent = readIntent({ tool: "hector", prompt: want });
        if (intent.stance === "deny") return Response.json({ ok: false, note: intent.why }, { status: 403 });
        return Response.json({ ok: true, kit: author(want) });
      },
    },
  },
});
