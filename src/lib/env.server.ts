export function env(key: string): string | undefined {
  const v = process.env[key]?.trim();
  return v || undefined;
}

/**
 * Workspace preview vs deployed app. The deployer writes GROK_PROJECT_ID on
 * every publish; the sandbox preview never has it. Single source of truth for
 * the split — gate audience, gate endpoints and connector-token semantics all
 * key off this predicate.
 */
export function isWorkspacePreview(): boolean {
  return !env("GROK_PROJECT_ID");
}

export function fabricUrl(): string | undefined {
  return env("DATABASE_URL");
}

export function onV01dFabric(): boolean {
  return (env("DATABASE_URL") || "").includes("10.13.0.20");
}
