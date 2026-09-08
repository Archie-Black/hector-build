export type ChatProviderId = "xai" | "openai" | "groq" | "openrouter" | "custom";

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
    hint: "Create a key at console.groq.com/keys. OpenAI-compatible endpoint.",
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
    id: "custom",
    name: "Custom (OpenAI-compatible)",
    baseUrl: "https://api.example.com/v1",
    model: "your-model",
    keysUrl: "",
    hint: "Any OpenAI-compatible chatbot: Ollama, LM Studio, Together, Azure, a proxy. Loopback http://127.0.0.1:11434/v1 is allowed.",
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
  else window.localStorage.removeItem(KEY_STORE);
}

export function safeChatBase(raw: string): string | null {
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
