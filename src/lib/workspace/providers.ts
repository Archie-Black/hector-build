export type ChatProviderId =
  | "hector"
  | "xai"
  | "openai"
  | "groq"
  | "openrouter"
  | "ollama"
  | "lmstudio"
  | "custom";

export type ChatProvider = {
  id: ChatProviderId;
  name: string;
  baseUrl: string;
  model: string;
  keysUrl: string;
  hint: string;
};

export const CHAT_PROVIDERS: ChatProvider[] = [
  {
    id: "hector",
    name: "Hector API",
    baseUrl: "/api/v1",
    model: "hector-hx",
    keysUrl: "",
    hint: "Built in. Always on. Other tools POST to /api/v1/chat/completions (OpenAI-compatible). Cloud keys only boost.",
  },
  {
    id: "xai",
    name: "Grok (xAI)",
    baseUrl: "https://api.x.ai/v1",
    model: "grok-4.5",
    keysUrl: "https://console.x.ai/team/default/api-keys",
    hint: "Create an API key at console.x.ai. Paste the xai- key. Model grok-4.5.",
  },
  {
    id: "openai",
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4.1",
    keysUrl: "https://platform.openai.com/api-keys",
    hint: "Create a key at platform.openai.com/api-keys. Paste the sk- key. Model gpt-4.1.",
  },
  {
    id: "groq",
    name: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    model: "llama-3.3-70b-versatile",
    keysUrl: "https://console.groq.com/keys",
    hint: "Best free API key for this app. Create one at console.groq.com/keys. OpenAI-compatible.",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    model: "anthropic/claude-sonnet-4",
    keysUrl: "https://openrouter.ai/keys",
    hint: "One key, many models. Paste the sk-or- key and set the model id.",
  },
  {
    id: "ollama",
    name: "Ollama",
    baseUrl: "http://127.0.0.1:11434/v1",
    model: "llama3.2",
    keysUrl: "https://ollama.com/download",
    hint: "Local. No key. Run Ollama, then ollama pull llama3.2. Works on the desktop/WSL install — not the hosted preview.",
  },
  {
    id: "lmstudio",
    name: "LM Studio",
    baseUrl: "http://127.0.0.1:1234/v1",
    model: "local-model",
    keysUrl: "https://lmstudio.ai",
    hint: "Local OpenAI-compatible server. Start the server in LM Studio. No key.",
  },
  {
    id: "custom",
    name: "Custom (OpenAI-compatible)",
    baseUrl: "https://api.example.com/v1",
    model: "your-model",
    keysUrl: "",
    hint: "Any OpenAI-compatible chatbot: llama.cpp, Together, Azure, a proxy.",
  },
];

const STORE = "spectral-hx-provider";
const KEY_STORE = "hector-visitor-xai";

export function isApiKey(value: string): boolean {
  const t = value.trim();
  return t.length >= 12 && !/\s/.test(t);
}

export function loadProvider(): { id: ChatProviderId; baseUrl: string; model: string; key: string } {
  const fallback = CHAT_PROVIDERS[0];
  if (typeof window === "undefined") {
    return { id: fallback.id, baseUrl: fallback.baseUrl, model: fallback.model, key: "" };
  }
  try {
    const raw = window.localStorage.getItem(STORE);
    const parsed = raw ? (JSON.parse(raw) as { id?: ChatProviderId; baseUrl?: string; model?: string }) : {};
    const preset = CHAT_PROVIDERS.find((p) => p.id === parsed.id) ?? fallback;
    const key = window.localStorage.getItem(KEY_STORE) ?? "";
    return {
      id: preset.id,
      baseUrl: parsed.baseUrl || preset.baseUrl,
      model: parsed.model || preset.model,
      key: isApiKey(key) ? key : "",
    };
  } catch {
    return { id: fallback.id, baseUrl: fallback.baseUrl, model: fallback.model, key: "" };
  }
}

export function saveProvider(next: { id: ChatProviderId; baseUrl: string; model: string; key: string }) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    STORE,
    JSON.stringify({ id: next.id, baseUrl: next.baseUrl.trim(), model: next.model.trim() }),
  );
  if (isApiKey(next.key)) window.localStorage.setItem(KEY_STORE, next.key.trim());
  else if (next.id === "ollama" || next.id === "lmstudio") window.localStorage.setItem(KEY_STORE, "local");
  else window.localStorage.removeItem(KEY_STORE);
}

export function safeChatBase(raw: string): string | null {
  const t = raw.trim();
  if (t === "/api/v1" || t === "hector" || t.endsWith("/api/v1")) return "/api/v1";
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();
    const loopback = host === "localhost" || host === "127.0.0.1" || host === "[::1]";
    if (loopback) {
      if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    } else {
      if (url.protocol !== "https:") return null;
      if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|0\.0\.0\.0|169\.254\.)/.test(host)) return null;
    }
    const path = url.pathname.replace(/\/+$/, "") || "/v1";
    return `${url.origin}${path}`;
  } catch {
    return null;
  }
}

export function isLoopbackChat(raw: string) {
  const root = safeChatBase(raw);
  if (!root || root === "/api/v1") return false;
  try {
    const host = new URL(root).hostname.toLowerCase();
    return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
  } catch {
    return false;
  }
}

export function engineKey(id: ChatProviderId, key: string) {
  if (id === "ollama" || id === "lmstudio") return key.trim() || "local";
  return key;
}
