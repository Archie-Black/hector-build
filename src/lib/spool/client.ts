export function spoolFor(prompt: string) {
  if (typeof fetch === "undefined" || !prompt.trim()) return;
  void fetch("/api/v1/spool", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ prompt }),
    keepalive: true,
  }).catch(() => undefined);
}

export function idleSpool() {
  if (typeof fetch === "undefined") return;
  void fetch("/api/v1/spool", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ idle: true }),
    keepalive: true,
  }).catch(() => undefined);
}
