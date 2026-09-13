#!/usr/bin/env node
/** Watch Ardour bounces. Hash into the vault. Watermark is applied in Forge/Hector. */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { watch } from "node:fs";
import { basename, join } from "node:path";
import { homedir } from "node:os";

const root = process.env.V01D_STUDIO || join(homedir(), "v01d/studio");
const bounces = join(root, "bounces");
const vault = join(root, "vault");
await mkdir(bounces, { recursive: true });
await mkdir(vault, { recursive: true });
const seen = new Set();

async function take(name) {
  if (seen.has(name) || !/\.(wav|mp3|flac|aiff)$/i.test(name)) return;
  seen.add(name);
  const src = join(bounces, name);
  const bytes = await readFile(src);
  const sha = createHash("sha256").update(bytes).digest("hex");
  const stamp = new Date().toISOString();
  const receipt = {
    title: name,
    stamp,
    sha256: sha,
    note: "Hash of the bounce as written. Open Forge to watermark PCM and file rights. SOCAN for royalties.",
  };
  await writeFile(join(vault, `${stamp.slice(0, 10)}-${sha.slice(0, 12)}.json`), JSON.stringify(receipt, null, 2));
  console.log("Forge vaulted", name, sha.slice(0, 16));
}

watch(bounces, (_, name) => {
  if (name) void take(name).catch(() => {});
});
console.log("Forge watching", bounces);
