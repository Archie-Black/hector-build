export type Who = "you" | "hector";
export type Sticky = { id: string; who: Who; md: string; hue: number };

const KEY = "hx-ghostit";

export function load(): Sticky[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Sticky[];
  } catch {
    /* first run */
  }
  return [
    { id: "h1", who: "hector", md: "**Hector:** I keep a copy of what you pin.\n- I will not throw it out\n- I do not copy to save time. Each note is its own.", hue: 210 },
  ];
}

export function save(xs: Sticky[]) {
  localStorage.setItem(KEY, JSON.stringify(xs));
}

export function hectorReply(text: string): Sticky {
  const short = text.replace(/[#*_`]/g, "").slice(0, 80);
  return {
    id: `h-${Date.now()}`,
    who: "hector",
    md: `**Hector:** Got it.\n> ${short || "blank note"}\n\nI'll keep this next to yours.`,
    hue: 210,
  };
}
