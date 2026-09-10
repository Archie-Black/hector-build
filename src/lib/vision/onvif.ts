/** ONVIF PTZ. AbsoluteMove. Works when a camera answers. Silent when it doesn't. */

export type PtzPose = { pan: number; tilt: number; zoom: number };

const SOAP = (pose: PtzPose, token: string) =>
  `<?xml version="1.0" encoding="UTF-8"?>
<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:tptz="http://www.onvif.org/ver20/ptz/wsdl" xmlns:tt="http://www.onvif.org/ver10/schema">
  <s:Body>
    <tptz:AbsoluteMove>
      <tptz:ProfileToken>${token}</tptz:ProfileToken>
      <tptz:Position>
        <tt:PanTilt x="${pose.pan.toFixed(3)}" y="${pose.tilt.toFixed(3)}"/>
        <tt:Zoom x="${pose.zoom.toFixed(3)}"/>
      </tptz:Position>
    </tptz:AbsoluteMove>
  </s:Body>
</s:Envelope>`;

export function onvifUrl(host: string) {
  const t = host.trim();
  if (!t) return null;
  try {
    const u = new URL(t.includes("://") ? t : `http://${t}`);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (!u.pathname || u.pathname === "/") u.pathname = "/onvif/PTZ";
    return u.toString();
  } catch {
    return null;
  }
}

export async function absoluteMove(host: string, pose: PtzPose, token = "Profile_1", auth?: { user: string; pass: string }) {
  const url = onvifUrl(host);
  if (!url) return { ok: false, live: false, note: "no camera" };
  const headers: Record<string, string> = { "Content-Type": "application/soap+xml; charset=utf-8" };
  if (auth?.user) headers.Authorization = `Basic ${Buffer.from(`${auth.user}:${auth.pass}`).toString("base64")}`;
  try {
    const res = await fetch(url, { method: "POST", headers, body: SOAP(pose, token) });
    return { ok: res.ok, live: true, status: res.status, note: res.ok ? "moved" : "camera refused" };
  } catch {
    return { ok: false, live: false, note: "camera unreachable" };
  }
}
