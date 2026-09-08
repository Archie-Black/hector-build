import { useState } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OsWindow } from "@/components/forge/os-window";
import { useForgeStore } from "@/lib/forge-store";
import { CHAT_PROVIDERS, type ChatProviderId } from "@/lib/workspace/providers";
import { isApiKey } from "@/lib/workspace/keys";
import { VaultPanel } from "@/components/forge/vault-panel";
import { GuestPanel } from "@/components/forge/guest-panel";
import { CREDIT, DISCLAIMER, FREE_API_URL, FREE_LINE, ONE_MAN, SUPPORT_EMAIL } from "@/lib/legal/copy";
import { loadSession } from "@/lib/auth/local-account";
import { requestSupport } from "@/lib/support/session";
import { sfx } from "@/lib/sfx/hector";

const TABS = ["Look", "Chatbot", "Agent", "Updates", "Vault", "Guest", "About"] as const;

export function SettingsButton() {
  return (
    <button
      type="button"
      className="flex size-11 items-center justify-center rounded-md text-muted"
      onClick={() => {
        sfx.click();
        useForgeStore.getState().setSettingsOpen(true);
      }}
      aria-label="Settings"
    >
      <Settings className="size-4" />
    </button>
  );
}

export function SettingsPanel() {
  const theme = useForgeStore((s) => s.theme);
  const spendCap = useForgeStore((s) => s.spendCap);
  const allowlist = useForgeStore((s) => s.allowlist);
  const updates = useForgeStore((s) => s.updates);
  const providerId = useForgeStore((s) => s.providerId);
  const baseUrl = useForgeStore((s) => s.baseUrl);
  const model = useForgeStore((s) => s.model);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Look");
  const [path, setPath] = useState("");
  const [key, setKey] = useState("");
  const [url, setUrl] = useState(baseUrl);
  const [mdl, setMdl] = useState(model);
  const [pid, setPid] = useState<ChatProviderId>(providerId);
  const [saved, setSaved] = useState(false);

  function pick(id: ChatProviderId) {
    const p = CHAT_PROVIDERS.find((x) => x.id === id)!;
    setPid(id);
    setUrl(p.baseUrl);
    setMdl(p.model);
  }

  function saveChat() {
    const current = useForgeStore.getState().visitorKey;
    useForgeStore.getState().setChatProvider({
      id: pid,
      baseUrl: url,
      model: mdl,
      key: isApiKey(key) ? key : current,
    });
    setSaved(true);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 gap-1 overflow-auto px-3 py-2">
        {TABS.map((id) => (
          <button
            key={id}
            type="button"
            className={"h-9 rounded-md px-3 text-sm " + (tab === id ? "bg-accent text-accent-fg" : "text-muted")}
            onClick={() => setTab(id)}
          >
            {id}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-4 pb-4">
        {tab === "Look" ? (
          <>
            <p className="text-xs tracking-[0.14em] text-subtle uppercase">Theme</p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                className={"h-11 flex-1 rounded-md text-sm " + (theme === "dark" ? "bg-accent text-accent-fg" : "glass-thin")}
                onClick={() => useForgeStore.getState().setTheme("dark")}
              >
                Dark
              </button>
              <button
                type="button"
                className={"h-11 flex-1 rounded-md text-sm " + (theme === "light" ? "bg-accent text-accent-fg" : "glass-thin")}
                onClick={() => useForgeStore.getState().setTheme("light")}
              >
                Light
              </button>
            </div>
            <p className="mt-3 text-sm text-muted text-pretty">
              Dark is black and cobalt. Frosted glass stays on both themes.
            </p>
          </>
        ) : null}
        {tab === "Chatbot" ? (
          <>
            <p className="text-xs tracking-[0.14em] text-subtle uppercase">Provider</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {CHAT_PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={"h-11 rounded-md px-3 text-sm " + (pid === p.id ? "bg-accent text-accent-fg" : "glass-thin")}
                  onClick={() => pick(p.id)}
                >
                  {p.name}
                </button>
              ))}
            </div>
            {pid === "custom" ? (
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="http://127.0.0.1:11434/v1"
                className="mt-3 h-11 w-full rounded-md bg-inset px-3 text-sm outline-none"
              />
            ) : null}
            <input
              value={mdl}
              onChange={(e) => setMdl(e.target.value)}
              placeholder="model id"
              className="mt-3 h-11 w-full rounded-md bg-inset px-3 text-sm outline-none"
            />
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="API key (leave blank to keep current)"
              className="mt-3 h-11 w-full rounded-md bg-inset px-3 text-sm outline-none"
            />
            <Button type="button" className="mt-3 h-11 w-full" onClick={saveChat}>
              Save chatbot
            </Button>
            {saved ? <p className="mt-2 text-sm text-pass">Saved. Spectral HX will use this provider.</p> : null}
          </>
        ) : null}
        {tab === "Agent" ? (
          <>
            <p className="text-xs tracking-[0.14em] text-subtle uppercase">Spend cap</p>
            <input
              type="number"
              min={1}
              max={200}
              value={spendCap}
              onChange={(e) => useForgeStore.getState().setSpendCap(Number(e.target.value))}
              className="mt-2 h-11 w-full rounded-md bg-inset px-3 text-sm"
            />
            <p className="mt-3 text-xs tracking-[0.14em] text-subtle uppercase">Allowlist</p>
            <p className="mt-1 text-sm text-muted">{allowlist.join(", ") || "workspace defaults (src, demo)"}</p>
            <form
              className="mt-2 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (path.trim()) useForgeStore.getState().addAllow(path.trim());
                setPath("");
              }}
            >
              <input
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="folder or file"
                className="h-11 min-w-0 flex-1 rounded-md bg-inset px-3 text-sm outline-none"
              />
              <Button type="submit">Add</Button>
            </form>
            <Button type="button" variant="line" className="mt-3 h-11 w-full" onClick={() => useForgeStore.getState().grant()}>
              Grant project
            </Button>
          </>
        ) : null}
        {tab === "Updates" ? (
          <>
            <p className="text-xs tracking-[0.14em] text-subtle uppercase">Policy</p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                className={"h-11 flex-1 rounded-md text-sm " + (updates.policy === "approve" ? "bg-accent text-accent-fg" : "glass-thin")}
                onClick={() => useForgeStore.getState().setUpdatePolicy("approve")}
              >
                Ask first
              </button>
              <button
                type="button"
                className={"h-11 flex-1 rounded-md text-sm " + (updates.policy === "silent" ? "bg-accent text-accent-fg" : "glass-thin")}
                onClick={() => useForgeStore.getState().setUpdatePolicy("silent")}
              >
                Silent
              </button>
            </div>
            <p className="mt-3 text-xs tracking-[0.14em] text-subtle uppercase">Silent install hour</p>
            <input
              type="number"
              min={0}
              max={23}
              value={updates.installHour}
              onChange={(e) => useForgeStore.getState().setInstallHour(Number(e.target.value))}
              className="mt-2 h-11 w-full rounded-md bg-inset px-3 text-sm"
            />
            {updates.pending ? (
              <div className="mt-3 flex gap-2">
                <Button type="button" onClick={() => useForgeStore.getState().approveUpdate()}>
                  Install update
                </Button>
                <Button type="button" variant="line" onClick={() => useForgeStore.getState().dismissUpdate()}>
                  Dismiss
                </Button>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">No pending improvement build.</p>
            )}
          </>
        ) : null}
        {tab === "Vault" ? <VaultPanel /> : null}
        {tab === "Guest" ? <GuestPanel /> : null}
        {tab === "About" ? (
          <>
            <p className="text-sm">Hector Build · Spectral HX</p>
            <p className="mt-2 text-sm text-pass text-pretty">{FREE_LINE}</p>
            <a href={FREE_API_URL} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-accent">
              Get a free Groq API key
            </a>
            <p className="mt-4 text-sm text-muted text-pretty">{ONE_MAN}</p>
            <p className="mt-4 text-xs text-subtle text-pretty">{DISCLAIMER}</p>
            <p className="mt-4 text-sm">
              Tech support:{" "}
              <a href={"mailto:" + SUPPORT_EMAIL} className="text-accent">
                {SUPPORT_EMAIL}
              </a>
            </p>
            <Button
              type="button"
              className="mt-3"
              onClick={() => {
                const email = loadSession()?.email || "user@local";
                void requestSupport(email);
                useForgeStore.getState().setStatus("Support requested. Approve the connect when it arrives.");
              }}
            >
              Request support
            </Button>
            <p className="mt-6 text-xs tracking-[0.14em] text-subtle uppercase">{CREDIT}</p>
          </>
        ) : null}
      </div>
    </div>
  );
}

export function SettingsHost() {
  const open = useForgeStore((s) => s.settingsOpen);
  if (!open) return null;
  return (
    <OsWindow title="Settings" onClose={() => useForgeStore.getState().setSettingsOpen(false)}>
      <SettingsPanel />
    </OsWindow>
  );
}

export function SettingsMenu() {
  return (
    <>
      <SettingsButton />
      <SettingsHost />
    </>
  );
}
