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
import { localChatCompletion } from "./local-turn";

type Rpc = { jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown> };

const TOOLS = [
  { name: "hector_chat", description: "Talk to Hector Cloud (local engine).", inputSchema: { type: "object", properties: { prompt: { type: "string" } }, required: ["prompt"] } },
  { name: "cloud_status", description: "Hector Cloud control plane status.", inputSchema: { type: "object", properties: {} } },
  { name: "cloud_fn_list", description: "List Hector Cloud functions.", inputSchema: { type: "object", properties: {} } },
  { name: "cloud_fn_deploy", description: "Deploy a JS function. handler(event) required.", inputSchema: { type: "object", properties: { name: { type: "string" }, source: { type: "string" }, entry: { type: "string" } }, required: ["name"] } },
  { name: "cloud_fn_invoke", description: "Invoke a Hector Cloud function.", inputSchema: { type: "object", properties: { name: { type: "string" }, event: { type: "object" } }, required: ["name"] } },
  { name: "cloud_fn_delete", description: "Delete a Hector Cloud function.", inputSchema: { type: "object", properties: { name: { type: "string" } }, required: ["name"] } },
  { name: "cloud_object_put", description: "Put an object in Hector Cloud storage.", inputSchema: { type: "object", properties: { key: { type: "string" }, body: { type: "string" } }, required: ["key", "body"] } },
  { name: "cloud_object_get", description: "Get an object from Hector Cloud storage.", inputSchema: { type: "object", properties: { key: { type: "string" } }, required: ["key"] } },
  { name: "cloud_object_list", description: "List Hector Cloud objects.", inputSchema: { type: "object", properties: {} } },
];

function ok(id: Rpc["id"], result: unknown) {
  return { jsonrpc: "2.0", id: id ?? null, result };
}
function fail(id: Rpc["id"], message: string, code = -32000) {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message } };
}
function toolText(data: unknown) {
  return { content: [{ type: "text", text: typeof data === "string" ? data : JSON.stringify(data, null, 2) }] };
}

export async function handleMcp(raw: Rpc) {
  const method = raw.method || "";
  const id = raw.id ?? null;
  const p = raw.params ?? {};

  if (method === "initialize") {
    return ok(id, {
      protocolVersion: "2025-11-25",
      capabilities: { tools: {}, resources: {} },
      serverInfo: { name: "hector-cloud", version: "1.0.0" },
    });
  }
  if (method === "notifications/initialized" || method === "ping") return ok(id, {});
  if (method === "tools/list") return ok(id, { tools: TOOLS });
  if (method === "resources/list") {
    return ok(id, {
      resources: [
        { uri: "hector://cloud/status", name: "Hector Cloud status", mimeType: "application/json" },
        ...listFunctions().map((fn) => ({ uri: `hector://functions/${fn.name}`, name: fn.name, mimeType: "application/json" })),
      ],
    });
  }
  if (method === "resources/read") {
    const uri = String(p.uri ?? "");
    if (uri === "hector://cloud/status") return ok(id, { contents: [{ uri, text: JSON.stringify(cloudStatus(), null, 2) }] });
    const fnName = uri.replace(/^hector:\/\/functions\//, "");
    const fn = listFunctions().find((f) => f.name === fnName);
    if (!fn) return fail(id, "unknown resource", -32602);
    return ok(id, { contents: [{ uri, text: JSON.stringify(fn, null, 2) }] });
  }
  if (method !== "tools/call") return fail(id, `unknown method ${method}`, -32601);

  const name = String(p.name ?? "");
  const args = (p.arguments && typeof p.arguments === "object" ? p.arguments : {}) as Record<string, unknown>;
  try {
    if (name === "hector_chat") {
      const prompt = String(args.prompt ?? "");
      const out = localChatCompletion({ messages: [{ role: "user", content: prompt }] });
      const text = (out as { choices?: { message?: { content?: string } }[] }).choices?.[0]?.message?.content ?? "";
      return ok(id, toolText(text));
    }
    if (name === "cloud_status") return ok(id, toolText(cloudStatus()));
    if (name === "cloud_fn_list") return ok(id, toolText(listFunctions().map(({ source, ...rest }) => rest)));
    if (name === "cloud_fn_deploy") return ok(id, toolText(deployFunction({ name: String(args.name), source: args.source ? String(args.source) : undefined, entry: args.entry ? String(args.entry) : undefined })));
    if (name === "cloud_fn_invoke") return ok(id, toolText(await invokeFunction(String(args.name), args.event ?? {})));
    if (name === "cloud_fn_delete") return ok(id, toolText({ deleted: deleteFunction(String(args.name)) }));
    if (name === "cloud_object_put") return ok(id, toolText(putObject(String(args.key), String(args.body ?? ""))));
    if (name === "cloud_object_get") return ok(id, toolText(getObject(String(args.key))));
    if (name === "cloud_object_list") return ok(id, toolText(listObjects()));
    return fail(id, `unknown tool ${name}`, -32601);
  } catch (err) {
    return fail(id, err instanceof Error ? err.message : String(err));
  }
}

export const HECTOR_MCP_TOOLS = TOOLS;
