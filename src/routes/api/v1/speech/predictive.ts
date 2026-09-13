import { createFileRoute } from "@tanstack/react-router";
import { which } from "@/lib/hector/cores";
import { maySpeak } from "@/lib/v01d/tts/gate";
import { plan, spoken, sway } from "@/lib/v01d/tts/predict";
import { speak, wav } from "@/lib/v01d/voice/speak";

export const Route = createFileRoute("/api/v1/speech/predictive")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as { text?: string; core?: "diplomat" | "machine" };
        const text = (body.text || "").trim();
        if (!text) return new Response("empty", { status: 400 });
        const core = body.core || which(text);
        if (!maySpeak(text, core)) {
          return new Response(null, { status: 204, headers: { "x-v01d-tts": "machine-silent" } });
        }
        const host = process.env.OSV01D_TTS_URL || "http://127.0.0.1:8090/v1/speech/predictive";
        try {
          const r = await fetch(host, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ text: spoken(text), core: "diplomat", nfe: 7, sway: -1 }),
            signal: AbortSignal.timeout(8000),
          });
          if (r.ok && r.headers.get("content-type")?.includes("audio")) {
            return new Response(r.body, {
              headers: { "content-type": r.headers.get("content-type") || "audio/wav", "x-v01d-engine": "dit" },
            });
          }
        } catch {
          /* local formant / paul */
        }
        const u = speak(spoken(text));
        const bin = wav(u.pcm, u.rate);
        return new Response(Buffer.from(bin), {
          headers: {
            "content-type": "audio/wav",
            "x-v01d-engine": u.engine,
            "x-v01d-plan": String(plan(text).length),
            "x-v01d-sway": sway(7).length.toString(),
          },
        });
      },
    },
  },
});
