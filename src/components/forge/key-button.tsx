import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useForgeStore } from "@/lib/forge-store";
import { isXaiKey, maskKey, XAI_KEYS_URL, XAI_LOGIN_URL } from "@/lib/workspace/keys";

export function KeyButton() {
  const visitorKey = useForgeStore((s) => s.visitorKey);
  const ownerReady = useForgeStore((s) => s.ownerReady);
  const saved = isXaiKey(visitorKey);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  function save() {
    if (!isXaiKey(draft)) {
      setError("Paste a full xAI key.");
      return;
    }
    useForgeStore.getState().setVisitorKey(draft.trim());
    useForgeStore.getState().pushVerbose("xAI key saved on this device. Full lattice unlocked.");
    setDraft("");
    setError(null);
    setOpen(false);
    useForgeStore.getState().setStatus("Grok is connected as Hector’s assistant.");
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 items-center gap-1 rounded-md bg-surface px-3 text-xs font-medium text-fg shadow-[var(--shadow-border)]"
      >
        <Plus className="size-3.5" />
        + API key
      </button>
      {open ? (
        <div className="absolute top-12 right-0 w-72 rounded-lg bg-surface p-4 shadow-[var(--shadow-border)]">
          <p className="text-sm leading-relaxed text-pretty">
            Connect Grok as Hector’s assistant. The key stays on this device.
            {saved ? ` Saved ${maskKey(visitorKey)}.` : ownerReady ? " A lattice key is already ready." : ""}
          </p>
          <a
            href={XAI_LOGIN_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-3 block text-xs text-muted hover:text-fg"
          >
            Open xAI login
          </a>
          <a
            href={XAI_KEYS_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-1 block text-xs text-muted hover:text-fg"
          >
            API keys
          </a>
          <input
            type="password"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Paste xAI key"
            autoComplete="off"
            className="mt-3 h-11 w-full rounded-sm bg-inset px-3 text-sm text-fg outline-none placeholder:text-subtle"
          />
          <Button type="button" className="mt-2 h-11 w-full" onClick={save}>
            Save key
          </Button>
          {error ? <p className="mt-2 text-xs text-fail">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
