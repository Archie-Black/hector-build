import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/forge/back-button";
import { SpectreStage } from "@/components/forge/spectre-stage";
import { loadSession } from "@/lib/auth/local-account";
import {
  addNote,
  currentSupport,
  isOperator,
  operatorKnock,
  wipeSupport,
} from "@/lib/support/session";
import { DISCLAIMER, SUPPORT_EMAIL } from "@/lib/legal/copy";
import { scanLines } from "@/lib/hw/env-scan";
import { useNavigate } from "@tanstack/react-router";

export function AdminPanel() {
  const navigate = useNavigate();
  const session = loadSession();
  const allowed = isOperator(session?.email ?? "");
  const [note, setNote] = useState("");
  const [s, setS] = useState(currentSupport());

  function refresh() {
    setS(currentSupport());
  }

  if (!allowed) {
    return (
      <div className="flex h-dvh items-center justify-center px-6">
        <div className="w-full max-w-md rounded-lg p-8 text-center glass-window">
          <p className="text-sm">Operator only.</p>
          <p className="mt-2 text-xs text-muted">Sign in as {SUPPORT_EMAIL}</p>
          <BackButton onClick={() => void navigate({ to: "/" })} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 py-4">
      <BackButton onClick={() => void navigate({ to: "/" })} />
      <div className="mt-4 rounded-lg p-6 glass-window">
        <SpectreStage size="compact" busy={s?.status === "live"} ghosts={2} />
        <h1 className="mt-3 text-2xl font-medium">Support desk</h1>
        <p className="mt-1 text-sm text-muted">Connect only after the user grants. Wipe when done.</p>
        {!s ? (
          <p className="mt-4 text-sm text-muted">No open request on this device.</p>
        ) : (
          <>
            <p className="mt-4 font-mono text-xs">
              {s.id} · {s.status} · {s.ip} · {s.email}
            </p>
            {s.scan ? (
              <ul className="mt-2 space-y-1 font-mono text-xs text-muted">
                {scanLines(s.scan).map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            ) : null}
            <div className="mt-3 max-h-32 overflow-auto font-mono text-xs text-subtle">
              {s.notes.map((n, i) => (
                <p key={i}>{n}</p>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => {
                  operatorKnock();
                  refresh();
                }}
              >
                Request connect
              </Button>
              <Button
                type="button"
                variant="line"
                onClick={() => {
                  wipeSupport();
                  refresh();
                }}
              >
                Wipe traces
              </Button>
            </div>
            {s.status === "live" ? (
              <form
                className="mt-3 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  addNote(note);
                  setNote("");
                  refresh();
                }}
              >
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Note to the session"
                  className="h-11 flex-1 rounded-md bg-inset px-3 text-sm"
                />
                <Button type="submit">Send</Button>
              </form>
            ) : null}
          </>
        )}
        <p className="mt-6 text-xs text-subtle text-pretty">{DISCLAIMER}</p>
      </div>
    </div>
  );
}
