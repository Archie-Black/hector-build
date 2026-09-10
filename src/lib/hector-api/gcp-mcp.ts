import { env } from "@/lib/env.server";

export const GCP_MCP_SERVERS: Record<string, string> = {
  cli: "https://cloudcli.googleapis.com/mcp",
  bigquery: "https://bigquery.googleapis.com/mcp",
  storage: "https://storage.googleapis.com/mcp",
  compute: "https://compute.googleapis.com/mcp",
  run: "https://run.googleapis.com/mcp",
  functions: "https://cloudfunctions.googleapis.com/mcp",
  firestore: "https://firestore.googleapis.com/mcp",
  resource: "https://cloudresourcemanager.googleapis.com/mcp",
};

export type GcpCtx = {
  token: string;
  project: string;
  server: string;
};

export function gcpCtx(input?: { token?: string; project?: string; server?: string }): GcpCtx | null {
  const token = (input?.token || env("GOOGLE_CLOUD_ACCESS_TOKEN") || env("GCP_ACCESS_TOKEN") || "").trim();
  if (token.length < 12) return null;
  const serverKey = (input?.server || env("GOOGLE_CLOUD_MCP") || "cli").toLowerCase();
  const server = GCP_MCP_SERVERS[serverKey] || (serverKey.startsWith("https://") ? serverKey : GCP_MCP_SERVERS.cli);
  const project = (input?.project || env("GOOGLE_CLOUD_PROJECT") || env("GCP_PROJECT") || "").trim();
  return { token, project, server };
}

type Rpc = { jsonrpc: "2.0"; id: number; result?: unknown; error?: { message?: string; code?: number } };

async function mcp(ctx: GcpCtx, method: string, params?: Record<string, unknown>) {
  const res = await fetch(ctx.server, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ctx.token}`,
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      ...(ctx.project ? { "x-goog-user-project": ctx.project } : {}),
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now() % 1_000_000,
      method,
      params: params ?? {},
    }),
  });
  const text = await res.text();
  const jsonLine = text.startsWith("data:")
    ? text
        .split("\n")
        .filter((l) => l.startsWith("data:"))
        .map((l) => l.slice(5).trim())
        .find((l) => l.startsWith("{"))
    : text;
  let body: Rpc;
  try {
    body = JSON.parse(jsonLine || text) as Rpc;
  } catch {
    throw new Error(`GCP MCP ${res.status}: ${text.slice(0, 300)}`);
  }
  if (!res.ok || body.error) {
    throw new Error(body.error?.message || `GCP MCP ${res.status}`);
  }
  return body.result;
}

export async function gcpList(ctx: GcpCtx) {
  await mcp(ctx, "initialize", {
    protocolVersion: "2025-11-25",
    capabilities: {},
    clientInfo: { name: "hector-build", version: "1.0" },
  }).catch(() => null);
  return mcp(ctx, "tools/list");
}

export async function gcpCall(ctx: GcpCtx, name: string, args: Record<string, unknown>) {
  const params: Record<string, unknown> = { name, arguments: { ...args } };
  if (ctx.project && params.arguments && typeof params.arguments === "object") {
    const a = params.arguments as Record<string, unknown>;
    if (!a.project && !a.projectId) a.project = ctx.project;
  }
  return mcp(ctx, "tools/call", params);
}
