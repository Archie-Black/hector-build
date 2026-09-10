import { createFileRoute } from "@tanstack/react-router";
import { bearerFrom } from "@/lib/hector-api/cloud";
import { completeChat, jsonApi, streamFromText } from "@/lib/hector-api/complete";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, content-type, x-api-key",
  "access-control-allow-methods": "POST, OPTIONS",
};

async function handlePost({ request }: { request: Request }) {
  const body = (await request.json().catch(() => null)) as Parameters<typeof completeChat>[0] | null;
  if (!body || !Array.isArray(body.messages)) {
    return jsonApi({ error: { message: "messages required", type: "invalid_request_error" } }, 400);
  }
  const key = bearerFrom(request) || process.env.XAI_API_KEY || process.env.OPENAI_API_KEY || "";
  const result = await completeChat(body, key);
  const payload = result.payload as { choices?: { message?: { content?: string } }[] };
  if (body.stream) {
    const text = payload?.choices?.[0]?.message?.content ?? "";
    return streamFromText(result.model, text);
  }
  return jsonApi(result.payload);
}

export const Route = createFileRoute("/api/v1/chat/completions")({
  server: {
    handlers: {
      POST: handlePost,
      OPTIONS: () => new Response(null, { status: 204, headers: CORS }),
    },
  },
});
