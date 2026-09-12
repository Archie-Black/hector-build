import { createFileRoute } from "@tanstack/react-router";
import { boot } from "@/lib/hx/horizon";
import { fromPlay, retain } from "@/lib/hx/retain";

export const Route = createFileRoute("/api/v1/hx/retain")({
  server: {
    handlers: {
      GET: () => Response.json(retain([fromPlay(boot())])),
    },
  },
});
