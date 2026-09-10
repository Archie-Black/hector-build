import { arcadeAuthorize, arcadeCtx, arcadeExecute, arcadeList } from "./arcade";
import { gcpCall, gcpCtx, gcpList, GCP_MCP_SERVERS } from "./gcp-mcp";
import { forgeCall, forgeCtx, forgeHealth, forgeListTools } from "../ibm/contextforge";
import {
  cloudStatus,
  deleteFunction,
  deployFunction,
  getObject,
  invokeFunction,
  listFunctions,
  listObjects,
  putObject,
} from "./hector-cloud";

export type ExtInput = {
  arcadeKey?: string;
  arcadeUser?: string;
  gcpToken?: string;
  gcpProject?: string;
  gcpMcp?: string;
  ibmForge?: string;
  ibmForgeToken?: string;
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
  {
    type: "function" as const,
    function: {
      name: "ibm_forge_health",
      description: "Ping IBM ContextForge MCP gateway (Apache 2.0). Optional self-host on :4444.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "ibm_forge_list",
      description: "List tools federated by IBM ContextForge.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "ibm_forge_call",
      description: "Call a tool on IBM ContextForge by name.",
      parameters: {
        type: "object",
        properties: { tool: { type: "string" }, arguments: { type: "object" } },
        required: ["tool"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "cloud_fn_list",
      description: "List functions on Hector Cloud (this app is the cloud).",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "cloud_fn_deploy",
      description: "Deploy JS to Hector Cloud. Source must define handler(event).",
      parameters: {
        type: "object",
        properties: { name: { type: "string" }, source: { type: "string" }, entry: { type: "string" } },
        required: ["name"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "cloud_fn_invoke",
      description: "Invoke a Hector Cloud function.",
      parameters: {
        type: "object",
        properties: { name: { type: "string" }, event: { type: "object" } },
        required: ["name"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "cloud_object_put",
      description: "Store an object on Hector Cloud.",
      parameters: {
        type: "object",
        properties: { key: { type: "string" }, body: { type: "string" } },
        required: ["key", "body"],
      },
    },
  },
];

export function isExtensionTool(name: string) {
  return (
    name === "arcade_list" ||
    name === "arcade_execute" ||
    name === "gcp_mcp_list" ||
    name === "gcp_mcp_call" ||
    name === "ibm_forge_health" ||
    name === "ibm_forge_list" ||
    name === "ibm_forge_call" ||
    name === "cloud_fn_list" ||
    name === "cloud_fn_deploy" ||
    name === "cloud_fn_invoke" ||
    name === "cloud_fn_delete" ||
    name === "cloud_object_put" ||
    name === "cloud_object_get" ||
    name === "cloud_object_list" ||
    name === "cloud_status"
  );
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
    if (name === "ibm_forge_health") {
      const ctx = forgeCtx({ url: ext.ibmForge, token: ext.ibmForgeToken });
      if (!ctx) return { ok: false, detail: "Set IBM ContextForge URL (http://127.0.0.1:4444).", payload: { need: "ibm" } };
      const payload = await forgeHealth(ctx);
      return { ok: true, detail: ctx.origin, payload };
    }
    if (name === "ibm_forge_list") {
      const ctx = forgeCtx({ url: ext.ibmForge, token: ext.ibmForgeToken });
      if (!ctx) return { ok: false, detail: "Set IBM ContextForge URL.", payload: { need: "ibm" } };
      const payload = await forgeListTools(ctx);
      return { ok: true, detail: "contextforge tools", payload };
    }
    if (name === "ibm_forge_call") {
      const ctx = forgeCtx({ url: ext.ibmForge, token: ext.ibmForgeToken });
      if (!ctx) return { ok: false, detail: "Set IBM ContextForge URL.", payload: { need: "ibm" } };
      const payload = await forgeCall(ctx, String(args.tool ?? args.name ?? ""), (args.arguments as Record<string, unknown>) ?? {});
      return { ok: true, detail: String(args.tool ?? ""), payload };
    }
    if (name === "cloud_status") return { ok: true, detail: "hector-cloud", payload: cloudStatus() };
    if (name === "cloud_fn_list") return { ok: true, detail: "functions", payload: listFunctions().map(({ source: _s, ...r }) => r) };
    if (name === "cloud_fn_deploy") {
      const fn = deployFunction({ name: String(args.name), source: args.source ? String(args.source) : undefined, entry: args.entry ? String(args.entry) : undefined });
      return { ok: true, detail: fn.name, payload: fn };
    }
    if (name === "cloud_fn_invoke") {
      const payload = await invokeFunction(String(args.name), args.event ?? {});
      return { ok: true, detail: String(args.name), payload };
    }
    if (name === "cloud_fn_delete") return { ok: true, detail: "delete", payload: { deleted: deleteFunction(String(args.name)) } };
    if (name === "cloud_object_put") return { ok: true, detail: String(args.key), payload: putObject(String(args.key), String(args.body ?? "")) };
    if (name === "cloud_object_get") return { ok: true, detail: String(args.key), payload: getObject(String(args.key)) };
    if (name === "cloud_object_list") return { ok: true, detail: "objects", payload: listObjects() };
    return { ok: false, detail: `Unknown extension ${name}`, payload: { error: name } };
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return { ok: false, detail, payload: { error: detail } };
  }
}

export function extensionStatus(ext: ExtInput) {
  return {
    hectorCloud: true,
    arcade: Boolean(arcadeCtx({ apiKey: ext.arcadeKey, userId: ext.arcadeUser })),
    gcp: Boolean(gcpCtx({ token: ext.gcpToken, project: ext.gcpProject, server: ext.gcpMcp })),
    ibmForge: Boolean(forgeCtx({ url: ext.ibmForge, token: ext.ibmForgeToken })),
    gcpServers: Object.keys(GCP_MCP_SERVERS),
    mcp: "/api/v1/mcp",
    functions: "/api/v1/functions",
  };
}
