import { createServerFn } from "@tanstack/react-start";
import { Client } from "ssh2";

type SshInput = {
  host: string;
  port?: number;
  username: string;
  password: string;
  command: string;
};

export const runSsh = createServerFn({ method: "POST" })
  .validator((input: SshInput) => input)
  .handler(async ({ data }) => {
    const host = data.host.trim();
    const username = data.username.trim();
    const command = data.command.slice(0, 2000);
    const port = data.port && data.port > 0 ? data.port : 22;
    if (!host || !username || !command) {
      return { ok: false, output: "Host, user, and command are required." };
    }
    if (/\s/.test(host) || host.length > 253) {
      return { ok: false, output: "Invalid host." };
    }

    return await new Promise<{ ok: boolean; output: string }>((resolve) => {
      const conn = new Client();
      const timer = setTimeout(() => {
        conn.end();
        resolve({ ok: false, output: "SSH timed out." });
      }, 15000);
      conn
        .on("ready", () => {
          conn.exec(command, (err, stream) => {
            if (err) {
              clearTimeout(timer);
              conn.end();
              resolve({ ok: false, output: err.message });
              return;
            }
            let out = "";
            stream
              .on("data", (chunk: Buffer) => {
                out += chunk.toString();
              })
              .stderr.on("data", (chunk: Buffer) => {
                out += chunk.toString();
              });
            stream.on("close", () => {
              clearTimeout(timer);
              conn.end();
              resolve({ ok: true, output: out.slice(0, 8000) || "(no output)" });
            });
          });
        })
        .on("error", (err) => {
          clearTimeout(timer);
          resolve({ ok: false, output: err.message });
        })
        .connect({
          host,
          port,
          username,
          password: data.password,
          readyTimeout: 12000,
        });
    });
  });
