import { createFileRoute } from "@tanstack/react-router";
import { boot } from "@/lib/hx/horizon";
import { ltv } from "@/lib/hx/ltv";
import { fromPlay } from "@/lib/hx/retain";

export const Route = createFileRoute("/api/v1/hx/ltv")({
  server: {
    handlers: {
      GET: () => Response.json(ltv([fromPlay(boot())], 0)),
    },
  },
});
