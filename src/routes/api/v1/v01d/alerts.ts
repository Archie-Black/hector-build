import { createFileRoute } from "@tanstack/react-router";
import { current, ingest, sayAlerts } from "@/lib/v01d/alerts";

export const Route = createFileRoute("/api/v1/v01d/alerts")({
  server: {
    handlers: {
      GET: async () => {
        const alerts = current();
        return Response.json({ ok: alerts.length === 0, note: sayAlerts(alerts), alerts });
      },
      POST: async ({ request }) => {
        const body = await request.json().catch(() => ({}));
        const alerts = ingest(body);
        return Response.json({ ok: true, note: sayAlerts(alerts), alerts });
      },
    },
  },
});
