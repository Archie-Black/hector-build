import { safeOllamaOrigin } from "../ollama/home.ts";

export type ForgeCtx = { origin: string; token: string };

export function forgeCtx(input: { url?: string; token?: string }): ForgeCtx | null {
  const envUrl = typeof process !== "undefined" ? process.env.HECTOR_IBM_FORGE_URL || "" : "";
  const envTok = typeof process !== "undefined" ? process.env.HECTOR_IBM_FORGE_TOKEN || "" : "";
  const origin = safeOllamaOrigin((input.url || envUrl).trim());
  if (!origin) return null;
  return { origin, token: (input.token || envTok).trim() };
}

function headers(ctx: ForgeCtx) {
  const h: Record<string, string> = { Accept: "application/json", "Content-Type": "application/json" };
  if (ctx.token) h.Authorization = `Bearer ${ctx.token}`;
  return h;
}

export async function forgeHealth(ctx: ForgeCtx) {
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
