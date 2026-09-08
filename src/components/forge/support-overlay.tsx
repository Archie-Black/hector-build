import { Button } from "@/components/ui/button";
import { currentSupport, userGrant, wipeSupport } from "@/lib/support/session";
import { useForgeStore } from "@/lib/forge-store";
import { useEffect, useState } from "react";

export function SupportOverlay() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 1500);
    return () => window.clearInterval(id);
  }, []);
  const s = currentSupport();
  void tick;
  if (!s || (s.status !== "incoming" && s.status !== "live")) return null;
  return (
    <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
      <div className="w-full max-w-lg rounded-lg p-4 glass-window">
        {s.status === "incoming" ? (
          <>
            <p className="text-sm">DeltaKingZero is asking to connect for support.</p>
            <p className="mt-1 text-xs text-muted">You approve or deny. Nothing happens without you.</p>
            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                onClick={() => {
                  userGrant(true);
                  useForgeStore.getState().setStatus("Support live. You can end it any time.");
                }}
              >
                Approve
              </Button>
              <Button type="button" variant="line" onClick={() => userGrant(false)}>
                Deny
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm">Support is live. Session {s.id}</p>
            <button
              type="button"
              className="mt-2 text-sm text-accent"
              onClick={() => {
                wipeSupport();
                useForgeStore.getState().setStatus("Support ended. Traces wiped.");
              }}
            >
              End and wipe traces
            </button>
          </>
        )}
      </div>
    </div>
  );
}
