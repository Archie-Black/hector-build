/** First-run profile. Install asks the easy question first. */

export type Desk = "play" | "work";
export type Home = "windows" | "linux" | "mac" | "new";
export type Nerve = "hide" | "show" | "type";
export type Term = "never" | "must" | "like";

export type Profile = {
  desk: Desk;
  home: Home;
  term: Term;
  nerve: Nerve;
  files: "explorer" | "home" | "either";
};

export type Q = { id: keyof Profile; ask: string; picks: { id: string; say: string }[] };

export const QUIZ: Q[] = [
  {
    id: "desk",
    ask: "What is this computer for?",
    picks: [
      { id: "play", say: "Games and entertainment. Load everything. High-end multimedia." },
      { id: "work", say: "School, office, and learning. Full power. Games live in the Start menu. Art and music stay." },
    ],
  },
  {
    id: "home",
    ask: "What does your computer usually feel like?",
    picks: [
      { id: "windows", say: "Windows. Start menu, This PC, I know that." },
      { id: "linux", say: "Linux. Folders and a terminal do not scare me." },
      { id: "mac", say: "A Mac. Finder and one mouse button." },
      { id: "new", say: "I'm new. Please be gentle." },
    ],
  },
  {
    id: "term",
    ask: "How do you feel about a black window you type into?",
    picks: [
      { id: "never", say: "I never want to see that." },
      { id: "must", say: "Only if something is really broken." },
      { id: "like", say: "I like it. Leave it around." },
    ],
  },
  {
    id: "nerve",
    ask: "If something goes wrong, what should Hector do?",
    picks: [
      { id: "hide", say: "Fix it quietly. Tell me when it is done." },
      { id: "show", say: "Tell me in plain words." },
      { id: "type", say: "Show me the commands. I want to learn." },
    ],
  },
  {
    id: "files",
    ask: "How should files look?",
    picks: [
      { id: "explorer", say: "Like This PC. Drives and familiar names." },
      { id: "home", say: "Like Home. Documents, Pictures, Downloads." },
      { id: "either", say: "Either. I will find my way." },
    ],
  },
];

const KEY = "v01d.comfort";

export function load(): Profile | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Profile;
    if (!p.home || !p.term || !p.nerve || !p.files) return null;
    if (!p.desk) p.desk = "work";
    return p;
  } catch {
    return null;
  }
}

export function save(p: Profile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* */
  }
  return p;
}

export function clear() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* */
  }
}

export type Face = {
  start: string;
  files: string;
  programs: string;
  linux: string;
  terminal: boolean;
  jargon: boolean;
  desk: Desk;
};

export function face(p: Profile): Face {
  const windows = p.home === "windows" || p.home === "new";
  return {
    start: windows ? "Start" : p.home === "mac" ? "Go" : "Apps",
    files: p.files === "explorer" || windows ? "This PC" : "Home",
    programs: windows ? "Programs" : p.home === "mac" ? "Applications" : "Programs",
    linux: windows ? "Linux room" : "Arch",
    terminal: p.term === "like",
    jargon: p.nerve === "type",
    desk: p.desk,
  };
}

export function onRing(id: string, desk: Desk) {
  if (desk === "play") return true;
  return id !== "portal";
}

export function welcome(p: Profile) {
  const f = face(p);
  if (p.desk === "play") {
    return `Games and entertainment. Everything is loaded. The carousel is the desk.`;
  }
  if (p.home === "new" || p.term === "never") {
    return `School and office. I set this up like ${f.files}. Art and music stay. Games live in ${f.start}. You will not see a terminal unless you open the ${f.linux}.`;
  }
  if (p.home === "windows") {
    return `Standard desk. Start menu. ${f.files}. Games are in Start. Art, music, and the full stack stay.`;
  }
  return `Standard desk. Full power. Games live in the menu. Art and music stay.`;
}
