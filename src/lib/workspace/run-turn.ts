import { createServerFn } from "@tanstack/react-start";
import { diffsFrom, executeTool } from "./tools";
import { runWorkspaceTests } from "./run-tests";
import { isApiKey } from "./keys";
import { safeChatBase } from "./providers";
import { hectorHostPrompt, spectralHxPrompt } from "@/lib/spectral-hx";
import { formatRecall } from "@/lib/memory/lattice";
import { recallMemory } from "@/lib/memory/warehouse";
import { rustSearchNative } from "@/lib/geometry/mdv-native";
import { critique, revisionPrompt } from "@/lib/align/cai";
import { harmScan } from "@/lib/align/asimov";
import { runLocalTurn } from "@/lib/hector-api/local-turn";
import type { AgentResponse, AgentTodo, ForgeMode } from "./types";

const TOOLS = [
  {
    type: "function",
    function: {
      name: "list_files",
      description: "List every path in the granted workspace.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "glob_files",
      description: "Find paths matching a glob such as src/*.js.",
      parameters: {
        type: "object",
        properties: { pattern: { type: "string" } },
        required: ["pattern"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "grep_files",
      description: "Exact substring or regex search. Use lattice_search first for meaning.",
      parameters: {
        type: "object",
        properties: { query: { type: "string" }, regex: { type: "boolean" } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "lattice_search",
      description:
        "Observe geometry. English → knot + lattice amplitudes → collapsed working set. Use before grep.",
      parameters: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_file",
      description: "Read one workspace file. Optional offset and limit in lines.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string" },
          offset: { type: "number" },
          limit: { type: "number" },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "write_file",
      description: "Overwrite or create a workspace file. Refused in Scout and Plan.",
      parameters: {
        type: "object",
        properties: { path: { type: "string" }, content: { type: "string" } },
        required: ["path", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "apply_patch",
      description: "Apply a unified diff to one file.",
      parameters: {
        type: "object",
        properties: { path: { type: "string" }, diff: { type: "string" } },
        required: ["path", "diff"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_replace",
      description: "Replace one exact string in a file. Set replace_all for every occurrence. If it fails, retry a shorter unique old_string.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string" },
          old_string: { type: "string" },
          new_string: { type: "string" },
          replace_all: { type: "boolean" },
        },
        required: ["path", "old_string", "new_string"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_diagnostics",
      description: "Return workspace lints: unmatched braces, missing relative imports, JSON parse errors.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "read_symbol",
      description: "Jump to a function/class/const definition and read nearby lines.",
      parameters: {
        type: "object",
        properties: { name: { type: "string" }, path: { type: "string" } },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "find_references",
      description: "Find every use of a symbol across the workspace.",
      parameters: {
        type: "object",
        properties: { name: { type: "string" } },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "rename_symbol",
      description: "Rename an identifier across granted files.",
      parameters: {
        type: "object",
        properties: { from: { type: "string" }, to: { type: "string" } },
        required: ["from", "to"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "format_file",
      description: "Trim trailing space and normalize a file.",
      parameters: {
        type: "object",
        properties: { path: { type: "string" } },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "run_tests",
      description: "Run the full workspace test harness.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "todo_write",
      description: "Replace the task board.",
      parameters: {
        type: "object",
        properties: {
          todos: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                content: { type: "string" },
                status: { type: "string" },
              },
            },
          },
        },
        required: ["todos"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "enter_plan_mode",
      description: "Switch to plan mode. No writes.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "exit_plan_mode",
      description: "Submit a plan for human approval.",
      parameters: {
        type: "object",
        properties: { plan: { type: "string" } },
        required: ["plan"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Search the public web.",
      parameters: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "web_fetch",
      description: "Fetch a public https page as text.",
      parameters: {
        type: "object",
        properties: { url: { type: "string" } },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "bash",
      description: "Sandbox command. Only ls and cat on the granted workspace.",
      parameters: {
        type: "object",
        properties: { command: { type: "string" } },
        required: ["command"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "spawn_subagent",
      description: "Spawn a specialist subagent: scout, patch, or test.",
      parameters: {
        type: "object",
        properties: {
          role: { type: "string" },
          task: { type: "string" },
        },
        required: ["role", "task"],
      },
    },
  },
];

type HistoryItem = { role: "user" | "assistant"; content: string };

type TurnInput = {
  mode: ForgeMode;
  prompt: string;
  files: Record<string, string>;
  history: HistoryItem[];
  lessons: string[];
  visitorKey?: string;
  baseUrl?: string;
  model?: string;
  voice?: "hector" | "hx";
};

type Msg = Record<string, unknown>;

export const probeOwnerKey = createServerFn({ method: "POST" }).handler(async () => {
  return { ownerReady: true, engine: "hector-api" as const };
});

function useLocalEngine(baseUrl: string, model: string, apiKey: string) {
  if (!apiKey) return true;
  if (/hector-hx|spectral-hx|hx-local/.test(model)) return true;
  const root = safeChatBase(baseUrl) || "";
  return root === "/api/v1" || root.endsWith("/api/v1");
}

async function webSearch(query: string) {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const data = (await res.json()) as { AbstractText?: string; AbstractURL?: string; Heading?: string };
  return {
    heading: data.Heading || query,
    text: data.AbstractText || "No instant answer. Use web_fetch on a known URL.",
    url: data.AbstractURL || "",
  };
}

async function webFetch(raw: string) {
  if (!/^https:\/\//i.test(raw)) return { error: "Only https URLs." };
  const host = new URL(raw).hostname;
  if (/^(localhost|127\.|10\.|192\.168\.|0\.0\.0\.0)/.test(host)) return { error: "Private hosts blocked." };
  const res = await fetch(raw, { redirect: "follow" });
  const text = await res.text();
  return { status: res.status, text: text.replace(/<[^>]+>/g, " ").slice(0, 4000) };
}

async function complete(baseUrl: string, apiKey: string, model: string, body: object) {
  const root = safeChatBase(baseUrl) || "https://api.x.ai/v1";
  return fetch(`${root}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, ...body }),
  });
}

export const runForgeTurn = createServerFn({ method: "POST" })
  .validator((input: TurnInput) => input)
  .handler(async ({ data }): Promise<AgentResponse> => {
    const visitor = isApiKey(data.visitorKey ?? "") ? data.visitorKey!.trim() : "";
    const apiKey = visitor || process.env.XAI_API_KEY || "";
    const harm = harmScan(data.prompt);
    if (harm.harm) {
      return {
        ok: true,
        reply: harm.note,
        files: data.files,
        traces: [{ name: "asimov", ok: true, detail: harm.law }],
        tests: runWorkspaceTests(data.files),
      };
    }
    const baseUrl = data.baseUrl || "/api/v1";
    const requested = (data.model || "").trim();
    if (useLocalEngine(baseUrl, requested, apiKey)) {
      return runLocalTurn({
        prompt: data.prompt,
        files: data.files,
        mode: data.mode,
        history: data.history,
      });
    }

    const recalled = await recallMemory({ data: data.prompt });
    const lessons = [...(data.lessons ?? []), ...formatRecall(recalled)];
    const mode = data.mode;
    const system =
      data.voice === "hector" ? hectorHostPrompt(mode, lessons) : spectralHxPrompt(mode, lessons);
    const messages: Msg[] = [
      { role: "system", content: system },
      ...data.history.slice(-16).map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: data.prompt.slice(0, 16000) },
    ];

    const before = { ...data.files };
    let files = { ...data.files };
    const traces: AgentResponse["traces"] = [];
    let todos: AgentTodo[] = [];
    let plan = "";
    let reply = "";
    const maxRounds = mode === "swarm" ? 16 : mode === "patch" ? 8 : mode === "plan" ? 6 : 5;
    let model = requested || (baseUrl.includes("x.ai") ? "grok-4.5" : "gpt-4.1");

    for (let round = 0; round < maxRounds; round++) {
      let res = await complete(baseUrl, apiKey, model, {
        temperature: 0.15,
        max_tokens: mode === "scout" ? 1800 : 5000,
        tools: TOOLS,
        tool_choice: "auto",
        messages,
      });
      if (!res.ok && baseUrl.includes("x.ai") && (res.status === 400 || res.status === 404) && model === "grok-4.5") {
        model = "grok-4";
        res = await complete(baseUrl, apiKey, model, {
          temperature: 0.15,
          max_tokens: mode === "scout" ? 1800 : 5000,
          tools: TOOLS,
          tool_choice: "auto",
          messages,
        });
      }

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        const needKey = res.status === 401 || res.status === 403;
        return {
          ok: false,
          needKey,
          error: needKey
            ? "That xAI key was refused. Sign in at xAI and create a fresh key."
            : `Refused mid-turn (${res.status}). ${errText.slice(0, 160)}`,
          reply: "",
          files,
          traces,
          tests: runWorkspaceTests(files),
        };
      }

      const body = (await res.json()) as { choices?: { message?: Msg }[] };
      const msg = body.choices?.[0]?.message ?? {};
      const toolCalls = (msg.tool_calls as Msg[] | undefined) ?? [];
      const content = typeof msg.content === "string" ? msg.content : "";

      if (toolCalls.length) {
        messages.push(msg);
        for (const call of toolCalls.slice(0, 8)) {
          const fn = (call.function as Msg | undefined) ?? {};
          const name = String(fn.name ?? "");
          let args: Record<string, unknown> = {};
          try {
            args = JSON.parse(String(fn.arguments ?? "{}")) as Record<string, unknown>;
          } catch {
            args = {};
          }
          if (name === "web_search") {
            const payload = await webSearch(String(args.query ?? ""));
            traces.push({ name, ok: true, detail: String(args.query ?? "") });
            messages.push({
              role: "tool",
              tool_call_id: String(call.id ?? "call"),
              name,
              content: JSON.stringify(payload),
            });
            continue;
          }
          if (name === "web_fetch") {
            const payload = await webFetch(String(args.url ?? ""));
            traces.push({ name, ok: !("error" in payload), detail: String(args.url ?? "") });
            messages.push({
              role: "tool",
              tool_call_id: String(call.id ?? "call"),
              name,
              content: JSON.stringify(payload),
            });
            continue;
          }
          if (name === "spawn_subagent") {
            traces.push({
              name,
              ok: true,
              detail: `${String(args.role ?? "scout")}: ${String(args.task ?? "").slice(0, 80)}`,
            });
            messages.push({
              role: "tool",
              tool_call_id: String(call.id ?? "call"),
              name,
              content: JSON.stringify({
                accepted: true,
                note: "Subagent assigned. Continue the job in this turn with that specialist focus.",
              }),
            });
            continue;
          }
          if (name === "lattice_search") {
            const query = String(args.query ?? "");
            const rust = rustSearchNative(files, query, 8);
            if (rust) {
              traces.push({ name, ok: true, detail: `${rust.length} rust mdv hit(s)` });
              messages.push({
                role: "tool",
                tool_call_id: String(call.id ?? "call"),
                name,
                content: JSON.stringify(rust),
              });
              continue;
            }
          }
          const result = executeTool(name, args, files, mode);
          files = result.files;
          traces.push(result.trace);
          if (result.todos) todos = result.todos;
          if (result.plan) plan = result.plan;
          messages.push({
            role: "tool",
            tool_call_id: String(call.id ?? "call"),
            name,
            content: JSON.stringify(result.payload),
          });
        }
        continue;
      }

      if (!toolCalls.length) {
        const checks = runWorkspaceTests(files);
        const fail = checks.filter((t) => !t.pass);
        const cai = critique({
          reply: content,
          fail: fail.length,
          traces,
          diffs: diffsFrom(before, files),
        });
        if ((!cai.ok || fail.length) && round < maxRounds - 1 && (mode === "swarm" || mode === "patch")) {
          messages.push(msg);
          messages.push({
            role: "user",
            content: fail.length
              ? `Checks still fail: ${fail.map((t) => t.name).join(", ")}. Do not give up. Be better. Fix them and continue.`
              : revisionPrompt(cai),
          });
          continue;
        }
        reply = content || "The job is finished.";
        if (mode === "plan" && !plan) plan = reply;
        break;
      }
    }

    if (!reply) {
      reply = "Used every step available. Send continue to pick up the rest.";
    }

    return {
      ok: true,
      reply,
      files,
      traces,
      tests: runWorkspaceTests(files),
      plan: plan || undefined,
      todos,
      diffs: diffsFrom(before, files),
    };
  });
