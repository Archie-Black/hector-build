export type QuerySystem = "keyword" | "syntax";
export type VectorStore = "duckdb" | "lancedb";

const KEY = "hector-memory-engines-v1";

export type MemoryEngines = {
  querySystem: QuerySystem;
  vectorStore: VectorStore;
};

export function defaultEngines(): MemoryEngines {
  return { querySystem: "keyword", vectorStore: "duckdb" };
}

export function loadEngines(): MemoryEngines {
  if (typeof window === "undefined") return defaultEngines();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultEngines();
    const parsed = JSON.parse(raw) as Partial<MemoryEngines>;
    return {
      querySystem: parsed.querySystem === "syntax" ? "syntax" : "keyword",
      vectorStore: parsed.vectorStore === "lancedb" ? "lancedb" : "duckdb",
    };
  } catch {
    return defaultEngines();
  }
}

export function saveEngines(next: MemoryEngines) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(next));
}
