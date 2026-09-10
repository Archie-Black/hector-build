import { arcadeAuthorize, arcadeCtx, arcadeExecute, arcadeList } from "./arcade";
import { gcpCall, gcpCtx, gcpList, GCP_MCP_SERVERS } from "./gcp-mcp";

export type ExtInput = {
  arcadeKey?: string;
  arcadeUser?: string;
  gcpToken?: string;
  gcpProject?: string;
  gcpMcp?: string;
};

export const EXTENSION_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "arcade_list",
      description: "List Arcade.dev tools (Gmail, Slack, GitHub, Google, …). Requires ARCADE_API_KEY.",
      parameters: {
        type: "object",
        properties: { toolkit: { type: "string", description: "Optional toolkit name, e.g. Google or Slack" } },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "arcade_execute",
      description: "Run one Arcade tool by name with JSON input. If OAuth is needed, returns an authorize URL.",
      parameters: {
        type: "object",
        properties: {
          tool: { type: "string" },
          input: { type: "object" },
        },
        required: ["tool"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "gcp_mcp_list",
      description:
        "List Google Cloud MCP tools on cli, bigquery, storage, compute, run, firestore. Requires a GCP access token.",
      parameters: {
        type: "object",
        properties: { server: { type: "string", description: "cli | bigquery | storage | compute | run | firestore" } },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "gcp_mcp_call",
      description: "Call a Google Cloud MCP tool (JSON-RPC tools/call). Token + project in settings or env.",
      parameters: {
        type: "object",
        properties: {
          server: { type: "string" },
          tool: { type: "string" },
          arguments: { type: "object" },
        },
        required: ["tool"],
      },
    },
  },
];

export function isExtensionTool(name: string) {
  return name === "arcade_list" || name === "arcade_execute" || name === "gcp_mcp_list" || name === "gcp_mcp_call";
}

export async function executeExtension(name: string, args: Record<string, unknown>, ext: ExtInput) {
  try {
    if (name === "arcade_list") {
      const ctx = arcadeCtx({ apiKey: ext.arcadeKey, userId: ext.arcadeUser });
      if (!ctx) return { ok: false, detail: "Set ARCADE_API_KEY in System settings or env.", payload: { need: "arcade" } };
      const payload = await arcadeList(ctx, args.toolkit ? String(args.toolkit) : undefined);
      return { ok: true, detail: "arcade tools", payload };
    }
    if (name === "arcade_execute") {
      const ctx = arcadeCtx({ apiKey: ext.arcadeKey, userId: ext.arcadeUser });
      if (!ctx) return { ok: false, detail: "Set ARCADE_API_KEY.", payload: { need: "arcade" } };
      const tool = String(args.tool ?? args.tool_name ?? "");
      const input = (args.input && typeof args.input === "object" ? args.input : {}) as Record<string, unknown>;
      try {
        const payload = await arcadeExecute(ctx, tool, input);
        return { ok: true, detail: tool, payload };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (/auth|oauth|authorize/i.test(msg)) {
          const auth = await arcadeAuthorize(ctx, tool).catch(() => ({ error: msg }));
          return { ok: false, detail: "Arcade needs user authorization", payload: auth };
        }
        throw err;
      }
    }
    if (name === "gcp_mcp_list") {
      const ctx = gcpCtx({ token: ext.gcpToken, project: ext.gcpProject, server: String(args.server ?? ext.gcpMcp ?? "cli") });
      if (!ctx) return { ok: false, detail: "Set a Google Cloud access token (OAuth, cloud-platform scope).", payload: { need: "gcp", servers: Object.keys(GCP_MCP_SERVERS) } };
      const payload = await gcpList(ctx);
      return { ok: true, detail: ctx.server, payload };
    }
    if (name === "gcp_mcp_call") {
      const ctx = gcpCtx({ token: ext.gcpToken, project: ext.gcpProject, server: String(args.server ?? ext.gcpMcp ?? "cli") });
      if (!ctx) return { ok: false, detail: "Set a Google Cloud access token.", payload: { need: "gcp" } };
      const payload = await gcpCall(ctx, String(args.tool ?? args.name ?? ""), (args.arguments as Record<string, unknown>) ?? {});
      return { ok: true, detail: String(args.tool ?? ""), payload };
    }
    return { ok: false, detail: `Unknown extension ${name}`, payload: { error: name } };
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return { ok: false, detail, payload: { error: detail } };
  }
}

export function extensionStatus(ext: ExtInput) {
  return {
    arcade: Boolean(arcadeCtx({ apiKey: ext.arcadeKey, userId: ext.arcadeUser })),
    gcp: Boolean(gcpCtx({ token: ext.gcpToken, project: ext.gcpProject, server: ext.gcpMcp })),
    gcpServers: Object.keys(GCP_MCP_SERVERS),
  };
}
