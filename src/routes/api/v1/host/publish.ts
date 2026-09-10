import { createFileRoute } from "@tanstack/react-router";
import { jsonApi } from "@/lib/hector-api/complete";
import { canView, fileOf, listSites, loadSite, publish, unpublish } from "@/lib/host/site";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, content-type",
  "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
};

export const Route = createFileRoute("/api/v1/host/publish")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { status: 204, headers: CORS }),
      GET: ({ request }: { request: Request }) => {
        const url = new URL(request.url);
        const slug = url.searchParams.get("slug") || "";
        const k = url.searchParams.get("k") || "";
        const path = url.searchParams.get("path") || "";
        if (!slug) return jsonApi({ sites: listSites().map(({ token: _t, ...rest }) => rest) });
        if (path) {
          const file = fileOf(slug, path);
          if (!file || !canView(file.meta, k)) return jsonApi({ error: { message: "not found" } }, 404);
          const type = path.endsWith(".css") ? "text/css" : path.endsWith(".js") ? "text/javascript" : path.endsWith(".html") || path.endsWith(".htm") ? "text/html" : "text/plain";
          return new Response(file.body, { headers: { "content-type": `${type}; charset=utf-8`, ...CORS } });
        }
        const site = loadSite(slug);
        if (!site || !canView(site.meta, k)) return jsonApi({ error: { message: "not found" } }, 404);
        const { token: _t, ...meta } = site.meta;
        return jsonApi({ ...meta, files: Object.keys(site.files) });
      },
      POST: async ({ request }: { request: Request }) => {
        const body = (await request.json().catch(() => null)) as {
          slug?: string;
          title?: string;
          files?: Record<string, string>;
          access?: "private" | "link" | "public";
          owner?: string;
        } | null;
        if (!body?.files || typeof body.files !== "object") return jsonApi({ error: { message: "files required" } }, 400);
        return jsonApi(publish({ slug: body.slug, title: body.title, files: body.files, access: body.access, owner: body.owner }));
      },
      DELETE: async ({ request }: { request: Request }) => {
        const body = (await request.json().catch(() => null)) as { slug?: string } | null;
        return jsonApi({ ok: unpublish(String(body?.slug ?? "")) });
      },
    },
  },
});
