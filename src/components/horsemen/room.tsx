import { useMemo, useRef, useState } from "react";
import { face, load } from "@/lib/v01d/comfort";
import { greet, hear, showCmd } from "@/lib/v01d/guide";
import { hook } from "@/lib/v01d/hook";
import { askTeach, lesson, loadTeach, saveTeach, wantsTeach, type Teach } from "@/lib/v01d/teach";
import { LinuxClass } from "./linux-class";
import { Helix } from "./helix";
import { loadClass, type Progress } from "@/lib/v01d/linux-class";
import { room } from "@/lib/v01d/wsl";

type Note = { who: "you" | "hector"; text: string; what?: string; why?: string; cmd?: string };

export function LinuxRoom({ start = "talk" }: { start?: "talk" | "helix" }) {
  const p = useMemo(() => load(), []);
  const r = useMemo(() => room(p), [p]);
  const f = p ? face(p) : null;
  const fromWin = !p || p.home === "windows" || p.home === "new";
  const [pane, setPane] = useState<"talk" | "helix">(start);
  const [teach, setTeach] = useState<Teach | null>(() => loadTeach());
  const [log, setLog] = useState<Note[]>(() => [{ who: "hector", text: greet(fromWin, loadTeach()) }]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [school, setSchool] = useState<Progress>(() => loadClass());
  const box = useRef<HTMLDivElement>(null);

  function pick(v: Teach) {
    saveTeach(v);
    setTeach(v);
    setLog((xs) =>
      xs.concat({
        who: "hector",
        text: v === "yes" ? "I'll teach as I work." : "I'll just do the job. Say teach me later if you change your mind.",
      }),
    );
  }

  async function send() {
    const t = q.trim();
    if (!t || busy) return;
    setQ("");
    const choice = wantsTeach(t);
    if (choice) {
      pick(choice);
      return;
    }
    const job = lesson(hear(t), teach);
    setLog((xs) =>
      xs.concat(
        { who: "you", text: t },
        { who: "hector", text: job.say, what: job.what, why: job.why, cmd: showCmd(Boolean(f?.jargon), job.sh) },
      ),
    );
    if (job.verb === "ask") return;
    setBusy(true);
    const hit = await hook(job.inner);
    setLog((xs) => xs.concat({ who: "hector", text: hit.note + (hit.out ? `\n${hit.out.slice(0, 800)}` : "") }));
    setBusy(false);
    queueMicrotask(() => box.current?.scrollTo(0, box.current.scrollHeight));
  }

  return (
    <div className="room">
      <header className="room-bar">
        <b>{r.name.toUpperCase()}</b>
        <em>{r.distro} · on</em>
        <nav className="room-tabs">
          <button type="button" className={pane === "talk" ? "on" : ""} onClick={() => setPane("talk")}>
            Talk
          </button>
          <button type="button" className={pane === "helix" ? "on" : ""} onClick={() => setPane("helix")}>
            Helix
          </button>
        </nav>
      </header>
      {pane === "helix" ? (
        <Helix />
      ) : (
        <>
      <div className="room-log" ref={box}>
        {log.map((n, i) => (
          <article key={i} className={n.who}>
            <p>{n.text}</p>
            {n.what ? (
              <p className="room-teach">
                <span>What I'm doing.</span> {n.what}
              </p>
            ) : null}
            {n.why ? (
              <p className="room-teach">
                <span>Why.</span> {n.why}
              </p>
            ) : null}
            {n.cmd ? <pre>{n.cmd}</pre> : null}
          </article>
        ))}
        {teach === "yes" ? <LinuxClass busy={busy} teach progress={school} onProgress={setSchool} /> : null}
        {teach === null ? (
          <div className="room-choice">
            <p>{askTeach()}</p>
            <button type="button" onClick={() => pick("yes")}>
              Yes, teach me
            </button>
            <button type="button" onClick={() => pick("no")}>
              No, I don't want to know, just do the job
            </button>
          </div>
        ) : null}
      </div>
      <form
        className="room-send"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={busy ? "Working in Linux…" : "Tell Hector what you want. He'll do the Linux."}
          aria-label="Tell Hector"
        />
        <button type="submit" disabled={busy}>
          {busy ? "…" : "Send"}
        </button>
      </form>
        </>
      )}
    </div>
  );
}
