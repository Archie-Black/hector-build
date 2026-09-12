import { createFileRoute } from "@tanstack/react-router";
import dgram from "node:dgram";

export const Route = createFileRoute("/api/v1/time")({
  server: {
    handlers: {
      GET: async () => {
        const ntp = await ntpMs().catch(() => Date.now());
        return Response.json({ now: ntp, sys: Date.now() });
      },
    },
  },
});

function ntpMs(): Promise<number> {
  return new Promise((resolve, reject) => {
    const buf = Buffer.alloc(48);
    buf[0] = 0x1b;
    const sock = dgram.createSocket("udp4");
    const t = setTimeout(() => {
      sock.close();
      reject(new Error("ntp"));
    }, 1600);
    sock.once("message", (msg) => {
      clearTimeout(t);
      sock.close();
      const sec = msg.readUInt32BE(40);
      resolve((sec - 2208988800) * 1000);
    });
    sock.once("error", (e) => {
      clearTimeout(t);
      sock.close();
      reject(e);
    });
    sock.send(buf, 123, "pool.ntp.org");
  });
}
