import { contentEmbed } from "@/lib/geometry/embed";
import { cloudChat, cloudTarget, isLocalModel } from "./cloud";
import { localChatCompletion, runLocalTurn } from "./local-turn";
import type { ForgeMode } from "@/lib/workspace/types";

export type ChatBody = {
  messages?: { role?: string; content?: unknown; name?: string }[];
  model?: string;
  stream?: boolean;
  tools?: unknown[];
  temperature?: number;
  max_tokens?: number;
  hx_files?: Record<string, string>;
  hx_mode?: ForgeMode;
};

function textOf(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) return String((part as { text?: string }).text ?? "");
        return "";
      })
      .join("\n");
  }
  return content == null ? "" : String(content);
}

function sse(payload: unknown) {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

export function streamFromText(model: string, text: string) {
  const id = `hx-${Date.now()}`;
  const created = Math.floor(Date.now() / 1000);
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(
          sse({
            id,
            object: "chat.completion.chunk",
            created,
            model,
            choices: [{ index: 0, delta: { role: "assistant", content: text }, finish_reason: null }],
          }),
        ),
      );
      controller.enqueue(
        encoder.encode(
          sse({
            id,
            object: "chat.completion.chunk",
            created,
            model,
            choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
          }),
        ),
      );
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });
}

export function jsonApi(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });
}

export async function completeChat(body: ChatBody, key: string) {
  const model = (body.model || "hector-hx").trim();
  const messages = body.messages ?? [];
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const prompt = textOf(lastUser?.content);
  const files = body.hx_files && typeof body.hx_files === "object" ? body.hx_files : {};
  const mode: ForgeMode = body.hx_mode === "scout" || body.hx_mode === "plan" || body.hx_mode === "patch" || body.hx_mode === "swarm" ? body.hx_mode : "patch";

  const cloud = !isLocalModel(model) ? cloudTarget(model, key) : key && /cloud|boost/.test(model) ? cloudTarget(model, key) : null;

  if (cloud) {
    const proxied = await cloudChat(cloud, key, {
      messages: messages.map((m) => ({ role: m.role || "user", content: textOf(m.content) })),
      temperature: body.temperature ?? 0.2,
      max_tokens: body.max_tokens ?? 4096,
      tools: body.tools,
    }).catch((err: Error) => ({ ok: false, status: 502, body: { error: { message: err.message } } }));
    if (proxied.ok) return { kind: "cloud" as const, payload: proxied.body, model: cloud.model };
  }

  if (Object.keys(files).length) {
    const turn = runLocalTurn({
      prompt,
      files,
      mode,
      history: messages.map((m) => ({ role: String(m.role || "user"), content: textOf(m.content) })),
    });
    const payload = {
      id: `hx-${Date.now()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: "hector-hx",
      choices: [{ index: 0, message: { role: "assistant", content: turn.reply }, finish_reason: "stop" }],
      usage: { prompt_tokens: prompt.length, completion_tokens: turn.reply.length, total_tokens: prompt.length + turn.reply.length },
      hx: { files: turn.files, diffs: turn.diffs, tests: turn.tests },
    };
    return { kind: "local" as const, payload, model: "hector-hx" };
  }

  const payload = localChatCompletion({ messages, model: "hector-hx", tools: body.tools });
  return { kind: "local" as const, payload, model: "hector-hx" };
}

export function localEmbeddings(input: string | string[], model = "hector-mdv") {
  const items = Array.isArray(input) ? input : [input];
  return {
    object: "list",
    model,
    data: items.slice(0, 32).map((text, index) => ({
      object: "embedding",
      index,
      embedding: Array.from(contentEmbed(String(text ?? ""))),
    })),
    usage: {
      prompt_tokens: items.reduce((n, t) => n + String(t).length, 0),
      total_tokens: items.reduce((n, t) => n + String(t).length, 0),
    },
  };
}

export const LOCAL_MODELS = [
  { id: "hector-hx", owned_by: "hector-build", object: "model" as const },
  { id: "spectral-hx", owned_by: "hector-build", object: "model" as const },
  { id: "hx-local", owned_by: "hector-build", object: "model" as const },
  { id: "hector-mdv", owned_by: "hector-build", object: "model" as const },
  { id: "hector-hx-cloud", owned_by: "hector-build", object: "model" as const },
];

export const CLOUD_MODELS = [
  { id: "grok-4", owned_by: "xai", object: "model" as const },
  { id: "grok-4.5", owned_by: "xai", object: "model" as const },
  { id: "gpt-4.1-mini", owned_by: "openai", object: "model" as const },
  { id: "llama-3.3-70b-versatile", owned_by: "groq", object: "model" as const },
];
