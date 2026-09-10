import { env } from "@/lib/env.server";

const ROOT = "https://api.arcade.dev/v1";

export type ArcadeCtx = {
  apiKey: string;
  userId: string;
};

export function arcadeCtx(input?: { apiKey?: string; userId?: string }): ArcadeCtx | null {
  const apiKey = (input?.apiKey || env("ARCADE_API_KEY") || "").trim();
  if (apiKey.length < 12) return null;
  const userId = (input?.userId || env("ARCADE_USER_ID") || "hector-build").trim();
  return { apiKey, userId };
}

async function arcadeFetch(ctx: ArcadeCtx, path: string, init?: RequestInit) {
  const res = await fetch(`${ROOT}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${ctx.apiKey}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  let body: unknown = text;
  try {
    body = JSON.parse(text) as unknown;
  } catch {
    /* raw */
  }
  if (!res.ok) {
    const msg =
      typeof body === "object" && body && "message" in body
        ? String((body as { message?: string }).message)
        : text.slice(0, 400);
    throw new Error(`Arcade ${res.status}: ${msg}`);
  }
  return body;
}

export async function arcadeList(ctx: ArcadeCtx, toolkit?: string) {
  const q = new URLSearchParams({ limit: "40" });
  if (toolkit) q.set("toolkit", toolkit);
  return arcadeFetch(ctx, `/tools?${q.toString()}`);
}

export async function arcadeExecute(ctx: ArcadeCtx, toolName: string, input: Record<string, unknown>) {
  return arcadeFetch(ctx, "/tools/execute", {
    method: "POST",
    body: JSON.stringify({
      tool_name: toolName,
      input,
      user_id: ctx.userId,
    }),
  });
}

export async function arcadeAuthorize(ctx: ArcadeCtx, toolName: string) {
  return arcadeFetch(ctx, "/tools/authorize", {
    method: "POST",
    body: JSON.stringify({ tool_name: toolName, user_id: ctx.userId }),
  });
}
