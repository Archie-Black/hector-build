import { useEffect, useRef } from "react";
import { SpectreStage } from "@/components/forge/spectre-stage";
import { BackButton } from "@/components/forge/back-button";
import { useForgeStore } from "@/lib/forge-store";

type Props = {
  onSend: (text: string) => void;
  error: string | null;
  placeholder?: string;
  speaker?: string;
  onBack?: () => void;
  busyLabel?: string;
  compact?: boolean;
};

export function HxMessages({
  onSend,
  error,
  placeholder = "What should I build?",
  speaker = "hector",
  onBack,
  busyLabel = "building",
  compact = false,
}: Props) {
  const messages = useForgeStore((s) => s.messages);
  const busy = useForgeStore((s) => s.busy);
  const draft = useForgeStore((s) => s.draft);
  const tasks = useForgeStore((s) => s.tasks);
  const box = useRef<HTMLTextAreaElement>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    box.current?.focus();
  }, []);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [messages, busy]);

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col">
      {onBack ? (
        <div className="shrink-0 px-2 pt-1">
          <BackButton onClick={onBack} />
        </div>
      ) : null}
      <div className="min-h-0 flex-1 overflow-auto px-4 py-4">
        <div className={"mx-auto w-full " + (compact ? "max-w-none" : "max-w-2xl")}>
          {messages.map((m) => (
            <article key={m.id} className="mb-6">
              <p className="text-xs text-subtle">
                {m.role === "user" ? "you" : m.speaker === "hx" ? "spectral hx" : m.speaker === "hector" ? "hector" : speaker}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-pretty">{m.content}</p>
            </article>
          ))}
          {busy ? (
            <div className="mb-4 flex items-center gap-3">
              <SpectreStage busy ghosts={3} size="compact" />
              <p className="text-sm text-muted">
                {busyLabel}
                {tasks.length ? ` · Spectral HX ×${tasks.reduce((n, t) => n + (t.crew || 1), 0)}` : ""}
              </p>
            </div>
          ) : null}
          {error ? <p className="text-sm text-fail">{error}</p> : null}
          <div ref={end} />
        </div>
      </div>
      <form
        className="shrink-0 border-t border-line px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]"
        onSubmit={(e) => {
          e.preventDefault();
          onSend(draft);
        }}
      >
        <textarea
          ref={box}
          value={draft}
          onChange={(e) => useForgeStore.getState().setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend(draft);
            }
          }}
          rows={3}
          placeholder={placeholder}
          className="mx-auto block min-h-16 w-full resize-none bg-transparent text-sm leading-relaxed outline-none"
        />
      </form>
    </section>
  );
}
