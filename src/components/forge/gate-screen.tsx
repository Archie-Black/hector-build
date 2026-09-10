import { useEffect, useState } from "react";
import { SpectreStage } from "@/components/forge/spectre-stage";
import { SmokeLayer } from "@/components/forge/smoke-layer";
import { SpatialField, SpatialFx } from "@/components/forge/spatial-field";
import { XrPortal } from "@/components/forge/xr-portal";
import { OAuthButtons } from "@/components/forge/oauth-buttons";
import { useForgeStore } from "@/lib/forge-store";
import {
  confirmCode,
  createAccount,
  issueVerify,
  loadSession,
  markSetupDone,
  sessionIsVerified,
  signIn,
} from "@/lib/auth/local-account";
import { sendVerifyMail } from "@/lib/auth/mailer";
import { scanEnvironment, scanLines, type EnvScan } from "@/lib/hw/env-scan";
import { lockPlatform } from "@/lib/workspace/platform";
import { createVault, vaultExists } from "@/lib/security/vault";
import { CREDIT } from "@/lib/legal/copy";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import QRCode from "qrcode";

type Step = "login" | "signup" | "verify" | "scan" | "vault" | "ready";

async function mail(email: string, code: string, token: string) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return sendVerifyMail({ data: { email, code, token, origin } });
}

