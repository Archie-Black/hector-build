import { isLoopbackChat, safeChatBase, type ChatProviderId } from "./providers.ts";

export type Engine =
  | { kind: "hector-local"; baseUrl: "/api/v1"; model: "hector-hx"; key: "" }
  | { kind: "ollama" | "lmstudio" | "cloud"; baseUrl: string; model: string; key: string };

const OLLAMA = "http://127.0.0.1:11434";
const PREFER = [/llama3\.2/, /llama3/, /qwen/, /mistral/, /phi/, /gemma/];

async function getJson(url: string, ms = 400) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

export async function probeOllama() {
  const data = await getJson(`${OLLAMA}/api/tags`);
  const models = Array.isArray(data?.models) ? (data.models as { name?: string }[]) : [];
  const names = models.map((m) => String(m.name ?? "")).filter(Boolean);
  if (!names.length) return null;
  const pick = PREFER.map((re) => names.find((n) => re.test(n))).find(Boolean) ?? names[0];
  return { kind: "ollama" as const, baseUrl: `${OLLAMA}/v1`, model: pick, key: "local" };
}

export async function resolveEngine(input: {
  providerId?: ChatProviderId;
  baseUrl?: string;
  model?: string;
  key?: string;
}): Promise<Engine> {
  const id = input.providerId ?? "hector";
  const model = (input.model ?? "").trim();
  const key = (input.key ?? "").trim();
  const base = safeChatBase(input.baseUrl ?? "") || "";

  if ((id === "xai" || id === "openai" || id === "groq" || id === "openrouter") && key.length >= 12) {
    return { kind: "cloud", baseUrl: base || input.baseUrl || "", model: model || "gpt-4.1", key };
  }
  if (id === "custom" && base && (key.length >= 12 || isLoopbackChat(base))) {
    return { kind: "cloud", baseUrl: base, model: model || "local-model", key: key || "local" };
  }
  if (id === "lmstudio" || (base.includes(":1234") && isLoopbackChat(base))) {
    return { kind: "lmstudio", baseUrl: base || "http://127.0.0.1:1234/v1", model: model || "local-model", key: "local" };
  }
  if (id === "ollama" || (isLoopbackChat(base) && base.includes("11434"))) {
    const live = await probeOllama();
    if (live) return { ...live, model: model || live.model };
  }

  const live = id === "hector" || !key ? await probeOllama() : null;
  if (live) return live;
  return { kind: "hector-local", baseUrl: "/api/v1", model: "hector-hx", key: "" };
}
