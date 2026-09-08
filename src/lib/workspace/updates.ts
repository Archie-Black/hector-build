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

export function buildDailyUpdate(input: {
  fileCount: number;
  failing: number;
  lessons: string[];
}): PendingUpdate {
  const lessons = [
    "Keep group permission on the granted project.",
    "Team lead assigns scout, patch, and checks. Do not skip checks.",
    input.failing
      ? `Address ${input.failing} failing check(s) before declaring the job done.`
      : "Checks are clear. Prefer small, complete diffs.",
  ];
  return {
    id: crypto.randomUUID(),
    builtAt: Date.now(),
    summary: `Daily improvement build · ${input.fileCount} files · ${input.failing ? `${input.failing} failing checks` : "checks clear"}.`,
    lessons,
  };
}
