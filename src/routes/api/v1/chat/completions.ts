import { createFileRoute } from "@tanstack/react-router";
import { localChatCompletion } from "@/lib/hector-api/local-turn";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });
}

async function handlePost({ request }: { request: Request }) {
  const body = (await request.json().catch(() => null)) as {
    messages?: { role?: string; content?: unknown }[];
    model?: string;
    tools?: unknown[];
  } | null;
  if (!body || !Array.isArray(body.messages)) {
    return json({ error: { message: "messages required", type: "invalid_request_error" } }, 400);
  }
  return json(localChatCompletion(body));
}

export const Route = createFileRoute("/api/v1/chat/completions")({
  server: {
    handlers: {
      POST: handlePost,
      OPTIONS: () =>
        new Response(null, {
          status: 204,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-headers": "authorization, content-type",
            "access-control-allow-methods": "POST, OPTIONS",
          },
        }),
    },
  },
});
