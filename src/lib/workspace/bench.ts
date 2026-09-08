const KEY = "hector-bench-v1";

export type BenchSettings = {
  spendCap: number;
  allowlist: string[];
};

export function defaultBench(): BenchSettings {
  return { spendCap: 20, allowlist: [] };
}

export function loadBench(): BenchSettings {
  if (typeof window === "undefined") return defaultBench();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultBench();
    const parsed = JSON.parse(raw) as Partial<BenchSettings>;
    return {
      spendCap: Math.max(1, Math.min(200, Number(parsed.spendCap) || 20)),
      allowlist: Array.isArray(parsed.allowlist)
        ? parsed.allowlist.map(String).slice(0, 40)
        : [],
    };
  } catch {
    return defaultBench();
  }
}

export function saveBench(settings: BenchSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(settings));
}
