import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GrantCard } from "@/components/forge/grant-card";
import { useForgeStore } from "@/lib/forge-store";

type Props = {
  onSend: (text: string) => void;
  error: string | null;
};

export function AgentDock({ onSend, error }: Props) {
  const messages = useForgeStore((s) => s.messages);
  const plan = useForgeStore((s) => s.plan);
  const traces = useForgeStore((s) => s.traces);
  const busy = useForgeStore((s) => s.busy);
  const draft = useForgeStore((s) => s.draft);
  const phase = useForgeStore((s) => s.phase);
  const diffs = useForgeStore((s) => s.diffs);
  const connected = true;

  return (
    <aside className="flex h-full w-full min-w-0 flex-col glass-window md:w-80 md:shrink-0">
      <p className="px-3 pt-3 text-xs tracking-[0.14em] text-subtle uppercase">
        Agent · Plan / Approve / Apply
      </p>
      <div className="px-3 pt-2">
        <GrantCard />
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-3 py-2 text-sm">
        {messages.slice(-8).map((m) => (
          <article key={m.id} className="mb-3">
            <p className="text-xs text-subtle">{m.role === "user" ? "you" : m.role === "system" ? "host" : "hx"}</p>
            <p className="whitespace-pre-wrap text-pretty">{m.content}</p>
          </article>
        ))}
        {plan ? (
          <pre className="mb-3 whitespace-pre-wrap rounded-md p-2 font-mono text-xs glass-thin">{plan}</pre>
        ) : null}
        {traces.slice(-6).map((t, i) => (
          <p key={i} className={"font-mono text-xs " + (t.ok ? "text-muted" : "text-fail")}>
            {t.name} · {t.detail}
          </p>
        ))}
        {busy ? (
          <p className="mt-2 flex items-center gap-2 text-muted">
            <LoaderCircle className="size-4 animate-spin" />
            {phase}
          </p>
        ) : null}
        {error ? <p className="text-xs text-fail">{error}</p> : null}
      </div>
      {plan && phase === "awaiting" ? (
        <div className="flex gap-2 px-3 pb-2">
          <Button type="button" className="flex-1" onClick={() => onSend(`Execute the approved plan:\n${plan}`)}>
            Approve
          </Button>
          <button type="button" className="h-11 px-3 text-sm text-muted" onClick={() => useForgeStore.getState().setPlan("")}>
            Dismiss
          </button>
        </div>
      ) : null}
      {diffs.length ? (
        <button type="button" className="mx-3 mb-2 h-11 rounded-md text-sm glass-thin" onClick={() => useForgeStore.getState().undoApply()}>
          Undo checkpoint
        </button>
      ) : null}
      <form
        className="shrink-0 border-t border-line p-2"
        onSubmit={(e) => {
          e.preventDefault();
          onSend(draft);
        }}
      >
        <textarea
          value={draft}
          onChange={(e) => useForgeStore.getState().setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend(draft);
            }
          }}
          rows={2}
          placeholder="Job for Hector. Plan first."
          className="w-full resize-none bg-transparent text-sm outline-none"
        />
        <Button type="submit" className="mt-2 w-full" disabled={busy || !draft.trim()}>
          Plan
        </Button>
        {connected ? null : null}
      </form>
    </aside>
  );
}
