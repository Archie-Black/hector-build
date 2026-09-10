import { diffsFrom, executeTool } from "@/lib/workspace/tools";
import { runWorkspaceTests } from "@/lib/workspace/run-tests";
import { diagnostics } from "@/lib/ide/symbols";
import type { AgentResponse, ForgeMode } from "@/lib/workspace/types";
import { synthesizeFiles } from "./synthesize";

type Msg = { role?: string; content?: unknown; tool_calls?: unknown; name?: string };

export function runLocalTurn(input: {
  prompt: string;
  files: Record<string, string>;
  mode: ForgeMode;
  history?: { role: string; content: string }[];
}): AgentResponse {
  const before = { ...input.files };
  let files = { ...input.files };
  const traces: AgentResponse["traces"] = [];
  const mode = input.mode;
  const prompt = input.prompt.slice(0, 16000);

  const listed = executeTool("list_files", {}, files, mode);
  traces.push(listed.trace);

  const observed = executeTool("lattice_search", { query: prompt.slice(0, 200) }, files, mode);
  traces.push(observed.trace);

  if (mode === "scout") {
    const lint = diagnostics(files).slice(0, 12);
    return {
      ok: true,
      reply: [
        "Hector API (local) scout.",
        `Workspace: ${Object.keys(files).length} files.`,
        lint.length ? `Lints: ${lint.map((l) => `${l.path}:${l.line} ${l.message}`).join("; ")}` : "No lints.",
        "Ready to implement. No writes in scout.",
      ].join("\n"),
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
      reply: [
        "Hector API plan (local engine).",
        ...Object.keys(planned).map((p, i) => `${i + 1}. ${p}`),
        "Say go and Spectral HX will apply this.",
      ].join("\n"),
      files,
      traces,
      tests: runWorkspaceTests(files),
      plan: Object.keys(planned).join("\n"),
      diffs: [],
    };
  }

  const generated = synthesizeFiles(prompt, files);
  for (const [path, content] of Object.entries(generated)) {
    const result = executeTool("write_file", { path, content }, files, mode);
    files = result.files;
    traces.push(result.trace);
  }

  const tests = executeTool("run_tests", {}, files, mode);
  files = tests.files;
  traces.push(tests.trace);

  const lints = executeTool("get_diagnostics", {}, files, mode);
  traces.push(lints.trace);

  const written = Object.keys(generated);
  const checks = runWorkspaceTests(files);
  return {
    ok: true,
    reply: [
      `Hector API applied ${written.length} file(s) on the local engine.`,
      written.map((p) => `• ${p}`).join("\n"),
      checks.every((t) => t.pass) ? "Checks passed." : `Checks: ${checks.filter((t) => !t.pass).map((t) => t.name).join(", ")} still open.`,
      "Boost with an xAI / OpenAI key in settings when you want a larger model. The IDE agent already works.",
    ]
      .filter(Boolean)
      .join("\n"),
    files,
    traces,
    tests: checks,
    diffs: diffsFrom(before, files),
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
      ? "Hector API is live. Ask me to build, and I will write the files."
      : `Hector API (local).\n\n${files}`;

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

export const HECTOR_MODELS = [
  { id: "hector-hx", owned_by: "hector-build", object: "model" as const },
  { id: "spectral-hx", owned_by: "hector-build", object: "model" as const },
];
