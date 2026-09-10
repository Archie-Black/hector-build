export function bootOs() {
  if (typeof fetch === "undefined") return;
  void fetch("/api/v1/os", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ op: "boot" }),
    keepalive: true,
  }).catch(() => undefined);
}
