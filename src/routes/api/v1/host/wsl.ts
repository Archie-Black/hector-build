import { createFileRoute } from "@tanstack/react-router";
import { jsonApi } from "@/lib/hector-api/complete";
import { isWslJob, wslRun, wslStatus } from "@/lib/host/wsl";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, content-type",
  "access-control-allow-methods": "GET, POST, OPTIONS",
};

export const Route = createFileRoute("/api/v1/host/wsl")({
  server: {
    handlers: {
      GET: () => jsonApi({ object: "hector.wsl", ...wslStatus() }),
      POST: async ({ request }: { request: Request }) => {
        const body = (await request.json().catch(() => null)) as { job?: string } | null;
        const job = body?.job || "status";
        if (!isWslJob(job)) return jsonApi({ error: { message: "status | embed | packages | ollama | models" } }, 400);
        const result = await wslRun(job);
        return jsonApi(result, result.ok ? 200 : 400);
      },
      OPTIONS: () => new Response(null, { status: 204, headers: CORS }),
    },
  },
});
