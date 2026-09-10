#!/usr/bin/env node
/** Staged-file secret scan. Used by .githooks/pre-commit. */
import { readFileSync, existsSync } from "node:fs";

const BAD_NAME = /(^|\/)\.env(\..+)?$|(^|\/)id_rsa$|\.pem$|winamp_latest_full\.exe$/i;
const BAD_LINE =
  /\b(xai-[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN (RSA |OPENSSH )?PRIVATE KEY-----)\b/;

export function scanPaths(paths) {
  const hits = [];
  for (const path of paths) {
    const p = path.trim();
    if (!p) continue;
    if (BAD_NAME.test(p)) hits.push({ path: p, why: "blocked name" });
    if (!existsSync(p)) continue;
    if (/\.(png|jpg|jpeg|webp|gif|wasm|exe|iso|zip|woff2)$/i.test(p)) continue;
    let text = "";
    try {
      text = readFileSync(p, "utf8");
    } catch {
      continue;
    }
    text.split("\n").forEach((line, i) => {
      if (BAD_LINE.test(line)) hits.push({ path: p, why: `line ${i + 1}` });
    });
  }
  return hits;
}

function cliPaths() {
  const args = process.argv.slice(2).filter(Boolean);
  if (args.length) return args;
  if (process.stdin.isTTY) return [];
  return readFileSync(0, "utf8").split(/\r?\n/);
}

const running = process.argv[1] && /hook-scan\.mjs$/.test(process.argv[1].replaceAll("\\", "/"));
if (running) {
  const hits = scanPaths(cliPaths());
  if (hits.length) {
    for (const h of hits) console.error(`${h.path}: ${h.why}`);
    process.exit(1);
  }
}
