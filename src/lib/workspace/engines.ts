import { isLoopbackChat, safeChatBase, type ChatProviderId } from "./providers.ts";
import { ollamaOrigins, vllmOrigins } from "../ollama/home.ts";
import { ollamaTags, openaiModels } from "../ollama/client.ts";
import { pickPair } from "../ollama/rank.ts";
import { decide, pickHouseModel } from "../cluster/governor.ts";
import type { ForgeMode } from "./types.ts";

export type LocalEngine = { kind: "ollama" | "vllm"; baseUrl: string; model: string; key: string; origin?: string; fast?: string; best?: string; steady?: string; boost?: string };

export type Engine =
  | { kind: "hector-local"; baseUrl: "/api/v1"; model: "hector-hx"; key: ""; origin?: string }
  | LocalEngine
  | { kind: "lmstudio" | "cloud"; baseUrl: string; model: string; key: string; origin?: string };

type Hit = { kind: "ollama" | "vllm"; origin: string; names: string[] };

async function scanCluster(homeUrl?: string): Promise<Hit[]> {
  const hits: Hit[] = [];
  for (const origin of ollamaOrigins(homeUrl)) {
    const names = await ollamaTags(origin);
    if (names.length) hits.push({ kind: "ollama", origin, names });
  }
  for (const origin of vllmOrigins(homeUrl)) {
    if (hits.some((h) => h.origin === origin)) continue;
    const names = await openaiModels(origin);
    if (names.length) hits.push({ kind: "vllm", origin, names });
  }
  return hits;
}

export async function probeOllama(homeUrl?: string, mode?: ForgeMode): Promise<LocalEngine | null> {
  const hits = await scanCluster(homeUrl);
  if (!hits.length) return null;
  const names = [...new Set(hits.flatMap((h) => h.names))];
  const pair = pickPair(names);
  if (!pair) return null;
  const house = decide({ mode, names });
  const model =
    house.class === "7"
      ? pair.fast
      : house.class === "mix"
        ? pickHouseModel(names, "mix", pair.best, pair.fast)
        : pair.best;
  const owner = hits.find((h) => h.names.includes(model)) ?? hits.find((h) => h.names.includes(pair.best)) ?? hits[0]!;
  return {
    kind: owner.kind,
    baseUrl: `${owner.origin}/v1`,
    model,
    key: "local",
    origin: owner.origin,
    fast: pair.fast,
    best: pair.best,
    steady: pair.best,
    boost: pickHouseModel(names, "mix", pair.best, pair.fast),
  };
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
  if (id === "lmstudio" || (base.includes(":1234") && isLoopbackChat(base))) {
    return { kind: "lmstudio", baseUrl: base || "http://127.0.0.1:1234/v1", model: model || "local-model", key: "local" };
  }

  const live = await probeOllama(input.homeUrl, input.mode);
  if (id === "custom" && base && (key.length >= 12 || isLoopbackChat(base)) && !live) {
    return { kind: "cloud", baseUrl: base, model: model || "local-model", key: key || "local" };
  }
  if (id === "ollama" || id === "hector" || id === "custom" || !key) {
    if (live) {
      const pick = model && !/hector|spectral|hx-local/.test(model) ? model : live.model;
      const owner = pick === live.model ? live : { ...live, model: pick };
      return { kind: live.kind, baseUrl: live.baseUrl, model: owner.model, key: "local", origin: live.origin };
    }
  }
  if (id === "custom" && base && (key.length >= 12 || isLoopbackChat(base))) {
    return { kind: "cloud", baseUrl: base, model: model || "local-model", key: key || "local" };
  }
  return { kind: "hector-local", baseUrl: "/api/v1", model: "hector-hx", key: "" };
}
