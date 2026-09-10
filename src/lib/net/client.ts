export function idleNet() {
  if (typeof fetch === "undefined") return;
  void fetch("/api/v1/net", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ op: "tick" }),
    keepalive: true,
  }).catch(() => undefined);
}
