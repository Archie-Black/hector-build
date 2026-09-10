import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/forge/app-shell";
import { slugFromHost } from "@/lib/host/names";
import { HostedRedirect } from "@/components/forge/hosted-redirect";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const host = typeof window === "undefined" ? "" : window.location.host;
  const slug = slugFromHost(host);
  if (slug) return <HostedRedirect slug={slug} />;
  return <AppShell />;
}
