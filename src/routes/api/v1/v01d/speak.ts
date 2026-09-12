import { createFileRoute } from "@tanstack/react-router";
import { speak, wav } from "@/lib/v01d/voice/speak";

export const Route = createFileRoute("/api/v1/v01d/speak")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as { text?: string };
        const u = speak(body.text || "hello");
        const bin = wav(u.pcm, u.rate);
        return new Response(Buffer.from(bin), {
          headers: { "content-type": "audio/wav", "x-v01d-engine": u.engine },
        });
      },
    },
  },
});
