#!/usr/bin/env node
import { execSync } from "node:child_process";
import { chmodSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
if (!existsSync(join(root, ".git"))) process.exit(0);
const dir = join(root, ".githooks");
if (!existsSync(dir)) process.exit(0);
execSync("git config core.hooksPath .githooks", { stdio: "inherit" });
for (const name of readdirSync(dir)) {
  if (name.startsWith(".")) continue;
  try {
    chmodSync(join(dir, name), 0o755);
  } catch {
    /* windows */
  }
}
const env = { ...process.env, PATH: `${process.env.HOME || ""}/.local/bin:${process.env.PATH || ""}` };
try {
  execSync("pre-commit --version", { stdio: "ignore", env });
  execSync("pre-commit install-hooks", { stdio: "inherit", env });
} catch {
  console.warn("pre-commit not on PATH; .githooks/pre-commit will use the local secret scan.");
}
