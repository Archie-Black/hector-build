/** Linux room. Teach, or just do the job. Their call. */

export type Teach = "yes" | "no";

const KEY = "v01d.teach";

export function loadTeach(): Teach | null {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "yes" || v === "no") return v;
  } catch {
    /* */
  }
  return null;
}

export function saveTeach(v: Teach) {
  try {
    localStorage.setItem(KEY, v);
  } catch {
    /* */
  }
  return v;
}

export function wantsTeach(text: string): Teach | null {
  const k = text.toLowerCase();
  if (/\b(yes[,.]? teach me|teach me|i want to (learn|know)|explain (it|this|please))\b/i.test(k)) return "yes";
  if (/\b(no[,.]? i don'?t want to know|just do (the )?job|don'?t (teach|explain)|no teach|skip (the )?lesson)\b/i.test(k)) return "no";
  return null;
}

export function askTeach() {
  return "Yes, teach me — I'll tell you what I'm doing in Linux and why. Or No, I don't want to know — I'll just do the job.";
}

export function lesson<T extends { what: string; why: string }>(job: T, teach: Teach | null): T {
  if (teach === "yes") return job;
  return { ...job, what: "", why: "" };
}
