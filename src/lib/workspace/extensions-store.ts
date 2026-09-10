const KEY = "hector-extensions-v1";

export type ClientExt = {
  arcadeKey: string;
  arcadeUser: string;
  gcpToken: string;
  gcpProject: string;
  gcpMcp: string;
  ibmForge: string;
  ibmForgeToken: string;
};

export function defaultExt(): ClientExt {
  return { arcadeKey: "", arcadeUser: "", gcpToken: "", gcpProject: "", gcpMcp: "cli", ibmForge: "http://127.0.0.1:4444", ibmForgeToken: "" };
}

export function loadExt(): ClientExt {
  const base = defaultExt();
  if (typeof window === "undefined") return base;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<ClientExt>;
    return { ...base, ...parsed };
  } catch {
    return base;
  }
}

export function saveExt(next: ClientExt) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(next));
}
