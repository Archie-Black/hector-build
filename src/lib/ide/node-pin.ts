export function pinnedNode(files: Record<string, string>): string {
  const nvmrc = (files[".nvmrc"] ?? files[".node-version"] ?? "").trim().split("\n")[0]?.trim() ?? "";
  if (nvmrc) return nvmrc.replace(/^v/, "");
  const raw = files["package.json"];
  if (!raw) return "";
  try {
    const pkg = JSON.parse(raw) as {
      volta?: { node?: string };
      engines?: { node?: string };
    };
    const volta = pkg.volta?.node?.trim();
    if (volta) return volta.replace(/^v/, "");
    const engines = pkg.engines?.node?.trim() ?? "";
    const m = engines.match(/(\d+(?:\.\d+){0,2})/);
    return m?.[1] ?? "";
  } catch {
    return "";
  }
}
