import { diffsFrom, executeTool } from "@/lib/workspace/tools";
import { runWorkspaceTests } from "@/lib/workspace/run-tests";
import { diagnostics } from "@/lib/ide/symbols";
import type { AgentResponse, ForgeMode } from "@/lib/workspace/types";
import { synthesizeFiles } from "./synthesize";
import { prove } from "@/lib/workspace/prove";
import { silentCouple } from "@/lib/chips/silent.ts";
import { recordTurn } from "@/lib/os/mm";
import { learn } from "@/lib/lingo/lingua";
import { logExec, markAgent, noteCorrection, watchHuman } from "@/lib/xp/experience";
import { healLoop, iacOf, rememberRepo, wantsVisual } from "@/lib/partner/partner";
import { speakDone, speakPlan, speakScout } from "@/lib/partner/speak";

type Msg = { role?: string; content?: unknown; tool_calls?: unknown; name?: string };

export async function runLocalTurn(input: {
  prompt: string;
  files: Record<string, string>;
  mode: ForgeMode;
  history?: { role: string; content: string }[];
}): Promise<AgentResponse> {
  void import("@/lib/spool/spooler").then((m) => m.spoolFor(input.prompt)).catch(() => undefined);
  learn(input.prompt);
  watchHuman(input.files);
  const prev = [...(input.history ?? [])].reverse().find((m) => m.role === "user");
  if (prev) noteCorrection(prev.content, input.prompt);
  const before = { ...input.files };
  let files = { ...input.files };
  const traces: AgentResponse["traces"] = [];
  const mode = input.mode;
  const prompt = input.prompt.slice(0, 16000);

  const listed = await executeTool("list_files", {}, files, mode);
  traces.push(listed.trace);

  const observed = await executeTool("lattice_search", { query: prompt.slice(0, 200) }, files, mode);
  traces.push(observed.trace);
  const peak = silentCouple(prompt, files);
  if (peak && files[peak]) {
    const hit = await executeTool("read_file", { path: peak }, files, mode);
    traces.push(hit.trace);
  }
  const arch = rememberRepo(files, prompt);
  if (arch.hits[0]) traces.push({ name: "arch", ok: true, detail: arch.hits.map((h) => h.path).slice(0, 4).join(", ") });

  if (mode === "scout") {
    const lint = diagnostics(files).slice(0, 12);
    return {
      ok: true,
      reply: speakScout(Object.keys(files).length, lint.length),
      files,
      traces,
      tests: runWorkspaceTests(files),
      diffs: [],
    };
  }

  if (mode === "plan") {
    const planned = synthesizeFiles(prompt, files);
    return {
      ok: true,
      reply: speakPlan(Object.keys(planned)),
      files,
      traces,
      tests: runWorkspaceTests(files),
      plan: Object.keys(planned).join("\n"),
      diffs: [],
    };
  }

  const generated = { ...synthesizeFiles(prompt, files), ...iacOf(prompt) };
  if (wantsVisual(prompt) && !generated["index.html"] && !Object.keys(generated).some((p) => p.endsWith(".html"))) {
    Object.assign(generated, synthesizeFiles(`Pixel-accurate UI from this brief. ${prompt}`, files));
  }
  for (const [path, content] of Object.entries(generated)) {
    const result = await executeTool("write_file", { path, content }, files, mode);
    files = result.files;
    traces.push(result.trace);
  }

  const tests = await executeTool("run_tests", {}, files, mode);
  files = tests.files;
  traces.push(tests.trace);

  const lints = await executeTool("get_diagnostics", {}, files, mode);
  traces.push(lints.trace);

  let p = prove(files);
  if (!p.done) {
    const healed = await healLoop(prompt, files, 3);
    files = healed.files;
    traces.push(...healed.traces);
    p = healed.proof;
  }
  traces.push({ name: "prove", ok: p.done, detail: p.note });
  recordTurn({ agent: "hx", prompt, ok: p.done, note: p.note });
  logExec(prompt, p, files);
  markAgent(files);
  const diffs = diffsFrom(before, files);
  const written = Object.keys(generated);
  return {
    ok: true,
    reply: speakDone({ written, proof: p }),
    files,
    traces,
    tests: p.tests.map((t) => ({ name: t.name, pass: t.pass, detail: "" })),
    diffs,
  };
}

export function localChatCompletion(body: {
  messages?: Msg[];
  model?: string;
  tools?: unknown[];
}) {
  const messages = body.messages ?? [];
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const prompt = String(lastUser?.content ?? "");
  const generated = synthesizeFiles(prompt, {});
  const files = Object.entries(generated)
    .map(([path, content]) => `\`\`\`${path}\n${content}\`\`\``)
    .join("\n\n");
  const text =
    Object.keys(generated).length === 0
      ? "Hey. Tell me what to build."
      : `Done.\n\n${files}`;

  if (Array.isArray(body.tools) && body.tools.length && Object.keys(generated).length) {
    const calls = Object.entries(generated)
      .slice(0, 8)
      .map(([path, content], i) => ({
        id: `call_hx_${i}`,
        type: "function",
        function: {
          name: "write_file",
          arguments: JSON.stringify({ path, content }),
        },
      }));
    return {
      id: `hx-${Date.now()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: body.model || "hector-hx",
      choices: [{ index: 0, message: { role: "assistant", content: "", tool_calls: calls }, finish_reason: "tool_calls" }],
      usage: { prompt_tokens: prompt.length, completion_tokens: 0, total_tokens: prompt.length },
    };
  }

  return {
    id: `hx-${Date.now()}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: body.model || "hector-hx",
    choices: [{ index: 0, message: { role: "assistant", content: text }, finish_reason: "stop" }],
    usage: { prompt_tokens: prompt.length, completion_tokens: text.length, total_tokens: prompt.length + text.length },
  };
}

