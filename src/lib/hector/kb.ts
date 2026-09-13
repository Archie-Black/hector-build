/** Hector's working library. Templates, tools, macros. Common sense first. */

export type Kind = "template" | "tool" | "macro" | "help";

export type Card = {
  id: string;
  kind: Kind;
  title: string;
  tags: string[];
  why: string;
  body: string;
};

export const CARDS: Card[] = [
  {
    id: "letter",
    kind: "template",
    title: "Plain letter",
    tags: ["office", "school", "write"],
    why: "People freeze on a blank page. A date, a name, a point, a close. That is a letter.",
    body: "[Date]\n\nDear [Name],\n\n[One thing you need. One fact. One ask.]\n\nThank you,\n[You]",
  },
  {
    id: "invoice",
    kind: "template",
    title: "Simple invoice",
    tags: ["office", "money"],
    why: "If it does not say who, what, how much, and when, it is not an invoice.",
    body: "Invoice #[n]\nFrom: [you]\nTo: [them]\nDate: [day]\nDue: [day]\n\n[item] — [amount]\nTotal: [amount]\n",
  },
  {
    id: "lesson",
    kind: "template",
    title: "Lesson notes",
    tags: ["school", "learn"],
    why: "Write what you heard, what it means, one question you still have. That is how it sticks.",
    body: "Topic:\nWhat I heard:\nWhat it means:\nOne question:\n",
  },
  {
    id: "slides",
    kind: "template",
    title: "Five-slide talk",
    tags: ["school", "office"],
    why: "Five slides. Problem, fact, plan, proof, ask. More slides hide that you do not know.",
    body: "1. The problem\n2. One fact\n3. The plan\n4. Proof it works\n5. What you need from them\n",
  },
  {
    id: "podcast",
    kind: "template",
    title: "Podcast rundown",
    tags: ["music", "forge", "media"],
    why: "A show without a rundown rambles. Three beats and a close.",
    body: "Title:\nOpen (30s):\nBeat 1:\nBeat 2:\nBeat 3:\nClose:\n",
  },
  {
    id: "brief",
    kind: "template",
    title: "Project brief",
    tags: ["office", "code", "build"],
    why: "If you cannot say done-when, you will never be done.",
    body: "Goal:\nNot this:\nDone when:\nWho:\nBy when:\n",
  },
  {
    id: "resume",
    kind: "template",
    title: "One-page resume",
    tags: ["school", "office"],
    why: "One page. Verbs. Numbers. No poetry.",
    body: "Name\n[role you want]\n\nWork\n- [verb] [thing] [number]\n\nLearn\n- [school or skill]\n",
  },
  {
    id: "minutes",
    kind: "template",
    title: "Meeting minutes",
    tags: ["office"],
    why: "Who said they would do what by when. Everything else is chat.",
    body: "When:\nWho:\nDecided:\nActions: [who] [what] [when]\n",
  },
  {
    id: "krita-layer",
    kind: "help",
    title: "Krita layers look gone",
    tags: ["krita", "art", "suite"],
    why: "You probably hid a layer or painted on the wrong one. That is the usual miss. Not a broken install.",
    body: "Open Layers. Eye icon on. Paint on the layer that is highlighted. If you flattened by accident, Undo. Save a .kra, not only a png.",
  },
  {
    id: "ardour-silent",
    kind: "help",
    title: "Ardour has no sound",
    tags: ["ardour", "forge", "music"],
    why: "The DAW is fine. The box is talking to the wrong output.",
    body: "Check the meter moves. If it does, pick the right playback device in Audio Setup. PipeWire, then your speakers. Recheck after headphones.",
  },
  {
    id: "obs-black",
    kind: "help",
    title: "OBS is a black frame",
    tags: ["obs", "suite", "play"],
    why: "A capture source with nothing behind it is black. Not a GPU death.",
    body: "Add a Display or Window capture. Click the source. If it is still black, pick the right screen. Disable extra GPU capture plugins you did not install on purpose.",
  },
  {
    id: "print",
    kind: "help",
    title: "It will not print",
    tags: ["office", "printer"],
    why: "Most 'broken printers' are the wrong queue or paper. Check those before drivers.",
    body: "Is it on? Paper in? The queue you picked is that printer, not last year's? Print a test page. Then we talk drivers.",
  },
  {
    id: "wifi",
    kind: "help",
    title: "Wi-Fi will not join",
    tags: ["net", "office"],
    why: "Wrong password and the 5 GHz radio you cannot see from the kitchen cover most of this.",
    body: "Click the + under the clock. Pick the name you know. Type the password slowly. If a phone is already on that network, we can copy from there with your say-so.",
  },
  {
    id: "save-two",
    kind: "tool",
    title: "Save a copy before you wreck it",
    tags: ["files", "macro"],
    why: "Undo is not a backup. A dated copy is.",
    body: "Copy the file next to itself with today's date in the name. Then edit.",
  },
  {
    id: "focus",
    kind: "tool",
    title: "One thing for twenty minutes",
    tags: ["school", "office"],
    why: "A pile of tabs is not work. A timer is.",
    body: "Close the extra windows. Set twenty minutes. One file. Then stand up.",
  },
];

const STORE = "v01d.macros";

export function macros(): Card[] {
  try {
    const raw = localStorage.getItem(STORE);
    if (!raw) return [];
    return JSON.parse(raw) as Card[];
  } catch {
    return [];
  }
}

export function addMacro(title: string, body: string, why = "You asked me to remember this.") {
  const row: Card = { id: `macro-${Date.now()}`, kind: "macro", title, tags: ["macro"], why, body };
  const all = [...macros(), row];
  try {
    localStorage.setItem(STORE, JSON.stringify(all));
  } catch {
    /* */
  }
  return row;
}

export function library() {
  return [...CARDS, ...macros()];
}

export function search(text: string) {
  const q = text.toLowerCase();
  return library()
    .map((c) => ({ c, n: score(c, q) }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
    .map((x) => x.c);
}

function score(c: Card, q: string) {
  const words = q.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
  let n = 0;
  for (const w of words) {
    if (c.id === w || c.title.toLowerCase().includes(w)) n += 5;
    if (c.tags.includes(w)) n += 3;
    if ((c.body + c.why).toLowerCase().includes(w)) n += 1;
  }
  return n;
}

export function answer(text: string) {
  const hit = search(text)[0];
  if (!hit) return null;
  return `${hit.title}. ${hit.why} ${hit.body}`;
}

export function wantsKb(text: string) {
  return /\b(template|invoice|letter|resume|minutes|lesson|rundown|how do i|help with|macro)\b/i.test(text);
}
