let skew = 0;

export async function syncNtp() {
  try {
    const r = await fetch("/api/v1/time");
    const j = (await r.json()) as { now: number; sys: number };
    if (j.now) skew = j.now - Date.now();
  } catch {
    skew = 0;
  }
}

export function now(): Date {
  return new Date(Date.now() + skew);
}
