import { createFileRoute } from "@tanstack/react-router";
import { jsonApi } from "@/lib/hector-api/complete";
import { ackNote, backendLinks, joinPeer, leasePath, postNote, pullRoom, registerLink, shareStatus, syncFile } from "@/lib/share/room";
import { describeLink, execSsh, listTerms, openTerm, readTerm, writeTerm } from "@/lib/share/term";
import { onionStatus, startOnionDaemon, newNym } from "@/lib/share/onion";
import { authorizeKey, generateIdentity, keyStatus, listIdentities, revokeKey, rotateHostKey, rotateIdentity, settleRotations } from "@/lib/share/keys";
import { isOnionHost } from "@/lib/share/wire";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, content-type",
  "access-control-allow-methods": "GET, POST, OPTIONS",
};

export const Route = createFileRoute("/api/v1/share")({
  server: {
    handlers: {
      GET: () => jsonApi({ object: "hector.share", ...shareStatus(), room: pullRoom(), links: backendLinks(), terms: listTerms(), onion: onionStatus() }),
      POST: async ({ request }: { request: Request }) => {
        const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
        const op = String(body?.op ?? body?.action ?? "");
        if (op === "join") return jsonApi(joinPeer({ name: String(body?.name ?? "bot"), kind: body?.kind as never, id: body?.id ? String(body.id) : undefined }));
        if (op === "post") return jsonApi(postNote({ from: String(body?.from ?? "generic"), to: body?.to ? String(body.to) : "hector", kind: body?.kind as "task" | "result" | "note", body: String(body?.body ?? "") }));
        if (op === "ack") return jsonApi({ note: ackNote(String(body?.id ?? ""), String(body?.bot ?? "generic")) });
        if (op === "lease") return jsonApi(leasePath({ bot: String(body?.bot ?? "generic"), path: String(body?.path ?? ""), seconds: body?.seconds ? Number(body.seconds) : undefined }));
        if (op === "sync") return jsonApi(syncFile({ bot: String(body?.bot ?? "generic"), path: String(body?.path ?? ""), content: String(body?.content ?? ""), expect: body?.expect ? String(body.expect) : undefined }));
        if (op === "pull") return jsonApi({ room: pullRoom(), terms: listTerms(), links: backendLinks(), onion: onionStatus() });
        if (op === "onion") return jsonApi(startOnionDaemon());
        if (op === "keys") {
          const action = String(body?.action ?? "list");
          if (action === "generate") return jsonApi(generateIdentity(String(body?.user ?? "hector"), body?.comment ? String(body.comment) : undefined));
          if (action === "authorize") {
            const fp = authorizeKey(String(body?.public ?? ""), String(body?.user ?? "hector"));
            return fp ? jsonApi({ fingerprint: fp }) : jsonApi({ error: { message: "bad public key" } }, 400);
          }
          if (action === "revoke") return jsonApi({ revoked: revokeKey(String(body?.fingerprint ?? "")) });
          if (action === "rotate") {
            const r = rotateIdentity(String(body?.user ?? "hector"));
            void newNym();
            return jsonApi(r);
          }
          if (action === "settle") return jsonApi({ settled: settleRotations() });
          if (action === "rotate-host") {
            const r = rotateHostKey();
            void newNym();
            return jsonApi(r);
          }
          if (action === "newnym") return jsonApi(await newNym());
          return jsonApi({ ...keyStatus(), identities: listIdentities() });
        }
        if (op === "link") {
          const host = String(body?.host ?? "");
          const kind = isOnionHost(host) || body?.kind === "onion" ? "onion" : body?.kind === "putty" || body?.kind === "term" ? body.kind : "ssh";
          if (kind === "onion") startOnionDaemon();
          const link = registerLink({
            from: String(body?.from ?? "generic"),
            to: String(body?.to ?? "*"),
            kind,
            host,
            port: body?.port ? Number(body.port) : kind === "onion" ? 22 : 22,
            user: String(body?.user ?? "hector"),
            session: body?.session ? String(body.session) : undefined,
            password: body?.password ? String(body.password) : undefined,
            privateKey: body?.key || body?.privateKey ? String(body.key ?? body.privateKey) : undefined,
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
        return jsonApi({ error: { message: "op: join | post | ack | lease | sync | pull | link | term | ssh | onion | keys" } }, 400);
      },
      OPTIONS: () => new Response(null, { status: 204, headers: CORS }),
    },
  },
});
