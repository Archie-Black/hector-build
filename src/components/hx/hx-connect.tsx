import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/forge/back-button";
import { SpectreStage } from "@/components/forge/spectre-stage";
import { useForgeStore } from "@/lib/forge-store";
import { isApiKey } from "@/lib/workspace/keys";
import { CHAT_PROVIDERS, type ChatProviderId } from "@/lib/workspace/providers";
import { loadSession, sessionIsVerified, signIn } from "@/lib/auth/local-account";
import { scanEnvironment, scanLines, type EnvScan } from "@/lib/hw/env-scan";
import { lockPlatform } from "@/lib/workspace/platform";

type Props = {
  onReady: () => void;
};

export function HxConnect({ onReady }: Props) {
  const navigate = useNavigate();
  const saved = useForgeStore((s) => s.providerId);
  const [id, setId] = useState<ChatProviderId>(saved);
  const preset = CHAT_PROVIDERS.find((p) => p.id === id) ?? CHAT_PROVIDERS[0];
  const [baseUrl, setBaseUrl] = useState(useForgeStore.getState().baseUrl || preset.baseUrl);
  const [model, setModel] = useState(useForgeStore.getState().model || preset.model);
  const [key, setKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState(loadSession()?.email ?? "");
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(sessionIsVerified());
  const [scan, setScan] = useState<EnvScan | null>(null);
  const ownerReady = useForgeStore((s) => s.ownerReady);
  const haveKey = isApiKey(useForgeStore((s) => s.visitorKey));

  useEffect(() => {
    void scanEnvironment().then((env) => {
      setScan(env);
      lockPlatform(env.platform);
    });
  }, []);

  function pick(next: ChatProviderId) {
    const p = CHAT_PROVIDERS.find((x) => x.id === next)!;
    setId(next);
    setBaseUrl(p.baseUrl);
    setModel(p.model);
  }

  function connect() {
    useForgeStore.getState().setChatProvider({
      id,
      baseUrl,
      model,
      key: key || useForgeStore.getState().visitorKey,
    });
    onReady();
  }

  return (
    <div className="flex h-dvh flex-col bg-bg text-fg">
      <div className="px-2 pt-1">
        <BackButton onClick={() => void navigate({ to: "/" })} />
      </div>
      <div className="flex flex-1 items-center justify-center px-6">
      <div className="w-full max-w-lg rounded-lg px-6 py-8 glass-window">
        <SpectreStage busy={false} ghosts={3} />
        <h1 className="mt-5 text-center text-3xl font-medium tracking-tight">Spectral HX</h1>
        <p className="mt-2 text-center text-sm text-muted text-pretty">
          Coding floor. Hector API is built in. Other chatbots optional.
        </p>
        {scan ? (
          <p className="mt-3 text-center font-mono text-[10px] text-subtle">{scanLines(scan).slice(0, 3).join(" · ")}</p>
        ) : (
          <p className="mt-3 text-center text-xs text-subtle">Scanning hardware…</p>
        )}
        {!authed ? (
          <form
            className="mt-5 flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void signIn(email, password)
                .then(() => setAuthed(true))
                .catch((err: Error) => setError(err.message));
            }}
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Any email"
              className="h-11 rounded-md bg-inset px-3 text-sm"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="h-11 rounded-md bg-inset px-3 text-sm"
            />
            <Button type="submit" className="h-12 w-full">
              Log in
            </Button>
            <p className="text-center text-xs text-subtle">Create an account on Hector first. Email must be verified.</p>
          </form>
        ) : null}
        {authed ? (
        <>
        <p className="mt-5 text-xs tracking-[0.14em] text-subtle uppercase">Chatbot</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {CHAT_PROVIDERS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={
                "h-11 rounded-md px-3 text-sm " + (id === p.id ? "bg-accent text-accent-fg" : "glass-thin")
              }
              onClick={() => pick(p.id)}
            >
              {p.name}
            </button>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted text-pretty">{preset.hint}</p>
        {preset.keysUrl ? (
          <a href={preset.keysUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-accent">
            Open key page
          </a>
        ) : null}
        {id === "custom" ? (
          <input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://host/v1"
            className="mt-3 h-11 w-full rounded-md bg-inset px-3 text-sm outline-none"
          />
        ) : null}
        <input
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="model id"
          className="mt-3 h-11 w-full rounded-md bg-inset px-3 text-sm outline-none"
        />
        {id !== "hector" ? (
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder={haveKey || ownerReady ? "Key already on this device" : "Paste API key"}
          autoComplete="off"
          className="mt-3 h-11 w-full rounded-md bg-inset px-3 text-sm outline-none"
        />
        ) : (
          <p className="mt-3 text-center text-xs text-subtle">No cloud key. Point other tools at /api/v1 · model hector-hx.</p>
        )}
        {error ? <p className="mt-2 text-sm text-fail">{error}</p> : null}
        <Button type="button" className="mt-5 h-12 w-full" onClick={connect}>
          Start building
        </Button>
        </>
        ) : null}
      </div>
      </div>
    </div>
  );
}
