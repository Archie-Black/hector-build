/** Linux for Beginners. Offered while agents work. Progress is remembered. Harder as they pass. */

export type Band = "begin" | "more" | "deeper";

export type Q = { q: string; picks: string[]; ok: number };

export type Lesson = {
  id: string;
  band: Band;
  title: string;
  body: string;
  code?: string;
  parts?: { bit: string; mean: string }[];
  quiz: Q[];
};

export type Progress = {
  done: string[];
  scores: Record<string, number>;
  band: Band;
};

const KEY = "v01d.linux-class";

export const CLASS: Lesson[] = [
  {
    id: "files",
    band: "begin",
    title: "Two rooms, one pile of files",
    body: "Windows calls the disk C:. Linux calls that same disk /mnt/c in this room. Your Documents folder did not move. We did not copy it. If you save a photo in Windows, it is already here. That is why you never hunt for a second Pictures folder.",
    quiz: [
      { q: "Where is C: in the Linux room?", picks: ["Gone", "/mnt/c", "A USB stick"], ok: 1 },
      { q: "A file you save in Windows is…", picks: ["Copied later tonight", "Already here", "Lost"], ok: 1 },
    ],
  },
  {
    id: "store",
    band: "begin",
    title: "pacman is the Store",
    body: "Windows people download Setup.exe. Linux programs usually arrive as packages. pacman is the installer and the catalog. I ask it for a name. It fetches the right files, puts them in standard folders, and writes the name down so updates work later. That is why I don't send you to a random website.",
    quiz: [
      { q: "pacman is closest to…", picks: ["Notepad", "The Microsoft Store / installer", "Task Manager"], ok: 1 },
      { q: "Why not download a random installer?", picks: ["It's slower", "pacman tracks the name so updates still work", "Linux hates files"], ok: 1 },
    ],
  },
  {
    id: "update",
    band: "more",
    title: "Keeping Linux current",
    body: "Windows Update quietly patches the system. Here I ask pacman to refresh the catalog, then install newer copies of what you already have. Skipping it is how programs stop talking to each other months later. You asked me to keep it healthy. This is that job.",
    quiz: [
      { q: "Linux updates are like…", picks: ["Emptying Recycle Bin", "Windows Update", "Changing wallpaper"], ok: 1 },
      { q: "If we skip updates…", picks: ["Nothing", "Programs get old and some stop working together", "Files delete themselves"], ok: 1 },
    ],
  },
  {
    id: "wine",
    band: "more",
    title: "Wine is a translator, not a fake PC",
    body: "Linux does not speak .exe by itself. Wine maps Windows asks (draw a window, open a file) onto Linux asks. It is not a whole pretend computer. Your files stay yours. If a program is written only for Windows, Wine is how it can still run in this room.",
    quiz: [
      { q: "Wine…", picks: ["Replaces your Windows install", "Translates Windows asks into Linux asks", "Deletes .exe files"], ok: 1 },
      { q: "Your Windows files during Wine…", picks: ["Get copied to a VM", "Stay where they are", "Move to the cloud"], ok: 1 },
    ],
  },
  {
    id: "services",
    band: "deeper",
    title: "systemd is the boot crew",
    body: "Windows has services that start with the machine. Linux has systemd doing that job. If systemd is not running, installs and updates can stall even though the window still looks fine. When I 'check the room', I am asking that crew if they are awake — like glancing at Task Manager, not decorating the desktop.",
    quiz: [
      { q: "systemd is closest to…", picks: ["Paint", "The services that start with Windows", "A web browser"], ok: 1 },
      { q: "If systemd is down…", picks: ["Wallpaper changes", "Installs and updates can stall", "The mouse dies"], ok: 1 },
    ],
  },
  {
    id: "root",
    band: "deeper",
    title: "Don't live as Administrator",
    body: "Windows warns when a program wants admin. Linux calls that user root. I use root only for installs and updates, then I drop it. Everyday work happens as v01d, a normal person. That is not me being difficult. A mistake as root can change the whole machine. A mistake as you usually only hurts one folder.",
    quiz: [
      { q: "root is like…", picks: ["Guest", "Administrator", "Recycle Bin"], ok: 1 },
      { q: "Why not stay root all day?", picks: ["It's slower", "A mistake can change the whole machine", "Linux forbids it forever"], ok: 1 },
    ],
  },
  {
    id: "hello-sh",
    band: "begin",
    title: "Your first program — you type it",
    body: "I will not write this for you. Open a text file named hello.sh and type every character yourself. That is how it sticks. A program is just a file of instructions. Linux reads it from the top down. Do not paste from an AI. If you didn't type it, you don't own it yet.",
    code: "#!/bin/sh\necho \"hello\"",
    parts: [
      { bit: "#!/bin/sh", mean: "Shebang. First line. Tells Linux which program reads the rest. /bin/sh is a small shell — think of it as Linux's cmd.exe, not a whole IDE." },
      { bit: "echo", mean: "Print text to the screen. That is all it does." },
      { bit: "\"hello\"", mean: "The text to print. Quotes keep it one piece, even later when you add spaces." },
    ],
    quiz: [
      { q: "Who should type hello.sh?", picks: ["Hector / an AI", "You, by hand", "pacman"], ok: 1 },
      { q: "#!/bin/sh is…", picks: ["A comment you can delete", "The shebang: which program reads the file", "The name of the file"], ok: 1 },
    ],
  },
  {
    id: "chmod",
    band: "more",
    title: "Make it runnable",
    body: "Windows knows a program by .exe. Linux knows a program by a permission bit: execute. After you save hello.sh you still have a text file until you allow it to run. Type this yourself. Then run it with ./ so Linux looks in this folder, not in the system path.",
    code: "chmod +x hello.sh\n./hello.sh",
    parts: [
      { bit: "chmod", mean: "Change mode. Mode means permissions: read, write, run." },
      { bit: "+x", mean: "Add execute. You are saying this file is allowed to run, not only to be read." },
      { bit: "./hello.sh", mean: "./ means this folder. Without it, Linux hunts the system path and will say command not found even though the file is right here." },
    ],
    quiz: [
      { q: "Linux knows a program by…", picks: [".exe at the end", "an execute permission bit", "a blue icon"], ok: 1 },
      { q: "./ means…", picks: ["The internet", "This folder", "Administrator"], ok: 1 },
    ],
  },
  {
    id: "vars",
    band: "more",
    title: "Names that hold values",
    body: "A variable is a labeled box. You put a value in. Later you take it out with $. Type this. No spaces around the equals sign — Linux is picky there. If you let an AI write it, you will not feel that pickiness, and you will not know how to fix it.",
    code: "#!/bin/sh\nname=\"Sam\"\necho \"Hi $name\"",
    parts: [
      { bit: "name=\"Sam\"", mean: "Create a box called name and put Sam in it. No spaces beside =." },
      { bit: "$name", mean: "Take out whatever is in the box and put it here." },
      { bit: "echo \"Hi $name\"", mean: "Print Hi plus the contents of name. Quotes let the space and the $name live in one line." },
    ],
    quiz: [
      { q: "$name means…", picks: ["A price", "Put the value of name here", "Delete name"], ok: 1 },
      { q: "Spaces around = in name=Sam?", picks: ["Required", "Forbidden here — Linux will break the line", "Optional like Windows"], ok: 1 },
    ],
  },
  {
    id: "c-hello",
    band: "deeper",
    title: "A tiny C program, compiled",
    body: "Shell scripts are instructions for the shell. C is instructions for the machine, after a compiler translates them. You write hello.c by hand. gcc does not think. It follows rules. I will not generate this file for you. When it fails, read the error — it points at a line. That is the skill.",
    code: "#include <stdio.h>\nint main(void) {\n  printf(\"hello\\n\");\n  return 0;\n}",
    parts: [
      { bit: "#include <stdio.h>", mean: "Pull in a library of already-written tools. stdio = standard input/output (print, read). You did not write printf. You asked to use it." },
      { bit: "int main(void)", mean: "Every C program starts at main. int: it will send a number back to Linux when it finishes. void: no inputs from the command line in this example." },
      { bit: "{ }", mean: "A block. Everything between the braces belongs to main." },
      { bit: "printf(\"hello\\n\");", mean: "Print hello, then a new line. \\n is the new line. The semicolon ends the instruction. Forget it and the compiler complains." },
      { bit: "return 0;", mean: "Tell Linux this went fine. 0 means success, like ERRORLEVEL 0 on Windows. Any other number means something went wrong." },
    ],
    quiz: [
      { q: "gcc…", picks: ["Thinks up the program for you", "Translates your text into a real program using rules", "Runs Windows"], ok: 1 },
      { q: "return 0 means…", picks: ["Delete the file", "Success, like ERRORLEVEL 0", "Restart Linux"], ok: 1 },
    ],
  },
  {
    id: "gcc-run",
    band: "deeper",
    title: "Compile and run what you wrote",
    body: "The .c file is not the program yet. gcc reads your text and writes a new file the machine can run. -o names that file. Then ./ runs it. If gcc prints an error, it is talking about a line you typed. Fix that line. Do not ask an AI to rewrite the whole file — you will not learn the mistake.",
    code: "gcc hello.c -o hello\n./hello",
    parts: [
      { bit: "gcc", mean: "The GNU C compiler. Translator. Not an author." },
      { bit: "hello.c", mean: "The text file you wrote." },
      { bit: "-o hello", mean: "Name the output hello (the runnable file). Without -o you get a file called a.out, an old default." },
      { bit: "./hello", mean: "Run the program in this folder." },
    ],
    quiz: [
      { q: "If gcc errors, you should…", picks: ["Delete Linux", "Read the line it names and fix what you typed", "Ask an AI to rewrite the whole file"], ok: 1 },
      { q: "-o hello means…", picks: ["Open hello", "Name the output file hello", "Overwrite Windows"], ok: 1 },
    ],
  },
  {
    id: "if",
    band: "deeper",
    title: "Choices: if / then / fi",
    body: "Programs branch. if tests a question. then is what to do if the answer is yes. fi ends the if (if spelled backwards — an old Unix habit). $1 is the first word you typed after the script name. Type this file yourself. Change the word ok and run it both ways so you see both paths.",
    code: "#!/bin/sh\nif [ \"$1\" = \"ok\" ]; then\n  echo yes\nfi",
    parts: [
      { bit: "$1", mean: "The first word you typed after the script name. ./check.sh ok  →  $1 is ok." },
      { bit: "[ \"$1\" = \"ok\" ]", mean: "A test. Are these two texts the same? Quotes protect empty values so the test doesn't explode." },
      { bit: "then", mean: "If the test is true, do the next lines." },
      { bit: "echo yes", mean: "Print yes." },
      { bit: "fi", mean: "End of the if. Nothing after fi is part of the yes-path." },
    ],
    quiz: [
      { q: "fi means…", picks: ["Find", "The end of if", "Force install"], ok: 1 },
      { q: "$1 is…", picks: ["Always 1", "The first word you typed after the script", "Root password"], ok: 1 },
    ],
  },
];

