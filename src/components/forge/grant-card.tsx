import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useForgeStore } from "@/lib/forge-store";
import { importApprovedRepo } from "@/lib/workspace/fetch-repo";
import { isXaiKey } from "@/lib/workspace/keys";

export function GrantCard() {
  const granted = useForgeStore((s) => s.granted);
  const connected = useForgeStore((s) => s.ownerReady || isXaiKey(s.visitorKey));
  const repo = useForgeStore((s) => s.repo);
  const software = useForgeStore((s) => s.software);
  const [repoDraft, setRepoDraft] = useState("");
  const [pack, setPack] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busyRepo, setBusyRepo] = useState(false);

  if (granted) {
    return (
      <div className="rounded-md bg-surface px-4 py-3 text-sm text-muted">
        Project granted{repo ? ` · ${repo}` : " · local workspace"}. Spectral HX can assign tasks.
        {software.length ? ` Approved software: ${software.join(", ")}.` : ""}
      </div>
    );
  }

  async function approveRepo() {
    setError(null);
    setBusyRepo(true);
    try {
      const result = await importApprovedRepo({ data: { url: repoDraft } });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const store = useForgeStore.getState();
      store.applyAgentFiles(result.files);
      store.setRepo(result.repo);
      store.addLibrary({
        id: result.repo,
        name: result.repo,
        detail: "Approved repo",
        kind: "repo",
      });
      store.grant();
      store.pushVerbose(`Repo approved: ${result.repo}. Group permission is on.`);
      store.setStatus(`Working ${result.repo} under group permission.`);
    } catch {
      setError("I could not pull that repo.");
    } finally {
      setBusyRepo(false);
    }
  }

  return (
    <div className="rounded-lg bg-surface px-4 py-4 shadow-[var(--shadow-border)]">
      <p className="text-sm leading-relaxed text-pretty">
        Approve this project once. After that Spectral HX assigns work without asking at every
        step. New repos and new software still need a yes.
      </p>
      <Button
        className="mt-3 h-11 w-full"
        disabled={!connected}
        onClick={() => {
          useForgeStore.getState().grant();
          useForgeStore.getState().pushVerbose("Local lattice granted. I will work the whole job.");
        }}
      >
        <ShieldCheck className="size-4" />
        Grant this project
      </Button>
      <label className="mt-4 block text-[11px] tracking-[0.14em] text-subtle uppercase">
        Approved repo
      </label>
      <input
        value={repoDraft}
        onChange={(e) => setRepoDraft(e.target.value)}
        placeholder="github.com/owner/name"
        className="mt-2 h-11 w-full rounded-sm bg-inset px-3 text-sm text-fg outline-none placeholder:text-subtle"
      />
      <Button
        type="button"
        className="mt-2 h-11 w-full"
        disabled={!connected || busyRepo || !repoDraft.trim()}
        onClick={() => void approveRepo()}
      >
        Approve and open repo
      </Button>
      <label className="mt-4 block text-[11px] tracking-[0.14em] text-subtle uppercase">
        Approved software
      </label>
      <div className="mt-2 flex gap-2">
        <input
          value={pack}
          onChange={(e) => setPack(e.target.value)}
          placeholder="package name"
          className="h-11 min-w-0 flex-1 rounded-sm bg-inset px-3 text-sm text-fg outline-none placeholder:text-subtle"
        />
        <Button
          type="button"
          className="h-11"
          onClick={() => {
            useForgeStore.getState().approveSoftware(pack);
            useForgeStore.getState().pushVerbose(`Software approved: ${pack.trim() || "(empty)"}`);
            setPack("");
          }}
        >
          Approve
        </Button>
      </div>
      {error ? <p className="mt-2 text-xs text-fail">{error}</p> : null}
    </div>
  );
}
