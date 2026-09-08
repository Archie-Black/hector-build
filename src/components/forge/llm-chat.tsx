import { useEffect, useRef } from "react";
import { ArrowUp, ChevronLeft, LoaderCircle } from "lucide-react";
import { SettingsButton, SettingsHost } from "@/components/forge/settings-menu";
import { UserButton } from "@/lib/auth/gates";
import { SpectreStage } from "@/components/forge/spectre-stage";
import { useForgeStore } from "@/lib/forge-store";

const STARTERS = [
  "Help me think through a problem",
  "Write and explain a function",
  "Find a bug in my project",
  "Plan a feature end to end",
];

type Props = {
  onSend: (text: string) => void;
  error: string | null;
  onBack?: () => void;
};

export function LlmChat({ onSend, error, onBack }: Props) {
  const messages = useForgeStore((s) => s.messages);
  const busy = useForgeStore((s) => s.busy);
  const draft = useForgeStore((s) => s.draft);
  const box = useRef<HTMLTextAreaElement>(null);
  const end = useRef<HTMLDivElement>(null);

  const visible = messages.filter(
    (m) =>
      m.role !== "system" &&
      !m.content.startsWith("Briefing Spectral HX"),
  );

  useEffect(() => {
    box.current?.focus();
  }, []);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [visible, busy]);

  function grow() {
    const el = box.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  const empty = visible.length === 0 && !busy;

  return (
    <div className="flex h-dvh flex-col bg-bg text-fg">
      <header className="flex h-12 shrink-0 items-center px-2 glass-thin">
        {onBack ? (
          <button type="button" aria-label="Back" className="flex size-11 items-center justify-center rounded-md text-muted" onClick={onBack}>
            <ChevronLeft className="size-5" />
          </button>
        ) : (
          <span className="size-11" />
        )}
        <SpectreStage busy={busy} ghosts={busy ? 4 : 3} size="compact" />
        <p className="ml-1 flex-1 text-sm text-muted">Hector</p>
        <UserButton />
        <SettingsButton />
      </header>

      <div className="min-h-0 flex-1 overflow-auto">
        <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 py-4">
          {empty ? (
            <div className="flex flex-1 flex-col items-center justify-center pb-16">
              <SpectreStage busy={busy} ghosts={3} />
              <h1 className="mt-2 text-2xl font-medium tracking-tight text-balance">How can I help you today?</h1>
              <p className="mt-2 text-sm text-muted">Ask anything. I’ll take it from here.</p>
              <div className="mt-8 grid w-full gap-2 sm:grid-cols-2">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="h-12 rounded-lg px-4 text-left text-sm text-muted glass-thin"
                    onClick={() => onSend(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col justify-end">
              {visible.map((m) =>
                m.role === "user" ? (
                  <article key={m.id} className="mb-6 flex justify-end">
                    <p className="max-w-[85%] rounded-2xl bg-raised px-4 py-3 text-pretty leading-relaxed">
                      {m.content}
                    </p>
                  </article>
                ) : (
                  <article key={m.id} className="mb-6 flex gap-3">
                    <img src="/hector/hector-v2.png" alt="" className="mt-1 h-8 w-8 shrink-0 object-contain" />
                    <p className="min-w-0 flex-1 whitespace-pre-wrap text-pretty leading-relaxed">{m.content}</p>
                  </article>
                ),
              )}
              {busy ? (
                <div className="mb-6 flex items-center gap-3">
                  <SpectreStage busy ghosts={3} size="compact" />
                  <span className="flex gap-1" aria-label="thinking">
                    <span className="chat-dot size-1.5 rounded-full bg-muted" />
                    <span className="chat-dot size-1.5 rounded-full bg-muted" />
                    <span className="chat-dot size-1.5 rounded-full bg-muted" />
                  </span>
                </div>
              ) : null}
              {error ? <p className="mb-4 text-sm text-fail">{error}</p> : null}
              <div ref={end} />
            </div>
          )}
        </div>
      </div>

      <form
        className="mx-auto w-full max-w-3xl px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        onSubmit={(e) => {
          e.preventDefault();
          onSend(draft);
        }}
      >
        <div className="flex items-end gap-2 rounded-lg px-3 py-2 glass-window">
          <textarea
            ref={box}
            value={draft}
            rows={1}
            placeholder="Message Hector"
            className="max-h-40 min-h-11 flex-1 resize-none bg-transparent py-2.5 text-base leading-relaxed outline-none"
            onChange={(e) => {
              useForgeStore.getState().setDraft(e.target.value);
              grow();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend(draft);
              }
            }}
          />
          <button
            type="submit"
            disabled={busy || !draft.trim()}
            aria-label="Send"
            className="mb-1 flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-fg disabled:opacity-30"
          >
            {busy ? <LoaderCircle className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-subtle">Hector can make mistakes. Check important work.</p>
      </form>
      <SettingsHost />
    </div>
  );
}
