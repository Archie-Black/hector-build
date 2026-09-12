import { createFileRoute } from "@tanstack/react-router";
import { boot, step, type Horizon } from "@/lib/hx/horizon";

let W: Horizon = boot();

export const Route = createFileRoute("/api/v1/hx/horizon")({
  server: {
    handlers: {
      GET: () => Response.json(W),
      POST: async () => {
        W = step(W);
        return Response.json(W);
      },
    },
  },
});
