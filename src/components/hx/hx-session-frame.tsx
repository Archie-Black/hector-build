import { useEffect, useState } from "react";
import { HX_SESSION_CHANNEL, hxSessionId } from "@/lib/hx/session";

export function HxSessionFrame() {
  const id = hxSessionId();
  return (
    <iframe
      id="hx-web-session"
      title="Spectral HX isolated session"
      src="/hx/session"
      sandbox="allow-scripts allow-same-origin"
      className="pointer-events-none fixed h-0 w-0 opacity-0"
      tabIndex={-1}
      aria-hidden
      data-session={id}
    />
  );
}

export function HxIsolatedSession() {
  const [log, setLog] = useState("HX isolated web session. This frame does not control the device.");

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const data = e.data as { channel?: string; payload?: unknown };
      if (data?.channel !== HX_SESSION_CHANNEL) return;
      setLog(typeof data.payload === "string" ? data.payload : JSON.stringify(data.payload));
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  return (
    <main className="bg-bg p-4 font-mono text-xs text-muted">
      <p>isolated</p>
      <p className="mt-2 whitespace-pre-wrap">{log}</p>
    </main>
  );
}
