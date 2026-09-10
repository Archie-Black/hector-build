export function bootOs() {
  if (typeof fetch === "undefined") return;
  void fetch("/api/v1/os", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ op: "boot" }),
    keepalive: true,
  }).catch(() => undefined);
  void fetch("/api/v1/vision", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ op: "scan" }),
    keepalive: true,
  }).catch(() => undefined);
  void fetch("/api/v1/kvm", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ op: "boot" }),
    keepalive: true,
  }).catch(() => undefined);
}