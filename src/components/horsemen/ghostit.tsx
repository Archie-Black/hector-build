import { useEffect, useState } from "react";
import { md } from "@/lib/ghostit/md";
import { hectorReply, load, save, type Sticky, type Who } from "@/lib/ghostit/store";

export function GhostIT() {
  const [notes, setNotes] = useState<Sticky[]>([]);
  const [who, setWho] = useState<Who | "all">("all");
  const [draft, setDraft] = useState("");
  const [hello, setHello] = useState(true);

  useEffect(() => {
    setNotes(load());
  }, []);
  useEffect(() => {
    if (notes.length) save(notes);
  }, [notes]);

  const shown = who === "all" ? notes : notes.filter((n) => n.who === who);

  function add() {
    const text = draft.trim();
    if (!text) return;
    const yours: Sticky = { id: `y-${Date.now()}`, who: "you", md: text, hue: 48 };
    const his = hectorReply(text);
    setNotes((xs) => [...xs, yours, his]);
    setDraft("");
  }

  return (
    <div className="flex h-full flex-col">
      {hello ? (
        <div className="flex flex-col items-center gap-3 border-b border-cobalt/25 p-4">
          <img src="/horsemen/hector-todo.jpg" alt="Hector covered in TO-DO notes" className="h-36 w-36 rounded-2xl object-cover" crossOrigin="anonymous" />
          <p className="text-sm text-ash">GhostIT Notes. You write. Hector keeps a copy. Markdown is fine.</p>
          <button type="button" className="h-10 rounded-lg bg-cobalt px-4 text-sm text-ash" onClick={() => setHello(false)}>
            Peel one off
          </button>
        </div>
      ) : null}
      <div className="flex gap-1 border-b border-cobalt/25 p-2">
        {(["all", "you", "hector"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setWho(k)}
            className={`h-9 rounded-lg px-3 text-xs ${who === k ? "bg-cobalt/40 text-ash" : "text-steel"}`}
          >
            {k === "all" ? "Both" : k === "you" ? "Yours" : "Hector"}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-3">
        <ul className="grid grid-cols-2 gap-3">
          {shown.map((n) => (
            <li key={n.id} className="sticky-note" style={{ background: n.who === "hector" ? "rgb(0 71 171 / 0.45)" : "rgb(230 255 42 / 0.18)" }}>
              <p className="mb-1 font-mono text-[10px] tracking-[0.16em] text-ice uppercase">{n.who === "you" ? "You" : "Hector"}</p>
              <div className="sticky-md text-sm text-ash" dangerouslySetInnerHTML={{ __html: md(n.md) }} />
            </li>
          ))}
        </ul>
      </div>
      <form
        className="flex gap-2 border-t border-cobalt/30 p-2"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Markdown. Hector pins a copy."
          className="h-16 min-w-0 flex-1 resize-none rounded-lg bg-ink px-3 py-2 text-sm text-ash outline-none"
          aria-label="New note"
        />
        <button type="submit" className="h-16 rounded-lg bg-cobalt px-3 text-sm text-ash">
          Pin
        </button>
      </form>
    </div>
  );
}
