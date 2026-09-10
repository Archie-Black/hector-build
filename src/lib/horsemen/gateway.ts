import { DEFAULT_POLICY, decidePolicy, type PolicyCtx } from "./cel.ts";
import { writeAudit } from "./audit.ts";
import { HECTOR_ID, type HorsemanId } from "./roster.ts";

export type GateResult =
  | { ok: true; decision: "allow" }
  | { ok: false; decision: "deny" | "ask"; reason: string };

const ASK_TOOLS = new Set(["bash", "delete_file", "cloud_fn_delete"]);

function ctxOf(tool: string, args: Record<string, unknown>, bot: HorsemanId): PolicyCtx {
  const path = String(args.path ?? args.file ?? args.key ?? "");
  const base = path.split("/").pop() ?? path;
  const ext = base.includes(".") ? base.split(".").pop() ?? "" : "";
  return {
    tool: { name: tool },
    intent: String(args.command ?? args.query ?? args.prompt ?? args.content ?? tool).slice(0, 240),
    bot: { id: bot },
    file: { path, name: base, extension: ext },
  };
}

export function gate(tool: string, args: Record<string, unknown>, bot: HorsemanId = HECTOR_ID): GateResult {
  const ctx = ctxOf(tool, args, bot);
  const decision = ASK_TOOLS.has(tool) ? "ask" : decidePolicy(DEFAULT_POLICY, ctx);
  writeAudit({ at: Date.now(), bot, tool, decision, detail: ctx.file.path || ctx.intent.slice(0, 80) });
  if (decision === "allow") return { ok: true, decision };
  if (decision === "ask") {
    return { ok: false, decision: "ask", reason: `Hector paused ${tool}. Allow or deny.` };
  }
  return { ok: false, decision: "deny", reason: `War denied ${tool}. Fail closed.` };
}
