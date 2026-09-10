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
import { ackNote, backendLinks, joinPeer, leasePath, postNote, pullRoom, registerLink, shareStatus, syncFile } from "@/lib/share/room";
import { describeLink, execSsh, listTerms, openTerm, readTerm, writeTerm } from "@/lib/share/term";
import { onionStatus, startOnionDaemon, newNym } from "@/lib/share/onion";
import { autoRevoke, authorizeKey, generateIdentity, keyStatus, listIdentities, revokeKey, rotateHostKey, rotateIdentity, settleRotations } from "@/lib/share/keys";
import { isOnionHost } from "@/lib/share/wire";
import { rideFetch, rideSearch } from "@/lib/web/ride";
import { embodiedTick } from "@/lib/vision";

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
  { name: "share_join", description: "Join the shared workspace as a build bot.", inputSchema: { type: "object", properties: { name: { type: "string" }, kind: { type: "string" }, id: { type: "string" } }, required: ["name"] } },
  { name: "share_post", description: "Post a task/result/note to the shared room.", inputSchema: { type: "object", properties: { from: { type: "string" }, to: { type: "string" }, kind: { type: "string" }, body: { type: "string" } }, required: ["body"] } },
  { name: "share_lease", description: "Lease a path before writing.", inputSchema: { type: "object", properties: { path: { type: "string" }, bot: { type: "string" }, seconds: { type: "number" } }, required: ["path"] } },
  { name: "share_sync", description: "Publish a file into the shared workspace.", inputSchema: { type: "object", properties: { path: { type: "string" }, content: { type: "string" }, bot: { type: "string" }, expect: { type: "string" } }, required: ["path", "content"] } },
  { name: "share_pull", description: "Pull peers, inbox, leases, SSH links.", inputSchema: { type: "object", properties: {} } },
  { name: "share_term", description: "Shared backend terminal.", inputSchema: { type: "object", properties: { bot: { type: "string" }, session: { type: "string" }, command: { type: "string" } } } },
  { name: "share_ssh", description: "Allowlisted SSH command to a linked host.", inputSchema: { type: "object", properties: { host: { type: "string" }, user: { type: "string" }, command: { type: "string" }, port: { type: "number" }, bot: { type: "string" } }, required: ["host", "command"] } },
  { name: "share_link", description: "Publish SSH/PuTTY/term/onion link. Credentials are stored in the backend.", inputSchema: { type: "object", properties: { kind: { type: "string" }, host: { type: "string" }, user: { type: "string" }, port: { type: "number" }, from: { type: "string" }, to: { type: "string" }, password: { type: "string" }, key: { type: "string" } }, required: ["host"] } },
  { name: "share_keys", description: "SSH keys. action list|generate|authorize|revoke|rotate|settle|rotate-host|newnym|auto.", inputSchema: { type: "object", properties: { action: { type: "string" }, user: { type: "string" }, public: { type: "string" }, fingerprint: { type: "string" }, comment: { type: "string" } } } },
  { name: "web_search", description: "Punisher on the surface web. Dark Horse if isolate or .onion.", inputSchema: { type: "object", properties: { query: { type: "string" }, isolate: { type: "boolean" } }, required: ["query"] } },
  { name: "web_fetch", description: "Fetch a page via Punisher or Dark Horse.", inputSchema: { type: "object", properties: { url: { type: "string" }, isolate: { type: "boolean" } }, required: ["url"] } },
  { name: "vision_scan", description: "Dual-lens workbench scan.", inputSchema: { type: "object", properties: {} } },
  { name: "kvm_status", description: "KVM seats: host, darwin, hx.", inputSchema: { type: "object", properties: {} } },
  { name: "kvm_switch", description: "Switch KVM seat.", inputSchema: { type: "object", properties: { seat: { type: "string" } } } },
  { name: "darwin_boot", description: "Boot Darwin seat at Cinema 30″ 2560×1600.", inputSchema: { type: "object", properties: { mode: { type: "string" } } } },
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
      serverInfo: { name: "hector-contextforge", version: "1.0.0", alwaysOn: true },
    });
  }
  if (method === "notifications/initialized" || method === "ping") return ok(id, {});
  if (method === "tools/list") return ok(id, { tools: TOOLS });
  if (method === "resources/list") {
    return ok(id, {
      resources: [
        { uri: "hector://share/room", name: "Shared workspace", mimeType: "application/json" },
        ...listFunctions().map((fn) => ({ uri: `hector://functions/${fn.name}`, name: fn.name, mimeType: "application/json" })),
      ],
    });
  }
  if (method === "resources/read") {
    const uri = String(p.uri ?? "");
    if (uri === "hector://cloud/status") return ok(id, { contents: [{ uri, text: JSON.stringify(cloudStatus(), null, 2) }] });
    if (uri === "hector://share/room") return ok(id, { contents: [{ uri, text: JSON.stringify(pullRoom(), null, 2) }] });
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
    if (name === "web_search") return ok(id, toolText(await rideSearch(String(args.query ?? ""), Boolean(args.isolate))));
    if (name === "web_fetch") return ok(id, toolText(await rideFetch(String(args.url ?? ""), Boolean(args.isolate))));
    if (name === "vision_scan") return ok(id, toolText(await embodiedTick()));
    if (name === "kvm_status" || name === "kvm_switch" || name === "kvm_grab" || name === "darwin_boot" || name === "darwin_sysctl" || name === "darwin_status") {
      const { executeTool } = await import("@/lib/workspace/tools");
      const r = await executeTool(name, args, {}, "plan");
      return ok(id, toolText(r.payload));
    }
    if (name === "cloud_status") return ok(id, toolText(cloudStatus()));
    if (name === "cloud_fn_list") return ok(id, toolText(listFunctions().map(({ source: _source, ...rest }) => rest)));
    if (name === "cloud_fn_deploy") return ok(id, toolText(deployFunction({ name: String(args.name), source: args.source ? String(args.source) : undefined, entry: args.entry ? String(args.entry) : undefined })));
    if (name === "cloud_fn_invoke") return ok(id, toolText(await invokeFunction(String(args.name), args.event ?? {})));
    if (name === "cloud_fn_delete") return ok(id, toolText({ deleted: deleteFunction(String(args.name)) }));
    if (name === "cloud_object_put") return ok(id, toolText(putObject(String(args.key), String(args.body ?? ""))));
    if (name === "cloud_object_get") return ok(id, toolText(getObject(String(args.key))));
    if (name === "cloud_object_list") return ok(id, toolText(listObjects()));
    if (name === "share_join") return ok(id, toolText(joinPeer({ name: String(args.name ?? "bot"), kind: args.kind as never, id: args.id ? String(args.id) : undefined }).peer));
    if (name === "share_post") return ok(id, toolText(postNote({ from: String(args.from ?? "generic"), to: args.to ? String(args.to) : "hector", kind: args.kind as "task" | "result" | "note", body: String(args.body ?? "") })));
    if (name === "share_lease") return ok(id, toolText(leasePath({ bot: String(args.bot ?? "generic"), path: String(args.path ?? ""), seconds: args.seconds ? Number(args.seconds) : undefined })));
    if (name === "share_sync") return ok(id, toolText(syncFile({ bot: String(args.bot ?? "generic"), path: String(args.path ?? ""), content: String(args.content ?? ""), expect: args.expect ? String(args.expect) : undefined })));
    if (name === "share_pull") return ok(id, toolText({ ...shareStatus(), ack: args.id ? ackNote(String(args.id), String(args.bot ?? "generic")) : undefined, room: pullRoom(), terms: listTerms(), links: backendLinks(), onion: onionStatus() }));
    if (name === "share_term") {
      if (!args.session && !args.command) return ok(id, toolText(openTerm(String(args.bot ?? "generic"))));
      if (!args.session && args.command) {
        const opened = openTerm(String(args.bot ?? "generic"));
        return ok(id, toolText(writeTerm(opened.id, String(args.bot ?? "generic"), String(args.command), true)));
      }
      if (args.session && !args.command) return ok(id, toolText(readTerm(String(args.session))));
      return ok(id, toolText(writeTerm(String(args.session), String(args.bot ?? "generic"), String(args.command ?? ""), true)));
    }
    if (name === "share_ssh") {
      const result = await execSsh({
        host: String(args.host ?? ""),
        username: String(args.user ?? args.username ?? "hector"),
        port: args.port ? Number(args.port) : 22,
        command: String(args.command ?? ""),
        collab: true,
        bot: String(args.bot ?? "generic"),
        password: args.password ? String(args.password) : undefined,
        privateKey: args.key || args.privateKey ? String(args.key ?? args.privateKey) : undefined,
      });
      return ok(id, toolText(result));
    }
    if (name === "share_link") {
      const host = String(args.host ?? "");
      const kind = isOnionHost(host) || args.kind === "onion" ? "onion" : args.kind === "putty" || args.kind === "term" ? args.kind : "ssh";
      if (kind === "onion") startOnionDaemon();
      const link = registerLink({
        from: String(args.from ?? "generic"),
        to: String(args.to ?? "*"),
        kind,
        host,
        port: args.port ? Number(args.port) : 22,
        user: String(args.user ?? "hector"),
        password: args.password ? String(args.password) : undefined,
        privateKey: args.key || args.privateKey ? String(args.key ?? args.privateKey) : undefined,
      });
      return ok(id, toolText(describeLink(link)));
    }
    if (name === "share_keys") {
      const action = String(args.action ?? "list");
      if (action === "generate") return ok(id, toolText(generateIdentity(String(args.user ?? "hector"), args.comment ? String(args.comment) : undefined)));
      if (action === "authorize") return ok(id, toolText({ fingerprint: authorizeKey(String(args.public ?? ""), String(args.user ?? "hector")) }));
      if (action === "revoke") return ok(id, toolText({ revoked: revokeKey(String(args.fingerprint ?? "")) }));
      if (action === "rotate") {
        const r = rotateIdentity(String(args.user ?? "hector"));
        void newNym();
        return ok(id, toolText(r));
      }
      if (action === "settle") return ok(id, toolText({ settled: settleRotations() }));
      if (action === "rotate-host") return ok(id, toolText(rotateHostKey()));
      if (action === "newnym") return ok(id, toolText(await newNym()));
      if (action === "auto") return ok(id, toolText(autoRevoke()));
      return ok(id, toolText({ ...keyStatus(), identities: listIdentities() }));
    }
    return fail(id, `unknown tool ${name}`, -32601);
  } catch (err) {
    return fail(id, err instanceof Error ? err.message : String(err));
  }
}

export const HECTOR_MCP_TOOLS = TOOLS;
