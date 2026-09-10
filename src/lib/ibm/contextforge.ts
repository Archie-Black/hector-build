import { safeOllamaOrigin } from "../ollama/home.ts";

export type ForgeCtx = { origin: string; token: string; alwaysOn: true; via: "ibm" | "hector" };

export const LOCAL_FORGE: ForgeCtx = { origin: "hector://contextforge", token: "", alwaysOn: true, via: "hector" };

function headers(ctx: ForgeCtx) {
  const h: Record<string, string> = { Accept: "application/json", "Content-Type": "application/json" };
  if (ctx.token) h.Authorization = `Bearer ${ctx.token}`;
  return h;
}

function remoteFrom(url?: string, token?: string): ForgeCtx | null {
  const envUrl = typeof process !== "undefined" ? process.env.HECTOR_IBM_FORGE_URL || "" : "";
  const envTok = typeof process !== "undefined" ? process.env.HECTOR_IBM_FORGE_TOKEN || "" : "";
  const origin = safeOllamaOrigin((url || envUrl || "http://127.0.0.1:4444").trim());
  if (!origin) return null;
  return { origin, token: (token || envTok).trim(), alwaysOn: true, via: "ibm" };
}

/** Always a live gateway. IBM :4444 if you typed it; otherwise Hector. Never off. */
export function forgeCtx(input: { url?: string; token?: string } = {}): ForgeCtx {
  return remoteFrom(input.url, input.token) ?? LOCAL_FORGE;
}

async function ping(ctx: ForgeCtx, ms = 400) {
  if (ctx.via === "hector") return true;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(`${ctx.origin}/health`, { signal: ctrl.signal, headers: headers(ctx) });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

let cache: { at: number; ctx: ForgeCtx } | null = null;

export async function liveForge(input: { url?: string; token?: string } = {}): Promise<ForgeCtx> {
  if (cache && Date.now() - cache.at < 15_000) return cache.ctx;
  const remote = remoteFrom(input.url, input.token);
  if (remote && (await ping(remote))) {
    cache = { at: Date.now(), ctx: remote };
    return remote;
  }
  cache = { at: Date.now(), ctx: LOCAL_FORGE };
  return LOCAL_FORGE;
}

export async function forgeHealth(ctx: ForgeCtx) {
  if (ctx.via === "hector") {
    return { status: "healthy", gateway: "hector-contextforge", alwaysOn: true, via: "hector" };
  }
  const res = await fetch(`${ctx.origin}/health`, { headers: headers(ctx) });
  const text = await res.text();
  let json: unknown = text;
  try {
    json = JSON.parse(text);
  } catch {
    /* text */
  }
  if (!res.ok) throw new Error(`ContextForge health ${res.status}`);
  return json;
}

export async function forgeRpc(ctx: ForgeCtx, method: string, params: Record<string, unknown> = {}) {
  if (ctx.via === "hector") {
    const { handleMcp } = await import("../hector-api/mcp-server.ts");
    const out = await handleMcp({ jsonrpc: "2.0", id: 1, method, params });
    const err = (out as { error?: { message?: string } }).error;
    if (err) throw new Error(err.message || method);
    return (out as { result?: unknown }).result;
  }
  const body = { jsonrpc: "2.0", id: 1, method, params };
  const paths = ["/rpc", "/mcp", "/"];
  let last = "no response";
  for (const path of paths) {
    try {
      const res = await fetch(`${ctx.origin}${path}`, {
        method: "POST",
        headers: headers(ctx),
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { result?: unknown; error?: { message?: string } };
      if (res.ok && !data.error) return data.result;
      last = data.error?.message || `HTTP ${res.status}`;
    } catch (err) {
      last = err instanceof Error ? err.message : String(err);
    }
  }
  throw new Error(`ContextForge ${method}: ${last}`);
}

export async function forgeListTools(ctx: ForgeCtx) {
  const result = (await forgeRpc(ctx, "tools/list")) as { tools?: unknown };
  return result?.tools ?? result;
}

export async function forgeCall(ctx: ForgeCtx, name: string, args: Record<string, unknown>) {
  return forgeRpc(ctx, "tools/call", { name, arguments: args });
}
