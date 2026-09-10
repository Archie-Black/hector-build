export function kvmFetch(op: string, extra: Record<string, unknown> = {}) {
  if (typeof fetch === "undefined") return;
  void fetch("/api/v1/kvm", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ op, ...extra }),
    keepalive: true,
  }).catch(() => undefined);
}
