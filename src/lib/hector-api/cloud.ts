/** Optional cloud boost. Local engine is the default; a bearer key extends it. */

export type CloudTarget = {
  baseUrl: string;
  model: string;
};

export function bearerFrom(request: Request) {
  const raw = request.headers.get("authorization") || request.headers.get("x-api-key") || "";
  const token = raw.replace(/^Bearer\s+/i, "").trim();
  return token.length >= 12 && !/\s/.test(token) ? token : "";
}

export function isLocalModel(model: string) {
  const m = (model || "").toLowerCase();
  return !m || /hector|spectral-hx|hx-local|local/.test(m);
}

export function cloudTarget(model: string, key: string): CloudTarget | null {
  if (!key) return null;
  const m = (model || "").trim();
  if (/^xai-|grok/i.test(key) || /^grok/i.test(m) || /x\.ai/i.test(m)) {
    return { baseUrl: "https://api.x.ai/v1", model: m && !isLocalModel(m) ? m : "grok-4" };
  }
  if (/^gsk_/i.test(key) || /groq/i.test(m)) {
    return { baseUrl: "https://api.groq.com/openai/v1", model: m && !isLocalModel(m) ? m : "llama-3.3-70b-versatile" };
  }
  if (/^sk-or-/i.test(key) || /openrouter/i.test(m)) {
    return { baseUrl: "https://openrouter.ai/api/v1", model: m && !isLocalModel(m) ? m : "openai/gpt-4.1-mini" };
  }
  if (/^sk-/i.test(key) || /^gpt/i.test(m) || /^o[1-4]/i.test(m)) {
    return { baseUrl: "https://api.openai.com/v1", model: m && !isLocalModel(m) ? m : "gpt-4.1-mini" };
  }
  if (/cloud|boost|extend/i.test(m) && key) {
    return { baseUrl: "https://api.x.ai/v1", model: "grok-4" };
  }
  return null;
}

export async function cloudChat(target: CloudTarget, key: string, body: Record<string, unknown>) {
  const res = await fetch(`${target.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      ...body,
      model: target.model,
      stream: false,
    }),
  });
  const text = await res.text();
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    parsed = { error: { message: text.slice(0, 400) } };
  }
  return { ok: res.ok, status: res.status, body: parsed };
}
