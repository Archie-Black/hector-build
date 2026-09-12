import { createFileRoute } from "@tanstack/react-router";
import { readIntent } from "@/lib/v01d/intent";
import { carry } from "@/lib/v01d/netguard";
import { admit } from "@/lib/v01d/range";
import { plan } from "@/lib/v01d/runtime";

export const Route = createFileRoute("/api/v1/v01d/run")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as { file?: string; prompt?: string };
        const file = body.file || "";
        const prompt = body.prompt || "";
        const intent = readIntent({ tool: file, prompt });
        if (intent.stance === "deny") return Response.json({ ok: false, intent }, { status: 403 });
        if (intent.stance === "range") return Response.json({ ok: true, intent, range: admit(prompt) });
        const wire = carry({ to: "local", tool: file, prompt });
        if (!wire.ok) return Response.json({ ok: false, intent, wire }, { status: 403 });
        return Response.json({ ok: true, intent, launch: plan(file), wire });
      },
    },
  },
});
