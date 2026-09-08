import { useMemo, useState } from "react";
import { useForgeStore } from "@/lib/forge-store";
import { runSsh } from "@/lib/workspace/ssh";
import { ANDROID_STUDIO, UE_DOWNLOAD, VS_DOWNLOAD } from "@/lib/workspace/platform";

const GODOT = "https://godotengine.org/download";
const TUX_PAINT = "https://www.tuxpaint.org/download/";
const TUX_RACER = "https://extremetuxracer.com/";
const PUTTY = "https://www.chiark.greenend.org.uk/~sgtatham/putty/latest.html";

type Tab = "term" | "share" | "ssh" | "desk";

function smbScript(id: string) {
  return `# Hector Share — optional host Samba for this workspace snapshot ${id}
# Run only on a machine you own, after you review it.
# [hector]
#    path = /home/YOU/hector-share
#    browseable = yes
#    read only = no
#    guest ok = no
`;
}

export function Studio() {
  const files = useForgeStore((s) => s.files);
  const granted = useForgeStore((s) => s.granted);
  const [tab, setTab] = useState<Tab>("term");
  const [lines, setLines] = useState<string[]>(["spectral-hx terminal. Type help."]);
  const [cmd, setCmd] = useState("");
  const [shareId, setShareId] = useState("");
  const [sshHost, setSshHost] = useState("");
  const [sshUser, setSshUser] = useState("");
  const [sshPass, setSshPass] = useState("");
  const [sshCmd, setSshCmd] = useState("uname -a");
  const [sshOut, setSshOut] = useState("");

  const shareUrl = useMemo(() => {
    if (!shareId || typeof window === "undefined") return "";
    return `${window.location.origin}/api/share?id=${shareId}`;
  }, [shareId]);

  function print(text: string) {
    setLines((prev) => [...prev.slice(-80), text]);
  }

  async function runLocal(raw: string) {
    const input = raw.trim();
    print(`❯ ${input}`);
    if (!input) return;
    if (input === "help") {
      print("ls  cat <path>  grep <q>  share  play  clear");
      return;
    }
    if (input === "clear") {
      setLines([]);
      return;
    }
    if (input === "play") {
      useForgeStore.getState().setSurface("maze");
      return;
    }
    if (input === "ls") {
      print(Object.keys(files).join("\n"));
      return;
    }
    if (input.startsWith("cat ")) {
      const path = input.slice(4).trim();
      print(files[path] ?? `missing ${path}`);
      return;
    }
    if (input.startsWith("grep ")) {
      const q = input.slice(5).trim().toLowerCase();
      const hits = Object.entries(files)
        .filter(([, c]) => c.toLowerCase().includes(q))
        .map(([p]) => p);
      print(hits.join("\n") || "none");
      return;
    }
    if (input === "share") {
      await startShare();
      return;
    }
    print("Unknown command. help");
  }

  async function startShare() {
    if (!granted) {
      print("Grant the project first.");
      return;
    }
    const id = Math.random().toString(36).slice(2, 10);
    await fetch("/api/share", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, files }),
    });
    setShareId(id);
    print(`Share live: /api/share?id=${id}`);
  }

  async function ssh() {
    if (!granted) {
      setSshOut("Grant the project first.");
      return;
    }
    const result = await runSsh({
      data: {
        host: sshHost,
        username: sshUser,
        password: sshPass,
        command: sshCmd,
      },
    });
    setSshOut(result.output);
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-bg/70 px-4">
      <div className="flex h-[min(36rem,88dvh)] w-full max-w-3xl flex-col rounded-lg glass-window">
        <div className="flex items-center gap-1 border-b border-line px-2 py-2">
          {(["term", "share", "ssh", "desk"] as const).map((t) => (
            <button
              key={t}
              type="button"
              className={"h-11 rounded-md px-3 text-sm " + (tab === t ? "bg-accent text-accent-fg" : "")}
              onClick={() => setTab(t)}
            >
              {t === "term" ? "Terminal" : t === "share" ? "Share" : t === "ssh" ? "SSH" : "Desk"}
            </button>
          ))}
          <button
            type="button"
            className="ml-auto h-11 px-3 text-sm text-muted"
            onClick={() => useForgeStore.getState().setSurface("work")}
          >
            Close
          </button>
        </div>

        {tab === "term" ? (
          <div className="flex min-h-0 flex-1 flex-col p-3 font-mono text-sm">
            <div className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap text-muted">
              {lines.join("\n")}
            </div>
            <form
              className="mt-2 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void runLocal(cmd);
                setCmd("");
              }}
            >
              <span className="text-accent">❯</span>
              <input
                value={cmd}
                onChange={(e) => setCmd(e.target.value)}
                className="h-11 flex-1 bg-transparent outline-none"
                autoComplete="off"
              />
            </form>
          </div>
        ) : null}

        {tab === "share" ? (
          <div className="space-y-3 overflow-auto p-4 text-sm">
            <p className="text-muted text-pretty">
              Hector Share serves the granted workspace over HTTPS. Samba on a home PC is
              optional and only after you review the script.
            </p>
            <button type="button" className="h-11 rounded-md bg-accent px-4 text-accent-fg" onClick={() => void startShare()}>
              Start share
            </button>
            {shareUrl ? <p className="break-all font-mono text-xs">{shareUrl}</p> : null}
            <a
              className="block h-11 content-center text-sm"
              href={`data:text/plain,${encodeURIComponent(smbScript(shareId || "local"))}`}
              download="hector-samba.conf"
            >
              Download Samba config
            </a>
          </div>
        ) : null}

        {tab === "ssh" ? (
          <div className="space-y-2 overflow-auto p-4 text-sm">
            <p className="text-muted text-pretty">
              SSH from this app to a host you approve. PuTTY is the Windows desktop client.
            </p>
            <input className="h-11 w-full rounded-md bg-inset px-3" placeholder="host" value={sshHost} onChange={(e) => setSshHost(e.target.value)} />
            <input className="h-11 w-full rounded-md bg-inset px-3" placeholder="user" value={sshUser} onChange={(e) => setSshUser(e.target.value)} />
            <input className="h-11 w-full rounded-md bg-inset px-3" type="password" placeholder="password" value={sshPass} onChange={(e) => setSshPass(e.target.value)} />
            <input className="h-11 w-full rounded-md bg-inset px-3" placeholder="command" value={sshCmd} onChange={(e) => setSshCmd(e.target.value)} />
            <button type="button" className="h-11 rounded-md bg-accent px-4 text-accent-fg" onClick={() => void ssh()}>
              Run
            </button>
            <a href={PUTTY} target="_blank" rel="noreferrer" className="block h-11 content-center">
              PuTTY for Windows
            </a>
            {sshOut ? <pre className="whitespace-pre-wrap font-mono text-xs text-muted">{sshOut}</pre> : null}
          </div>
        ) : null}

        {tab === "desk" ? (
          <div className="grid min-h-0 flex-1 grid-cols-2 gap-2 overflow-auto p-3 text-sm">
            <div className="rounded-md p-3 glass-thin">
              <p className="text-xs text-subtle">Workspace</p>
              <ul className="mt-2 space-y-1 text-muted">
                {Object.keys(files).slice(0, 12).map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-md p-3 glass-thin">
              <p className="text-xs text-subtle">Video Game Forge</p>
              <div className="mt-2 flex flex-col gap-2">
                <button type="button" className="h-11 rounded-md bg-accent text-accent-fg" onClick={() => useForgeStore.getState().setSurface("maze")}>
                  Spectre Maze
                </button>
                <a href={GODOT} target="_blank" rel="noreferrer" className="h-11 content-center">
                  Godot
                </a>
                <a href={UE_DOWNLOAD} target="_blank" rel="noreferrer" className="h-11 content-center">
                  Unreal 5.8
                </a>
                <a href={TUX_PAINT} target="_blank" rel="noreferrer" className="h-11 content-center">
                  Tux Paint
                </a>
                <a href={TUX_RACER} target="_blank" rel="noreferrer" className="h-11 content-center">
                  Tux Racer
                </a>
                <a href={VS_DOWNLOAD} target="_blank" rel="noreferrer" className="h-11 content-center">
                  Visual Studio
                </a>
                <a href={ANDROID_STUDIO} target="_blank" rel="noreferrer" className="h-11 content-center">
                  Android Studio
                </a>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
