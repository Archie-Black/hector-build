import { createFileRoute } from "@tanstack/react-router";
import { cleanUrl, GHOST_UA, isOnion } from "@/lib/ghostwalk/ghstkrt";
import { sniff, UA } from "@/lib/ghostwalk/morph";
import { socksFetch, torUp } from "@/lib/ghostwalk/socks";

export const Route = createFileRoute("/api/v1/ghostwalk")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const q = new URL(request.url).searchParams;
        if (q.get("probe") === "tor") {
          const tor = await torUp();
          return Response.json({ tor, socks: "127.0.0.1:9050" });
        }
        const href = cleanUrl(q.get("url") || "");
        if (!href) return Response.json({ ok: false, note: "bad address" }, { status: 400 });
        const onion = isOnion(href);
        const habitat = (["web", "win", "nix", "darwin", "unix"].includes(q.get("habitat") || "") ? q.get("habitat") : sniff(href)) as "web" | "win" | "nix" | "darwin" | "unix";
        const ua = UA[habitat] || GHOST_UA;
        const hop = await socksFetch(href, {
          "User-Agent": ua,
          Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.7",
          DNT: "1",
          "Upgrade-Insecure-Requests": "1",
        });
        const html = hop.ctype.includes("html") ? strip(hop.body) : hop.body.slice(0, 200_000);
        return Response.json({
          ok: hop.ok,
          tor: hop.tor,
          onion,
          habitat,
          status: hop.status,
          note: hop.note,
          ctype: hop.ctype,
          html,
        });
      },
    },
  },
});

function strip(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .slice(0, 400_000);
}
