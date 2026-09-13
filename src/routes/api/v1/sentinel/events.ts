import { createFileRoute } from "@tanstack/react-router";
import { ingest, recent } from "@/lib/sentinel/gateway";
import { dispatch } from "@/lib/sentinel/swarm";
import { span } from "@/lib/v01d/otel";

export const Route = createFileRoute("/api/v1/sentinel/events")({
  server: {
    handlers: {
      GET: async () => Response.json({ ok: true, events: recent() }),
      POST: async ({ request }) =>
        span("POST /api/v1/sentinel/events", async () => {
          const body = (await request.json().catch(() => ({}))) as { sense?: string; body?: string; text?: string };
          const text = String(body.text || body.body || "").slice(0, 4000);
          if (body.sense && body.sense !== "text") {
            ingest({ sense: body.sense as "mic" | "desk" | "cal" | "mail", body: text, at: Date.now() });
          }
          if (!text) return Response.json({ ok: false, note: "Empty." }, { status: 422 });
          const job = dispatch(text);
          return Response.json({ ok: true, ...job });
        }),
    },
  },
});
