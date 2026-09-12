export type Link = { ssid: string; on: boolean; note: string };

export async function readLink(): Promise<Link> {
  try {
    const r = await fetch("/api/v1/net");
    if (r.ok) return (await r.json()) as Link;
  } catch {
    /* offline probe */
  }
  return { ssid: navigator.onLine ? "Local" : "Off", on: navigator.onLine, note: "this box" };
}

export async function saveLink(ssid: string, pass: string): Promise<Link> {
  const r = await fetch("/api/v1/net", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ssid, pass }),
  });
  return (await r.json()) as Link;
}
