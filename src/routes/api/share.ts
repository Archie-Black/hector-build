import { createFileRoute } from "@tanstack/react-router";
import { getShare, putShare } from "@/lib/workspace/share-store.server";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

async function handleGet({ request }: { request: Request }) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id") ?? "";
  if (!/^[a-z0-9]{6,16}$/.test(id)) return json({ error: "bad id" }, 400);
  const snap = getShare(id);
  if (!snap) return json({ error: "no share" }, 404);
  const path = url.searchParams.get("path");
  if (path) {
    const content = snap.files[path];
    if (content === undefined) return json({ error: "missing" }, 404);
    return new Response(content, { headers: { "content-type": "text/plain; charset=utf-8" } });
  }
  return json({ files: Object.keys(snap.files), at: snap.at });
}

async function handlePost({ request }: { request: Request }) {
  const body = (await request.json()) as { id?: string; files?: Record<string, string> };
  const id = String(body.id ?? "").toLowerCase();
  if (!/^[a-z0-9]{6,16}$/.test(id)) return json({ error: "bad id" }, 400);
  putShare(id, body.files ?? {});
  return json({ ok: true, id });
}

export const Route = createFileRoute("/api/share")({
  server: { handlers: { GET: handleGet, POST: handlePost } },
});
