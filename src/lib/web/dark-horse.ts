/** Dark Horse. Hidden web. Tor circuits. Rides when Punisher is blocked or the host is .onion. */
import type { Socket } from "node:net";
import tls from "node:tls";
import { isolateTag, isOnionHost, socksConnect } from "../share/onion.ts";

export type HorseHit = { title: string; url: string; text: string; rider: "darkhorse" };

function strip(html: string) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function wantsDarkHorse(raw: string) {
  try {
    const u = new URL(raw.includes("://") ? raw : `http://${raw}`);
    return isOnionHost(u.hostname) || u.hostname.endsWith(".onion");
  } catch {
    return /\.onion\b/i.test(raw);
  }
}

function rawGet(sock: Socket, url: URL, ms = 25_000): Promise<{ status: number; text: string }> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      sock.destroy();
      reject(new Error("dark horse timeout"));
    }, ms);
    const chunks: Buffer[] = [];
    const finish = (err: Error | null, out?: { status: number; text: string }) => {
      clearTimeout(timer);
      sock.removeAllListeners("data");
      sock.removeAllListeners("end");
      sock.removeAllListeners("error");
      if (err) reject(err);
      else resolve(out!);
    };
    sock.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    sock.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      const idx = raw.indexOf("\r\n\r\n");
      const head = idx >= 0 ? raw.slice(0, idx) : "";
      const body = idx >= 0 ? raw.slice(idx + 4) : raw;
      const status = Number(/HTTP\/\d(?:\.\d)?\s+(\d+)/.exec(head)?.[1] ?? 0);
      finish(null, { status, text: strip(body).slice(0, 6000) });
    });
    sock.on("error", (err) => finish(err));
    const path = `${url.pathname}${url.search}` || "/";
    sock.write(
      `GET ${path} HTTP/1.1\r\nHost: ${url.host}\r\nUser-Agent: HectorBuild/1.0\r\nAccept: text/html,text/plain\r\nConnection: close\r\n\r\n`,
    );
  });
}

export async function darkHorseFetch(raw: string, bot = "darkhorse") {
  let url: URL;
  try {
    url = new URL(raw.includes("://") ? raw : `http://${raw}`);
  } catch {
    return { rider: "darkhorse" as const, error: "Bad URL." };
  }
  const https = url.protocol === "https:";
  const port = url.port ? Number(url.port) : https ? 443 : 80;
  try {
    const sock = await socksConnect(url.hostname, port, { isolate: isolateTag(bot, url.hostname) });
    const stream: Socket = https
      ? await new Promise((resolve, reject) => {
          const secure = tls.connect({ socket: sock, servername: url.hostname, rejectUnauthorized: false }, () => resolve(secure));
          secure.on("error", reject);
        })
      : sock;
    const out = await rawGet(stream, url);
    stream.destroy();
    return { rider: "darkhorse" as const, url: url.toString(), ...out };
  } catch (err) {
    return { rider: "darkhorse" as const, error: err instanceof Error ? err.message : "Dark Horse could not reach the circuit." };
  }
}

export async function darkHorseSearch(query: string) {
  const q = query.trim().slice(0, 200);
  if (!q) return { rider: "darkhorse" as const, query: q, hits: [] as HorseHit[] };
  const ahmia = `http://juhanurmihxlpnetjednkjqdpruim6czisdtluiax74scbyej5lsoad.onion/search/?q=${encodeURIComponent(q)}`;
  const page = await darkHorseFetch(ahmia);
  if ("error" in page) return { rider: "darkhorse" as const, query: q, hits: [], note: page.error };
  const hits: HorseHit[] = [];
  const re = /href="(https?:\/\/[^"]+\.onion[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  const text = page.text ?? "";
  while ((m = re.exec(text)) && hits.length < 8) {
    hits.push({ title: (m[2] || m[1] || "").slice(0, 80), url: m[1] || "", text: "", rider: "darkhorse" });
  }
  if (!hits.length && text) hits.push({ title: q, url: ahmia, text: text.slice(0, 400), rider: "darkhorse" });
  return { rider: "darkhorse" as const, query: q, hits };
}
