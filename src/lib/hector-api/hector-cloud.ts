import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(process.cwd(), "data", "cloud");
const FN_DIR = join(ROOT, "functions");
const OBJ_DIR = join(ROOT, "objects");
const LOG_DIR = join(ROOT, "logs");

export const HECTOR_CLOUD = {
  id: "hector-cloud",
  name: "Hector Cloud",
  provider: "hector-build",
  region: "local",
  api: "/api/v1",
  mcp: "/api/v1/mcp",
  functions: "/api/v1/functions",
};

export type CloudFn = {
  name: string;
  runtime: "hector-js";
  entry: string;
  source: string;
  createdAt: number;
  updatedAt: number;
  invokes: number;
};

function boot() {
  for (const d of [FN_DIR, OBJ_DIR, LOG_DIR]) mkdirSync(d, { recursive: true });
}

function seedHello() {
  boot();
  const p = join(FN_DIR, "hello.json");
  if (existsSync(p)) return;
  writeFileSync(
    p,
    JSON.stringify(
      {
        name: "hello",
        runtime: "hector-js",
        entry: "handler",
        source: `async function handler(event) {\n  return { ok: true, cloud: "hector", echo: event, at: Date.now() };\n}\n`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        invokes: 0,
      } satisfies CloudFn,
      null,
      2,
    ),
  );
}

function safeName(raw: string) {
  const n = raw.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 48);
  if (!n || n.startsWith("-")) throw new Error("bad function name");
  return n;
}

function fnPath(name: string) {
  return join(FN_DIR, `${safeName(name)}.json`);
}

function saveFn(fn: CloudFn) {
  boot();
  writeFileSync(fnPath(fn.name), JSON.stringify(fn, null, 2));
}

export function cloudStatus() {
  seedHello();
  return {
    ...HECTOR_CLOUD,
    functions: listFunctions().length,
    objects: listObjects().length,
    ready: true,
  };
}

export function listFunctions(): CloudFn[] {
  seedHello();
  return readdirSync(FN_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(join(FN_DIR, f), "utf8")) as CloudFn)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getFunction(name: string): CloudFn | null {
  seedHello();
  const p = fnPath(name);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, "utf8")) as CloudFn;
}

export function deployFunction(input: { name: string; source?: string; entry?: string }) {
  const name = safeName(input.name);
  const prev = getFunction(name);
  const fn: CloudFn = {
    name,
    runtime: "hector-js",
    entry: input.entry || prev?.entry || "handler",
    source: (input.source || prev?.source || "async function handler(event) { return { ok: true, name: 'empty' }; }").slice(0, 80_000),
    createdAt: prev?.createdAt ?? Date.now(),
    updatedAt: Date.now(),
    invokes: prev?.invokes ?? 0,
  };
  saveFn(fn);
  logLine(name, "deploy");
  return fn;
}

export function deleteFunction(name: string) {
  const p = fnPath(name);
  if (!existsSync(p)) return false;
  rmSync(p);
  logLine(name, "delete");
  return true;
}

function logLine(name: string, event: string, extra?: unknown) {
  boot();
  const line = JSON.stringify({ at: Date.now(), name, event, extra: extra ?? null }) + "\n";
  writeFileSync(join(LOG_DIR, `${safeName(name)}.log`), line, { flag: "a" });
}

export async function invokeFunction(name: string, event: unknown) {
  const fn = getFunction(name);
  if (!fn) throw new Error(`function ${name} not found`);
  const started = Date.now();
  const exports: Record<string, unknown> = {};
  const mod = { exports };
  const wrapped = `"use strict";\n${fn.source}\nconst __h = (typeof ${fn.entry} === "function" ? ${fn.entry} : (module.exports.${fn.entry} || module.exports.handler || module.exports.default || exports.default));\nreturn __h;`;
  let handler: unknown;
  try {
    handler = new Function("event", "exports", "module", wrapped)(event, exports, mod);
  } catch (err) {
    logLine(name, "error", String(err));
    throw err;
  }
  if (typeof handler !== "function") throw new Error("function has no handler");
  const result = await Promise.race([
    Promise.resolve((handler as (e: unknown) => unknown)(event)),
    new Promise((_, rej) => setTimeout(() => rej(new Error("function timeout 8s")), 8000)),
  ]);
  fn.invokes += 1;
  saveFn(fn);
  logLine(name, "invoke", { ms: Date.now() - started });
  return { name, ms: Date.now() - started, result };
}

function objPath(key: string) {
  const k = key.replace(/[^a-zA-Z0-9._/-]/g, "").replace(/^\/+/, "").slice(0, 180);
  if (!k || k.includes("..")) throw new Error("bad object key");
  return join(OBJ_DIR, k);
}

export function putObject(key: string, body: string) {
  boot();
  const p = objPath(key);
  mkdirSync(join(p, ".."), { recursive: true });
  writeFileSync(p, body.slice(0, 2_000_000));
  return { key, bytes: body.length };
}

export function getObject(key: string) {
  const p = objPath(key);
  if (!existsSync(p)) return null;
  return { key, body: readFileSync(p, "utf8") };
}

export function listObjects() {
  seedHello();
  const out: string[] = [];
  const walk = (dir: string, prefix: string) => {
    for (const name of readdirSync(dir, { withFileTypes: true })) {
      const rel = prefix ? `${prefix}/${name.name}` : name.name;
      if (name.isDirectory()) walk(join(dir, name.name), rel);
      else out.push(rel);
    }
  };
  walk(OBJ_DIR, "");
  return out.slice(0, 400);
}
