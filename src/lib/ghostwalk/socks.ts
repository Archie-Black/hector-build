/** SOCKS5 CONNECT for local Tor. Clearnet fetch if Tor is cold. */
import net from "node:net";

export type Hop = { ok: boolean; tor: boolean; status: number; ctype: string; body: string; note: string };

const TOR = { host: "127.0.0.1", port: 9050 };

export async function torUp(ms = 400): Promise<boolean> {
  return await new Promise((resolve) => {
    const s = net.connect({ host: TOR.host, port: TOR.port });
    const t = setTimeout(() => {
      s.destroy();
      resolve(false);
    }, ms);
    s.on("connect", () => {
      clearTimeout(t);
      s.end();
      resolve(true);
    });
    s.on("error", () => {
      clearTimeout(t);
      resolve(false);
    });
  });
}

export async function socksFetch(href: string, headers: Record<string, string>, timeout = 18000): Promise<Hop> {
  const url = new URL(href);
  const port = url.port ? Number(url.port) : url.protocol === "https:" ? 443 : 80;
  const onion = url.hostname.endsWith(".onion");
  const live = await torUp();
  if (onion && !live) {
    return { ok: false, tor: false, status: 0, ctype: "text/plain", body: "", note: "Tor is off. Onion waits." };
  }
  if (live) {
    try {
      const raw = await viaSocks(url, port, headers, timeout);
      return { ...raw, tor: true };
    } catch {
      if (onion) return { ok: false, tor: true, status: 0, ctype: "text/plain", body: "", note: "Circuit failed." };
    }
  }
  const res = await fetch(href, { headers, redirect: "follow", signal: AbortSignal.timeout(timeout) });
  const ctype = res.headers.get("content-type") || "text/plain";
  const body = await res.text();
  return { ok: res.ok, tor: false, status: res.status, ctype, body, note: live ? "fell back" : "direct" };
}

function viaSocks(url: URL, port: number, headers: Record<string, string>, timeout: number): Promise<Omit<Hop, "tor">> {
  return new Promise((resolve, reject) => {
    const sock = net.connect({ host: TOR.host, port: TOR.port });
    const t = setTimeout(() => {
      sock.destroy();
      reject(new Error("timeout"));
    }, timeout);
    const host = url.hostname;
    sock.once("connect", () => sock.write(Buffer.from([0x05, 0x01, 0x00])));
    let stage: "hello" | "req" | "http" = "hello";
    let buf = Buffer.alloc(0);
    sock.on("data", (chunk) => {
      buf = Buffer.concat([buf, chunk]);
      if (stage === "hello") {
        if (buf.length < 2) return;
        if (buf[0] !== 0x05 || buf[1] !== 0x00) {
          sock.destroy();
          reject(new Error("socks"));
          return;
        }
        buf = Buffer.alloc(0);
        const hb = Buffer.from(host, "utf8");
        const req = Buffer.alloc(7 + hb.length);
        req[0] = 0x05;
        req[1] = 0x01;
        req[2] = 0x00;
        req[3] = 0x03;
        req[4] = hb.length;
        hb.copy(req, 5);
        req.writeUInt16BE(port, 5 + hb.length);
        stage = "req";
        sock.write(req);
        return;
      }
      if (stage === "req") {
        if (buf.length < 2) return;
        if (buf[1] !== 0x00) {
          sock.destroy();
          reject(new Error("connect"));
          return;
        }
        buf = Buffer.alloc(0);
        stage = "http";
        const path = `${url.pathname}${url.search}` || "/";
        const head = Object.entries({ Host: host, Connection: "close", ...headers })
          .map(([k, v]) => `${k}: ${v}`)
          .join("\r\n");
        sock.write(`GET ${path} HTTP/1.1\r\n${head}\r\n\r\n`);
        return;
      }
    });
    sock.on("end", () => {
      clearTimeout(t);
      const text = buf.toString("utf8");
      const split = text.indexOf("\r\n\r\n");
      const head = split >= 0 ? text.slice(0, split) : "";
      const body = split >= 0 ? text.slice(split + 4) : text;
      const status = Number(/HTTP\/1\.\d (\d+)/.exec(head)?.[1] || 0);
      const ctype = /content-type:\s*([^\r\n]+)/i.exec(head)?.[1] || "text/plain";
      resolve({ ok: status >= 200 && status < 400, status, ctype, body, note: "tor" });
    });
    sock.on("error", (e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}
