import { createFileRoute } from "@tanstack/react-router";
import { jsonApi } from "@/lib/hector-api/complete";
import { darwinBoot, darwinStatus, sysctl } from "@/lib/kvm/darwin";
import { kvmGrab, kvmRelease, kvmStatus, kvmSwitch } from "@/lib/kvm/seats";
import { frame, input } from "@/lib/kvm/webconnect";
import { machStatus } from "@/lib/kvm/mach";
import { listJobs } from "@/lib/kvm/launchd";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, content-type",
  "access-control-allow-methods": "GET, POST, OPTIONS",
};

export const Route = createFileRoute("/api/v1/kvm")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { status: 204, headers: CORS }),
      GET: () => jsonApi({ ...darwinStatus(), frame: frame(), mach: machStatus(), launchd: listJobs() }),
      POST: async ({ request }: { request: Request }) => {
        const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
        const op = String(body?.op ?? "status");
        if (op === "boot") return jsonApi(darwinBoot(body?.mode ? String(body.mode) : undefined));
        if (op === "switch") return jsonApi(kvmSwitch(body?.seat ? String(body.seat) : undefined));
        if (op === "grab") return jsonApi(kvmGrab(String(body?.who ?? "human"), body?.kind === "agent" ? "agent" : "human", body?.seat as "host" | "darwin" | "hx" | undefined, Boolean(body?.exclusive)));
        if (op === "release") return jsonApi(kvmRelease(String(body?.who ?? "human"), body?.seat as "host" | "darwin" | "hx" | undefined));
        if (op === "sysctl") return jsonApi(sysctl(body?.name ? String(body.name) : undefined));
        if (op === "frame") return jsonApi(frame());
        if (op === "input") return jsonApi(input(body ?? {}));
        if (op === "status") return jsonApi(kvmStatus());
        return jsonApi(darwinStatus());
      },
    },
  },
});
