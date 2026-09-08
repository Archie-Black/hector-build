import { createFileRoute } from "@tanstack/react-router";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { SpectreStage } from "@/components/forge/spectre-stage";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  return (
    <div className="relative flex h-dvh items-center justify-center px-6">
      <div className="w-full max-w-md rounded-lg px-8 py-10 text-center glass-window">
        <SpectreStage busy={false} ghosts={3} />
        <h1 className="mt-4 text-3xl font-medium tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-muted">Google or X. Then Hector.</p>
        <div className="mt-8 flex flex-col gap-2">
          {authEnabled ? (
            GROK_PROVIDERS.map((p) => (
              <button
                key={p.providerId}
                type="button"
                onClick={() => void signIn(p.providerId, { callbackURL: "/" })}
                className="h-12 w-full rounded-md bg-accent text-sm font-medium text-accent-fg"
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
