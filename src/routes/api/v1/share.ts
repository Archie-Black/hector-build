import { createFileRoute } from "@tanstack/react-router";
import { jsonApi } from "@/lib/hector-api/complete";
import { ackNote, joinPeer, leasePath, listLinks, postNote, pullRoom, registerLink, shareStatus, syncFile } from "@/lib/share/room";
import { describeLink, execSsh, listTerms, openTerm, readTerm, writeTerm } from "@/lib/share/term";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, content-type",
  "access-control-allow-methods": "GET, POST, OPTIONS",
};

export const Route = createFileRoute("/api/v1/share")({
  server: {
    handlers: {
      GET: () => jsonApi({ object: "hector.share", ...shareStatus(), room: pullRoom() }),
      POST: async ({ request }: { request: Request }) => {
        const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
        const op = String(body?.op ?? body?.action ?? "");
        if (op === "join") return jsonApi(joinPeer({ name: String(body?.name ?? "bot"), kind: body?.kind as never, id: body?.id ? String(body.id) : undefined }));
        if (op === "post") return jsonApi(postNote({ from: String(body?.from ?? "generic"), to: body?.to ? String(body.to) : "hector", kind: body?.kind as "task" | "result" | "note", body: String(body?.body ?? "") }));
        if (op === "ack") return jsonApi({ note: ackNote(String(body?.id ?? ""), String(body?.bot ?? "generic")) });
        if (op === "lease") return jsonApi(leasePath({ bot: String(body?.bot ?? "generic"), path: String(body?.path ?? ""), seconds: body?.seconds ? Number(body.seconds) : undefined }));
        if (op === "sync") return jsonApi(syncFile({ bot: String(body?.bot ?? "generic"), path: String(body?.path ?? ""), content: String(body?.content ?? ""), expect: body?.expect ? String(body.expect) : undefined }));
        if (op === "pull") return jsonApi({ room: pullRoom(), terms: listTerms(), links: listLinks() });
        if (op === "link") {
          const link = registerLink({
            from: String(body?.from ?? "generic"),
            to: String(body?.to ?? "*"),
            kind: body?.kind === "putty" || body?.kind === "term" ? body.kind : "ssh",
            host: String(body?.host ?? ""),
            port: body?.port ? Number(body.port) : 22,
            user: String(body?.user ?? "hector"),
            session: body?.session ? String(body.session) : undefined,
          });
          return jsonApi(describeLink(link));
        }
        if (op === "term") {
          if (!body?.session && !body?.command) return jsonApi(openTerm(String(body?.bot ?? "generic")));
          if (!body?.session && body?.command) {
            const opened = openTerm(String(body?.bot ?? "generic"));
            return jsonApi(writeTerm(opened.id, String(body?.bot ?? "generic"), String(body.command), true));
          }
          if (body?.session && !body?.command) return jsonApi(readTerm(String(body.session)));
          return jsonApi(writeTerm(String(body?.session), String(body?.bot ?? "generic"), String(body?.command ?? ""), true));
        }
        if (op === "ssh") {
          return jsonApi(
            await execSsh({
              host: String(body?.host ?? ""),
              username: String(body?.user ?? "hector"),
              port: body?.port ? Number(body.port) : 22,
              password: body?.password ? String(body.password) : undefined,
              command: String(body?.command ?? ""),
              collab: true,
              bot: String(body?.bot ?? "generic"),
            }),
          );
        }
        return jsonApi({ error: { message: "op: join | post | ack | lease | sync | pull | link | term | ssh" } }, 400);
      },
      OPTIONS: () => new Response(null, { status: 204, headers: CORS }),
    },
  },
});
