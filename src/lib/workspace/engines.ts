import { isLoopbackChat, safeChatBase, type ChatProviderId } from "./providers.ts";
import { ollamaOrigins } from "../ollama/home.ts";
import { ollamaTags } from "../ollama/client.ts";
import { pickPair } from "../ollama/rank.ts";
import type { ForgeMode } from "./types.ts";

export type Engine =
  | { kind: "hector-local"; baseUrl: "/api/v1"; model: "hector-hx"; key: ""; origin?: string }
  | { kind: "ollama" | "lmstudio" | "cloud"; baseUrl: string; model: string; key: string; origin?: string };

export async function probeOllama(homeUrl?: string, mode?: ForgeMode): Promise<Engine | null> {
  for (const origin of ollamaOrigins(homeUrl)) {
    const names = await ollamaTags(origin);
    const pair = pickPair(names);
    if (!pair) continue;
    const model = mode === "scout" || mode === "plan" ? pair.fast : pair.best;
    return { kind: "ollama", baseUrl: `${origin}/v1`, model, key: "local", origin };
  }
  return null;
}

export async function resolveEngine(input: {
  providerId?: ChatProviderId;
  baseUrl?: string;
  model?: string;
  key?: string;
  homeUrl?: string;
  mode?: ForgeMode;
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

  const live = await probeOllama(input.homeUrl, input.mode);
  if (id === "ollama" || id === "hector" || !key) {
    if (live) {
      const pick = model && !/hector|spectral|hx-local/.test(model) ? model : live.model;
      return { kind: "ollama", baseUrl: live.baseUrl, model: pick, key: "local", origin: live.origin };
    }
  }
  return { kind: "hector-local", baseUrl: "/api/v1", model: "hector-hx", key: "" };
}