const ORDER: Band[] = ["begin", "more", "deeper"];

export function empty(): Progress {
  return { done: [], scores: {}, band: "begin" };
}

export function loadClass(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const p = JSON.parse(raw) as Progress;
    if (!Array.isArray(p.done)) return empty();
    return { done: p.done, scores: p.scores || {}, band: p.band || "begin" };
  } catch {
    return empty();
  }
}

export function saveClass(p: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* */
  }
  return p;
}

export function next(p: Progress): Lesson | null {
  const pool = CLASS.filter((l) => l.band === p.band && !p.done.includes(l.id));
  if (pool[0]) return pool[0];
  const i = ORDER.indexOf(p.band);
  const up = ORDER[i + 1];
  if (!up) return null;
  return CLASS.find((l) => l.band === up && !p.done.includes(l.id)) ?? null;
}

export function grade(lesson: Lesson, picks: number[], p: Progress): { ok: boolean; score: number; need: number; note: string; progress: Progress } {
  let score = 0;
  lesson.quiz.forEach((q, i) => {
    if (picks[i] === q.ok) score += 1;
  });
  const need = lesson.quiz.length;
  const ok = score === need;
  const scores = { ...p.scores, [lesson.id]: score };
  let done = p.done;
  let band = p.band;
  if (ok && !done.includes(lesson.id)) done = [...done, lesson.id];
  const remain = CLASS.filter((l) => l.band === band && !done.includes(l.id));
  if (ok && remain.length === 0) {
    const i = ORDER.indexOf(band);
    if (ORDER[i + 1]) band = ORDER[i + 1];
  }
  const progress = saveClass({ done, scores, band });
  const note = ok
    ? score === need && band !== p.band
      ? "Passed. Next lessons get harder."
      : "Passed. I'll remember."
    : `You had ${score} of ${need}. We'll keep this lesson. No rush.`;
  return { ok, score, need, note, progress };
}

export function offer(teach: boolean, busy: boolean, p: Progress) {
  if (!teach || !busy) return null;
  const l = next(p);
  if (!l) return "The ghosts are working. You've finished Linux for Beginners through the hard set. Ask if you want a recap.";
  return `The ghosts are working in the background. Linux for Beginners — ${l.title}. Type the code yourself. I explain the parts. Skip if you only want the job.`;
}
