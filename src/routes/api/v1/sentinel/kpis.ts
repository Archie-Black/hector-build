import { createFileRoute } from "@tanstack/react-router";
import { dream } from "@/lib/sentinel/dream";
import { snapshot } from "@/lib/sentinel/kpis";
import { sense } from "@/lib/sentinel/soma";
import { graphSize } from "@/lib/sentinel/memory";
import { span } from "@/lib/v01d/otel";

export const Route = createFileRoute("/api/v1/sentinel/kpis")({
  server: {
    handlers: {
      GET: async () => Response.json({ ok: true, kpis: snapshot(), soma: sense(), graph: graphSize() }),
      POST: async () =>
        span("POST /api/v1/sentinel/kpis", async () => {
          const out = dream();
          return Response.json({ ok: out.ran, ...out });
        }),
    },
  },
});
