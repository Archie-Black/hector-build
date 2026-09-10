import { createFileRoute } from "@tanstack/react-router";
import { allowCert } from "@/lib/host/isolate";

export const Route = createFileRoute("/api/v1/host/ask")({
  server: {
    handlers: {
      GET: ({ request }: { request: Request }) => {
        const domain = new URL(request.url).searchParams.get("domain") || "";
        return new Response(null, { status: allowCert(domain) ? 200 : 404 });
      },
    },
  },
});
