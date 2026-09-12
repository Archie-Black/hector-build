#!/usr/bin/env node
import { spawn } from "node:child_process";
import { createConnection } from "node:net";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const prefix = process.env.HECTOR_PREFIX || join(process.env.HOME || "/tmp", ".local/share/hector-build");
const nodeBin = join(prefix, "runtime/node/bin/node");
const npmBin = join(prefix, "runtime/node/bin/npm");
const port = Number(process.env.PORT || 8080);

function wait(ms = 20000) {
  const t0 = Date.now();
  return new Promise((ok, no) => {
    const tick = () => {
      const s = createConnection({ host: "127.0.0.1", port }, () => {
        s.end();
        ok(true);
      });
      s.on("error", () => {
        if (Date.now() - t0 > ms) no(new Error("Hector server did not start. Node 22 should live in runtime/node. Re-run packaging/linux/install-node22.sh"));
        else setTimeout(tick, 250);
      });
    };
    tick();
  });
}

const bin = process.execPath.includes("node") && process.version.startsWith("v22") ? process.execPath : nodeBin;
const child = spawn(bin, [join(root, "node_modules/vite/bin/vite.js"), "dev", "--host", "0.0.0.0", "--port", String(port)], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, PATH: `${join(prefix, "runtime/node/bin")}:${process.env.PATH || ""}` },
});
await wait();
const open = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
spawn(open, [`http://127.0.0.1:${port}`], { stdio: "ignore", detached: true }).unref();
child.on("exit", (c) => process.exit(c ?? 0));