export function GateScreen() {
  const [step, setStep] = useState<Step>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [code, setCode] = useState("");
  const [vaultPw, setVaultPw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [scan, setScan] = useState<EnvScan | null>(null);
  const [otpSvg, setOtpSvg] = useState("");
  const [recSvg, setRecSvg] = useState("");
  const [codes, setCodes] = useState<string[]>([]);
  const { user } = useCurrentUserState();

  useEffect(() => {
    if (user && !user.isDevFallback) {
      if (user.primaryEmail) setEmail(user.primaryEmail);
      setStep(vaultExists() ? "ready" : "scan");
      return;
    }
    if (sessionIsVerified()) {
      const s = loadSession();
      if (s?.email) setEmail(s.email);
      setStep(vaultExists() ? "ready" : "scan");
    }
  }, [user]);

  useEffect(() => {
    if (step !== "scan") return;
    void scanEnvironment().then((env) => {
      setScan(env);
      lockPlatform(env.platform);
    });
  }, [step]);

  return (
    <SpatialField className="gate-scene relative flex h-dvh flex-col items-center overflow-hidden px-4 pb-8 pt-6">
      <div className="gate-scenery" aria-hidden />
      <div className="gate-bloom" aria-hidden />
      <div className="gate-mist" aria-hidden />
      <SpatialFx />
      <XrPortal />
      <SmokeLayer busy={false} />
      <div className="spatial-stage pointer-events-none flex w-full shrink-0 justify-center pt-2">
        <SpectreStage busy={false} ghosts={3} size="page" />
      </div>
      <div id="hector-xr-overlay" className="gate-card spatial-glass relative z-10 mt-auto w-full max-w-md px-8 py-8 text-center glass-window">
        <span className="spatial-sheen" aria-hidden />
        <h1 className="gate-word text-balance">DooMChaT</h1>
        <p className="mt-1 text-sm text-muted">Hector Build · Spectral HX</p>
        <p className="mt-1 text-xs tracking-[0.16em] text-subtle uppercase">{CREDIT}</p>

        {step === "login" ? (
          <div className="mt-8 flex flex-col gap-2 text-left">
            <OAuthButtons verb="Continue" />
            <p className="py-1 text-center text-xs tracking-[0.16em] text-subtle uppercase">or email</p>
            <form
              className="flex flex-col gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                setError(null);
                void signIn(email, password)
                  .then(() => setStep(vaultExists() ? "ready" : "scan"))
                  .catch((err: Error & { needVerify?: boolean }) => {
                    setError(err.message);
                    if (err.needVerify) setStep("verify");
                  });
              }}
            >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="gate-input"
              autoComplete="email"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="gate-input"
              autoComplete="current-password"
            />
            <button type="submit" className="gate-cta mt-1">
              Log in
            </button>
            <button
              type="button"
              className="h-12 rounded-xl text-sm glass-thin"
              onClick={() => {
                setError(null);
                setStep("signup");
              }}
            >
              Create account
            </button>
            <p className="text-center text-xs text-subtle">Google, X, or a verified email.</p>
            </form>
          </div>
        ) : null}

        {step === "signup" ? (
          <div className="mt-8 flex flex-col gap-2 text-left">
            <OAuthButtons verb="Sign up" />
            <p className="py-1 text-center text-xs tracking-[0.16em] text-subtle uppercase">or email</p>
            <form
              className="flex flex-col gap-2"
              onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              void createAccount(email, password, confirm)
                .then(async (v) => {
                  const sent = await mail(v.email, v.code, v.token);
                  setHint(
                    sent.sent
                      ? `Check ${v.email} for the code.`
                      : `Mail server is not on this box. Use code ${v.code} (it was also written to the outbox).`,
                  );
                  setStep("verify");
                })
                .catch((err: Error) => setError(err.message));
            }}
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="gate-input"
              autoComplete="email"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="gate-input"
              autoComplete="new-password"
            />
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm password"
              className="gate-input"
              autoComplete="new-password"
            />
            <button type="submit" className="gate-cta mt-2">
              Create account
            </button>
            <button type="button" className="h-11 text-sm text-muted" onClick={() => setStep("login")}>
              Back to login
            </button>
          </form>
          </div>
        ) : null}

        {step === "verify" ? (
          <form
            className="mt-8 flex flex-col gap-2 text-left"
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              void confirmCode(email, code)
                .then(() => setStep("scan"))
                .catch((err: Error) => setError(err.message));
            }}
          >
            <p className="text-sm text-muted text-pretty">Verify {email} before you can log in.</p>
            {hint ? <p className="text-xs text-subtle text-pretty">{hint}</p> : null}
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="6-digit code"
              inputMode="numeric"
              className="gate-input tracking-[0.3em]"
            />
            <button type="submit" className="gate-cta">
              Verify email
            </button>
            <button
              type="button"
              className="h-11 text-sm text-muted"
              onClick={() => {
                void issueVerify(email).then(async (v) => {
                  const sent = await mail(v.email, v.code, v.token);
                  setHint(sent.sent ? `Sent again to ${v.email}.` : `New code ${v.code} (mail not sent).`);
                });
              }}
            >
              Resend code
            </button>
            <button type="button" className="h-11 text-sm text-muted" onClick={() => setStep("login")}>
              Back to login
            </button>
          </form>
        ) : null}

        {step === "scan" ? (
          <div className="mt-8 text-left">
            <p className="text-xs tracking-[0.14em] text-subtle uppercase">Environment</p>
            <p className="mt-2 text-sm text-muted text-pretty">Hector is mapping this machine.</p>
            {scan ? (
              <ul className="mt-3 space-y-1 font-mono text-xs text-muted">
                {scanLines(scan).map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted">Scanning…</p>
            )}
            <button
              type="button"
              className="gate-cta mt-6 w-full"
              disabled={!scan}
              onClick={() => setStep(vaultExists() ? "ready" : "vault")}
            >
              Next
            </button>
          </div>
        ) : null}

        {step === "vault" ? (
          <form
            className="mt-8 flex flex-col gap-2 text-left"
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              void createVault(vaultPw)
                .then(async (v) => {
                  setCodes(v.recovery);
                  setOtpSvg(await QRCode.toString(v.otpauth, { type: "svg", margin: 1, color: { dark: "#6ea8ff", light: "#00000000" } }));
                  setRecSvg(await QRCode.toString(v.recoveryPayload, { type: "svg", margin: 1, color: { dark: "#6ea8ff", light: "#00000000" } }));
                  const s = loadSession();
                  if (s) markSetupDone(s.email);
                  setStep("ready");
                })
                .catch((err: Error) => setError(err.message));
            }}
          >
            <p className="text-xs tracking-[0.14em] text-subtle uppercase">Vault + 2FA</p>
            <p className="text-sm text-muted text-pretty">One password. Scan the authenticator. Keep the phone QR.</p>
            <input
              type="password"
              value={vaultPw}
              onChange={(e) => setVaultPw(e.target.value)}
              placeholder="Vault password"
              className="gate-input"
            />
            <button type="submit" className="gate-cta">
              Create vault
            </button>
          </form>
        ) : null}

        {step === "ready" ? (
          <div className="mt-8">
            {otpSvg ? (
              <div className="mb-4 grid grid-cols-2 gap-2">
                <div dangerouslySetInnerHTML={{ __html: otpSvg }} />
                <div dangerouslySetInnerHTML={{ __html: recSvg }} />
              </div>
            ) : null}
            {codes.length ? <p className="mb-3 font-mono text-[10px] text-subtle">{codes.join("  ")}</p> : null}
            <button
              type="button"
              className="gate-cta w-full"
              onClick={() => useForgeStore.getState().setSurface("work")}
            >
              Enter
            </button>
          </div>
        ) : null}

        {error ? <p className="mt-3 text-sm text-fail">{error}</p> : null}
      </div>
    </SpatialField>
  );
}
