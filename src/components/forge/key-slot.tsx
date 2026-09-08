import { useState } from "react";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useForgeStore } from "@/lib/forge-store";
import { isXaiKey, maskKey, XAI_KEYS_URL, XAI_LOGIN_URL } from "@/lib/workspace/keys";

export function KeySlot() {
  const visitorKey = useForgeStore((s) => s.visitorKey);
  const ownerReady = useForgeStore((s) => s.ownerReady);
  const saved = isXaiKey(visitorKey);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(!saved);
  const [error, setError] = useState<string | null>(null);

  function save() {
    if (!isXaiKey(draft)) {
      setError("Paste a full xAI key. I will send you to the login page if you need one.");
      return;
    }
    useForgeStore.getState().setVisitorKey(draft.trim());
    setDraft("");
    setError(null);
    setEditing(false);
    useForgeStore.getState().setStatus("Key saved. Full Hector is open.");
  }

  if (saved && !editing) {
    return (
      <div className="rounded-lg bg-surface px-4 py-3 shadow-[var(--shadow-border)]">
        <p className="text-sm text-pretty">
          Key saved · <span className="tabular-nums text-muted">{maskKey(visitorKey)}</span>
        </p>
        <button
          type="button"
          className="mt-1 h-11 text-xs text-muted hover:text-fg"
          onClick={() => setEditing(true)}
        >
          Change key
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-surface px-4 py-4 shadow-[var(--shadow-border)]">
      <p className="text-sm leading-relaxed text-pretty">
        Paste your xAI key to open full Hector. It stays on this device.
        {ownerReady ? " A lattice key is already ready if you want to skip this." : ""}
      </p>
      <a
        href={XAI_LOGIN_URL}
        target="_blank"
        rel="noreferrer"
        className="mt-3 flex h-11 items-center justify-center rounded-md bg-accent text-sm font-medium text-accent-fg"
      >
        <KeyRound className="mr-2 size-4" />
        Open xAI login
      </a>
      <a
        href={XAI_KEYS_URL}
        target="_blank"
        rel="noreferrer"
        className="mt-2 block text-center text-xs text-muted hover:text-fg"
      >
        Then open API keys
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
  );
}
