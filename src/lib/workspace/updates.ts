const KEY = "hector-update-policy-v1";

export type UpdatePolicy = "approve" | "silent";

export type PendingUpdate = {
  id: string;
  builtAt: number;
  summary: string;
  lessons: string[];
};

export type UpdateSettings = {
  policy: UpdatePolicy;
  installHour: number;
  lastBuildDay: string;
  lastInstallDay: string;
  pending: PendingUpdate | null;
};

export function defaultUpdateSettings(): UpdateSettings {
  return {
    policy: "approve",
    installHour: 3,
    lastBuildDay: "",
    lastInstallDay: "",
    pending: null,
  };
}

export function loadUpdateSettings(): UpdateSettings {
  if (typeof window === "undefined") return defaultUpdateSettings();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultUpdateSettings();
    const parsed = JSON.parse(raw) as UpdateSettings;
    return { ...defaultUpdateSettings(), ...parsed };
  } catch {
    return defaultUpdateSettings();
  }
}

export function saveUpdateSettings(settings: UpdateSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(settings));
}

export function todayStamp(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export const UPDATE_FEED = "https://www.doomchat.ca/updates.json";

export async function fetchHostUpdates() {
  try {
    const res = await fetch(UPDATE_FEED, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as {
      app: string;
      releases: { id: string; summary: string; lessons: string[] }[];
    };
  } catch {
    return null;
  }
}

export function buildDailyUpdate(input: {
  fileCount: number;
  failing: number;
  lessons: string[];
}): PendingUpdate {
  const lessons = [
    "Be good. Be better. Never give up.",
    "Keep group permission on the granted project.",
    "Team lead assigns scout, patch, and checks. Do not skip checks.",
    input.failing
      ? `Address ${input.failing} failing check(s). Do not stop until they pass.`
      : "Checks are clear. Prefer small, complete diffs. Then look for one way to be better.",
  ];
  return {
    id: crypto.randomUUID(),
    builtAt: Date.now(),
    summary: `Daily improvement build · ${input.fileCount} files · ${input.failing ? `${input.failing} failing checks` : "checks clear"}.`,
    lessons,
  };
}
