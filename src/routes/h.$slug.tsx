import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/h/$slug")({ component: Hosted });

function Hosted() {
  const { slug } = Route.useParams();
  const k = typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("k") || "";
  const [src, setSrc] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    const q = k ? `&k=${encodeURIComponent(k)}` : "";
    void fetch(`/api/v1/host/publish?slug=${encodeURIComponent(slug)}&path=index.html${q}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("not found");
        const html = await r.text();
        setSrc(URL.createObjectURL(new Blob([html], { type: "text/html" })));
      })
      .catch(() => setErr("This Hector Build is private or not published."));
  }, [slug, k]);

  if (err) {
    return (
      <main className="grid min-h-dvh place-items-center bg-void px-6 text-center text-muted">
        <p>{err}</p>
      </main>
    );
  }

  return (
    <iframe
      title={slug}
      src={src || "about:blank"}
      className="h-dvh w-full border-0 bg-void"
      sandbox="allow-scripts allow-forms allow-modals allow-popups"
    />
  );
}
