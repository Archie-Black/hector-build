import { createFileRoute } from "@tanstack/react-router";
import { autoWire, joinBuild, loadWeave, pin, weave } from "@/lib/v01d/weave";
import type { AppId } from "@/lib/horsemen/layout";

export const Route = createFileRoute("/api/v1/v01d/weave")({
  server: {
    handlers: {
      GET: () => Response.json(loadWeave()),
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as {
          act?: string;
          desk?: number;
          app?: AppId;
          title?: string;
        };
        if (body.act === "pin" && body.app != null && body.desk != null) {
          pin(body.desk, body.app, body.title || body.app);
        } else if (body.act === "wire") autoWire();
        else joinBuild();
        return Response.json(weave());
      },
    },
  },
});
