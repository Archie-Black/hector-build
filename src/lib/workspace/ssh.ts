import { createServerFn } from "@tanstack/react-start";
import { execSsh } from "@/lib/share/term";

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
    return execSsh({
      host: data.host,
      port: data.port,
      username: data.username,
      password: data.password,
      command: data.command,
      collab: false,
      bot: "hector",
    });
  });
