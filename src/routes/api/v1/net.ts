import { createFileRoute } from "@tanstack/react-router";
import { jsonApi } from "@/lib/hector-api/complete";
import { heal, tickNet } from "@/lib/net/heal";
import { netctl, netStatus } from "@/lib/net/stack";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, content-type",
  "access-control-allow-methods": "GET, POST, OPTIONS",
};

export const Route = createFileRoute("/api/v1/net")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { status: 204, headers: CORS }),
      GET: () => jsonApi(netStatus()),
      POST: async ({ request }: { request: Request }) => {
        const body = (await request.json().catch(() => null)) as { op?: string; argv?: string[] } | null;
        const op = String(body?.op ?? "status");
        if (op === "tick") return jsonApi(await tickNet());
        if (op === "heal") return jsonApi(await heal());
        if (op === "ctl" && Array.isArray(body?.argv)) return jsonApi({ text: await netctl(body.argv.map(String)) });
        return jsonApi(netStatus());
      },
    },
  },
});
