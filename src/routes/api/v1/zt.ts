import { createFileRoute } from "@tanstack/react-router";
import { jsonApi } from "@/lib/hector-api/complete";
import { bootZt, decide, issueGrant, loadGrants, revokeGrant, ztStatus, type PrincipalKind, type Verb } from "@/lib/zt/zero";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, content-type",
  "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
};

export const Route = createFileRoute("/api/v1/zt")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { status: 204, headers: CORS }),
      GET: () => jsonApi(ztStatus()),
      POST: async ({ request }: { request: Request }) => {
        const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
        const op = String(body?.op ?? "status");
        if (op === "boot") return jsonApi(bootZt());
        if (op === "grant") {
          return jsonApi(
            issueGrant({
              principal: String(body?.principal ?? "human"),
              resource: String(body?.resource ?? "*"),
              verb: (String(body?.verb ?? "dial") as Verb),
              ttlMs: body?.ttlMs ? Number(body.ttlMs) : undefined,
              by: "human",
            }),
          );
        }
        if (op === "decide") {
          return jsonApi(
            decide({
              who: { id: String(body?.id ?? "anon"), kind: (String(body?.kind ?? "anon") as PrincipalKind) },
              verb: (String(body?.verb ?? "dial") as Verb),
              resource: String(body?.resource ?? ""),
              loc: body?.loc ? String(body.loc) : undefined,
            }),
          );
        }
        return jsonApi({ ...ztStatus(), grants: loadGrants() });
      },
      DELETE: async ({ request }: { request: Request }) => {
        const body = (await request.json().catch(() => null)) as { id?: string } | null;
        return jsonApi({ ok: revokeGrant(String(body?.id ?? "")) });
      },
    },
  },
});
