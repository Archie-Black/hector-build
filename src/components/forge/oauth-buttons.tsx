import type { ReactNode } from "react";
import { GROK_PROVIDERS, signIn } from "@/lib/auth/client";

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function XMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="currentColor" d="M18.9 1.5h3.3l-7.2 8.2L24 22.5h-6.6l-5.2-6.8-5.9 6.8H2.9l7.7-8.8L0 1.5h6.8l4.7 6.2 7.4-6.2zm-1.2 18.9h1.8L6.4 3.4H4.4l13.3 17z" />
    </svg>
  );
}

const MARK: Record<string, () => ReactNode> = {
  "grok-google": GoogleMark,
  "grok-x": XMark,
};

type Props = {
  verb?: "Continue" | "Sign up";
};

export function OAuthButtons({ verb = "Continue" }: Props) {
  return (
    <div className="flex flex-col gap-2">
      {GROK_PROVIDERS.map((p) => {
        const Mark = MARK[p.providerId];
        return (
          <button
            key={p.providerId}
            type="button"
            className="gate-cta inline-flex items-center justify-center gap-2"
            onClick={() => void signIn(p.providerId, { callbackURL: "/" })}
          >
            {Mark ? <Mark /> : null}
            {verb} with {p.label}
          </button>
        );
      })}
    </div>
  );
}
