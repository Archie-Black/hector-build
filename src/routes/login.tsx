import { createFileRoute } from "@tanstack/react-router";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { SpectreStage } from "@/components/forge/spectre-stage";
import { SmokeLayer } from "@/components/forge/smoke-layer";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  return (
    <div className="gate-scene relative flex h-dvh flex-col items-center overflow-hidden px-6 pb-8 pt-6">
      <div className="gate-scenery" aria-hidden />
      <div className="gate-bloom" aria-hidden />
      <div className="gate-mist" aria-hidden />
      <SmokeLayer busy={false} />
      <div className="pointer-events-none flex w-full shrink-0 justify-center pt-2">
        <SpectreStage busy={false} ghosts={3} size="page" />
      </div>
      <div className="gate-card relative z-10 mt-auto w-full max-w-md px-8 py-8 text-center glass-window">
        <h1 className="gate-word">Sign in</h1>
        <p className="mt-2 text-sm text-muted">Google or X. Then Hector.</p>
        <div className="mt-8 flex flex-col gap-2">
          {authEnabled ? (
            GROK_PROVIDERS.map((p) => (
              <button
                key={p.providerId}
                type="button"
                onClick={() => void signIn(p.providerId, { callbackURL: "/" })}
                className="gate-cta"
              >
                Continue with {p.label}
              </button>
            ))
          ) : (
            <p className="text-sm text-muted">Sign-in is disabled.</p>
          )}
        </div>
      </div>
    </div>
  );
}
