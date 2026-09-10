import { useEffect } from "react";

export function HostedRedirect({ slug }: { slug: string }) {
  useEffect(() => {
    const k = new URLSearchParams(window.location.search).get("k");
    window.location.replace(`/h/${slug}${k ? `?k=${encodeURIComponent(k)}` : ""}`);
  }, [slug]);
  return <main className="min-h-dvh bg-void" />;
}
