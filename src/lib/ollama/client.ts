import { ctxFor } from "./rank.ts";

type Msg = Record<string, unknown>;

async function postJson(url: string, body: unknown, ms = 180_000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(t);
  }
}

function ollamaMessages(messages: Msg[]) {
  return messages.map((m) => {
    const role = String(m.role ?? "user");
    if (role === "tool") {
      return { role: "tool", content: String(m.content ?? "") };
    }
    const tool_calls = m.tool_calls;
    return {
      role: role === "assistant" || role === "system" ? role : "user",
      content: typeof m.content === "string" ? m.content : m.content ? JSON.stringify(m.content) : "",
      ...(Array.isArray(tool_calls) ? { tool_calls } : {}),
    };
  });
}

function ollamaTools(tools: unknown) {
  if (!Array.isArray(tools)) return undefined;
  return tools.map((t) => {
    const fn = (t as { function?: { name?: string; description?: string; parameters?: unknown } }).function;
    return {
      type: "function",
      function: {
        name: fn?.name ?? "",
        description: fn?.description ?? "",
        parameters: fn?.parameters ?? { type: "object", properties: {} },
      },
    };
  });
}

/** Native Ollama /api/chat — keep_alive and num_ctx, then OpenAI-shaped result. */
export async function ollamaChat(input: {
  origin: string;
  model: string;
  messages: Msg[];
  tools?: unknown;
  temperature?: number;
  maxTokens?: number;
}) {
  const origin = input.origin.replace(/\/+$/, "").replace(/\/v1$/, "");
  const body = {
    model: input.model,
    messages: ollamaMessages(input.messages),
    tools: ollamaTools(input.tools),
    stream: false,
    keep_alive: "24h",
    options: {
      temperature: input.temperature ?? 0.1,
      num_ctx: ctxFor(input.model),
      num_predict: input.maxTokens ?? 3500,
    },
  };
  let res = await postJson(`${origin}/api/chat`, body);
  if (!res.ok) {
    res = await postJson(`${origin}/v1/chat/completions`, {
      model: input.model,
      messages: input.messages,
      tools: input.tools,
      temperature: input.temperature ?? 0.1,
      max_tokens: input.maxTokens ?? 3500,
    });
  }
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) return new Response(JSON.stringify(data), { status: res.status, headers: { "Content-Type": "application/json" } });
  if (data.message && !data.choices) {
    return new Response(JSON.stringify({ choices: [{ message: data.message }] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  return new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } });
}

export async function ollamaTags(origin: string, ms = 800) {
  const root = origin.replace(/\/+$/, "").replace(/\/v1$/, "");
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(`${root}/api/tags`, { signal: ctrl.signal, headers: { Accept: "application/json" } });
    if (!res.ok) return [];
    const data = (await res.json()) as { models?: { name?: string }[] };
    return (data.models ?? []).map((m) => String(m.name ?? "")).filter(Boolean);
  } catch {
    return [];
  } finally {
    clearTimeout(t);
  }
}
