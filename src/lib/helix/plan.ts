/** Rebuild if we have source. Wrap if we only have a binary. Honest. */

import { fromOf, kind, peel, wantTo, type Face, type Kind } from "./sniff";
import { kit } from "./kit";

export type Move = "rebuild" | "adapt" | "already" | "no";

export type Plan = {
  move: Move;
  from: Face;
  to: Face;
  what: Kind;
  path: string;
  note: string;
  steps: string[];
  sh: string;
  bat: string;
};

export function planHelix(text: string, file = peel(text)): Plan {
  const path = file || peel(text);
  const what = kind(path);
  const from = fromOf(path);
  const to = wantTo(text, path);
  if (from === to && what !== "source" && what !== "script") {
    return { move: "already", from, to, what, path, note: "It already belongs on that side.", steps: [], sh: "", bat: "" };
  }
  if (what === "script") {
    const wrap = kit(path, from, to, "rebuild");
    return {
      move: "rebuild",
      from,
      to,
      what,
      path,
      note: "Scripts already travel. Helix writes a launcher for the other desk.",
      steps: [`Keep ${path}`, "Run the Helix launcher on the other machine."],
      ...wrap,
    };
  }
  if (what === "source") {
    const steps = recipe(path, to);
    const wrap = kit(path, from, to, "rebuild");
    return {
      move: "rebuild",
      from,
      to,
      what,
      path,
      note: `Source is here. I rebuild it for ${to}. No fake decompile.`,
      steps,
      ...wrap,
    };
  }
  if (what === "pe" || what === "elf") {
    const wrap = kit(path, from, to, "adapt");
    return {
      move: "adapt",
      from,
      to,
      what,
      path,
      note: `No source. I will not pretend to rewrite the binary. Helix writes an adapter that runs it on ${to}, even if that box has never heard of Hector.`,
      steps: [
        to === "linux" ? "On Linux: run helix-run.sh (uses Wine if the program is Windows)." : "On Windows: run helix-run.bat (uses WSL if the program is Linux).",
        "Copy the adapter with the program. Hector is not required on the other machine.",
      ],
      ...wrap,
    };
  }
  return {
    move: "no",
    from,
    to,
    what,
    path,
    note: "I need a program or its source.",
    steps: [],
    sh: "",
    bat: "",
  };
}

function recipe(path: string, to: Face) {
  const f = path.toLowerCase();
  if (f.includes("cargo.toml")) {
    return [to === "win" ? "cargo build --release --target x86_64-pc-windows-gnu" : "cargo build --release --target x86_64-unknown-linux-gnu"];
  }
  if (f.includes("cmakelists")) {
    return to === "win"
      ? ["cmake -B build-win -DCMAKE_TOOLCHAIN_FILE=mingw-w64.cmake", "cmake --build build-win"]
      : ["cmake -B build-linux", "cmake --build build-linux"];
  }
  if (f.endsWith(".sln") || f.endsWith(".vcxproj")) {
    return to === "linux"
      ? ["cmake -B build-linux if a CMake twin exists", "else Helix adapter until the tree can be rebuilt"]
      : ["msbuild /p:Configuration=Release"];
  }
  if (f.includes("package.json")) return ["npm ci", "npm run build"];
  if (f.includes("go.mod")) {
    return [to === "win" ? "GOOS=windows GOARCH=amd64 go build" : "GOOS=linux GOARCH=amd64 go build"];
  }
  return ["Read the tree. Rebuild for the other side. Adapter if a step is missing."];
}

export function wantsHelix(text: string) {
  return (
    /\bhelix\b/i.test(text) ||
    /\bconvert\b.*\b(linux|windows|mac)\b/i.test(text) ||
    /\b(windows to linux|linux to windows)\b/i.test(text) ||
    /\bmake it (run|work) on (linux|windows)\b/i.test(text) ||
    /\bport (this|it|the program)\b/i.test(text)
  );
}
