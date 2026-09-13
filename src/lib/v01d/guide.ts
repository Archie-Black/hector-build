/** Hector in the Linux room. Brief chat. He does the Arch work and teaches as he goes. */

export type Verb = "ask" | "update" | "pacman" | "wine" | "files" | "status" | "run";

export type Job = {
  verb: Verb;
  sh: string;
  inner: string;
  say: string;
  what: string;
  why: string;
};

const DISTRO = "OSV01D";

function wsl(cmd: string, root = false) {
  const user = root ? "-u root " : "";
  return `wsl -d ${DISTRO} ${user}-- bash -lc ${JSON.stringify(cmd)}`;
}

export function greet(fromWindows: boolean, teach: "yes" | "no" | null = null) {
  if (teach === null) {
    return fromWindows
      ? "You know Windows. I know this Linux room. First: do you want me to teach as I work?"
      : "Linux room is on. First: do you want me to teach as I work?";
  }
  if (teach === "no") {
    return fromWindows
      ? "You know Windows. I know this Linux room. Tell me what you want done. I'll do the Linux. I won't explain."
      : "Linux room is on. Tell me what you want. I'll run it. I won't explain.";
  }
  if (fromWindows) {
    return "You know Windows. I know this Linux room. Tell me what you want done. I'll do the Linux part, and I'll tell you what I did and why — in plain words.";
  }
  return "Linux room is on. Tell me what you want. I'll run it, and I'll say what I did and why.";
}

export function hear(text: string): Job {
  const t = text.trim();
  const k = t.toLowerCase();
  if (!t || /^(help|hi|hello|what|idk|i don't know|dunno|huh)\b/i.test(k)) {
    return {
      verb: "ask",
      sh: "",
      inner: "",
      say: "What should I do? Install a program, find your files, run a Windows program, or keep Linux up to date.",
      what: "I need a goal before I touch Linux.",
      why: "Linux will do whatever I type. If I guess, I might install the wrong thing. A short answer from you keeps you in charge.",
    };
  }
  if (/\b(update|upgrade|keep (it|linux) (up to date|current)|patches?)\b/i.test(k)) {
    const inner = "pacman -Syu --noconfirm";
    return {
      verb: "update",
      sh: wsl(inner, true),
      inner,
      say: "I'll update Linux now.",
      what: "I'm asking the Linux room to download newer copies of every program it already has, then install them.",
      why: "On Windows this is Windows Update. Here the catalog is called pacman. Fresh copies close holes and keep programs able to talk to each other. Skipping it is how things slowly break.",
    };
  }
  if (/\b(status|healthy|running|is it on)\b/i.test(k)) {
    const inner = "systemctl is-system-running && pacman -Q | wc -l";
    return {
      verb: "status",
      sh: wsl(inner),
      inner,
      say: "I'll check that the Linux room is up.",
      what: "I'm asking the boot manager if background services are awake, and counting installed programs.",
      why: "Windows people open Task Manager. Linux's boot manager is systemd. If it isn't running, installs and updates stall even though the window still looks fine.",
    };
  }
  const inst = t.match(/\b(?:install|get|add)\s+([a-z0-9._+-]+)/i);
  if (inst) {
    const pkg = inst[1].replace(/[^a-z0-9._+-]/gi, "");
    const inner = `pacman -S --noconfirm ${pkg}`;
    return {
      verb: "pacman",
      sh: wsl(inner, true),
      inner,
      say: `I'll install ${pkg}.`,
      what: `I'm adding ${pkg} from the Linux catalog, the way you'd add an app from the Microsoft Store — except the catalog is Arch's package list, and the installer is pacman.`,
      why: "Linux programs usually are not Setup.exe. They are packages. pacman fetches the right files, puts them in standard folders, and records the name so updates work later. That's why I don't download a random installer from a website.",
    };
  }
  if (/\b(my files|this pc|documents|pictures|downloads|home folder)\b/i.test(k)) {
    const inner = 'ls -la "/mnt/c/Users"';
    return {
      verb: "files",
      sh: wsl(inner),
      inner,
      say: "I'll show your Windows files from Linux.",
      what: "I'm listing the same user folders you already know. Linux names the C: drive /mnt/c. Users is still Users.",
      why: "Two operating systems, one pile of files. If I copied them you'd have two versions and they'd drift. This way a photo you save in Windows is already here.",
    };
  }
  if (/\.(exe|msi|bat)\b/i.test(k) || /\b(run|open)\b.*\bwindows (program|app)\b/i.test(k)) {
    const file = t.match(/[a-zA-Z]:[\\/][^\s]+|\S+\.(exe|msi|bat)/i)?.[0] || "";
    const unix = file.replace(/^([a-zA-Z]):[\\/]/, (_, d: string) => `/mnt/${d.toLowerCase()}/`).replace(/\\/g, "/");
    const inner = `wine ${JSON.stringify(unix || "/mnt/c")}`;
    return {
      verb: "wine",
      sh: wsl(inner),
      inner,
      say: "I'll run that Windows program from the Linux room.",
      what: "I'm starting your .exe through Wine. Wine is a translator: when the program asks Windows to draw a window or open a file, Wine asks Linux to do the same job.",
      why: "Linux does not speak .exe by itself. Wine is not a whole fake PC. It maps Windows requests onto Linux so the program can run without leaving your files behind.",
    };
  }
  if (/\b(search|find|look for)\s+(.+)/i.test(t)) {
    const q = t.replace(/^.*\b(?:search|find|look for)\s+/i, "").replace(/[^a-zA-Z0-9._ -]/g, "").slice(0, 80);
    const inner = `find /mnt/c /home/v01d -iname '*${q}*' 2>/dev/null | head -40`;
    return {
      verb: "run",
      sh: wsl(inner),
      inner,
      say: `I'll look for ${q}.`,
      what: `I'm walking folders by name looking for ${q}.`,
      why: "Windows Search uses an index so it feels instant. Linux find walks the tree when you ask. It can take a moment. It is thorough, and it doesn't wait for a background indexer to catch up.",
    };
  }
  const inner = t.replace(/[^a-zA-Z0-9 ._/=-]/g, " ").slice(0, 200);
  return {
    verb: "run",
    sh: wsl(inner),
    inner,
    say: "I'll do that in the Linux room.",
    what: "I'm passing your request into the Linux room as a command I will run for you.",
    why: "You shouldn't have to memorize Linux verbs. I translate, I run, I tell you what happened. You stay in charge of the goal.",
  };
}

export function showCmd(jargon: boolean, sh: string) {
  if (!jargon) return "";
  return sh;
}
