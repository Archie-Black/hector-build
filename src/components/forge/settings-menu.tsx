import { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OsWindow } from "@/components/forge/os-window";
import { useForgeStore } from "@/lib/forge-store";
import { CHAT_PROVIDERS, type ChatProviderId } from "@/lib/workspace/providers";
import { forgetVisitorKey, isApiKey, maskKey } from "@/lib/workspace/keys";
import { VaultPanel } from "@/components/forge/vault-panel";
import { GuestPanel } from "@/components/forge/guest-panel";
import { CREDIT, DISCLAIMER, FREE_API_URL, FREE_LINE, ONE_MAN, SUPPORT_EMAIL } from "@/lib/legal/copy";
import { installHint } from "@/lib/workspace/host-settings";
import { osLabel } from "@/lib/workspace/platform";
import { loadExt, saveExt, type ClientExt } from "@/lib/workspace/extensions-store";
import { loadHome, saveHome } from "@/lib/ollama/home";
import { loadSession } from "@/lib/auth/local-account";
import { requestSupport } from "@/lib/support/session";
import { sfx } from "@/lib/sfx/hector";

const TABS = ["Look", "System", "Chatbot", "Agent", "Updates", "Vault", "Guest", "About"] as const;

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
  const host = useForgeStore((s) => s.host);
  const platform = useForgeStore((s) => s.platform);
  const baseUrl = useForgeStore((s) => s.baseUrl);
  const model = useForgeStore((s) => s.model);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Look");
  const [path, setPath] = useState("");
  const [key, setKey] = useState("");
  const [url, setUrl] = useState(baseUrl);
  const [mdl, setMdl] = useState(model);
  const [pid, setPid] = useState<ChatProviderId>(providerId);
  const [saved, setSaved] = useState(false);
  const [ext, setExt] = useState<ClientExt>(() => loadExt());
  const [home, setHome] = useState(() => loadHome().url);
  const [wslLine, setWslLine] = useState("WSL: checking…");

  useEffect(() => {
    if (tab !== "System") return;
    const desk = (window as unknown as { hxDesktop?: { wslStatus?: () => Promise<{ note?: string; via?: string; ready?: boolean }> } }).hxDesktop;
    const apply = (s: { note?: string; via?: string; ready?: boolean }) => {
      setWslLine(s.ready === false ? s.note || "WSL: not ready" : `WSL · ${s.via || "on"} · ${s.note || "embedded"}`);
    };
    if (desk?.wslStatus) {
      void desk.wslStatus().then(apply).catch(() => setWslLine("WSL: native Linux"));
      return;
    }
    void fetch("/api/v1/host/wsl")
      .then((r) => r.json())
      .then(apply)
      .catch(() => setWslLine("WSL: native Linux"));
  }, [tab]);

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
      key: pid === "ollama" || pid === "lmstudio" ? "local" : isApiKey(key) ? key : current,
    });
    saveHome({ url: home });
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
        {tab === "System" ? (
          <>
            <p className="text-xs tracking-[0.14em] text-subtle uppercase">This device</p>
            <p className="mt-2 text-sm">{osLabel(platform)}</p>
            <p className="mt-1 font-mono text-xs text-muted">{installHint(platform).path}</p>
            <p className="mt-2 text-sm text-muted text-pretty">{installHint(platform).how}</p>
            <p className="mt-2 text-sm text-pretty">{wslLine}</p>
            <p className="mt-4 text-xs tracking-[0.14em] text-subtle uppercase">Hector Cloud</p>
            <p className="mt-2 text-sm text-pretty">
              This app is the cloud. API <span className="font-mono">/api/v1</span>, MCP{" "}
              <span className="font-mono">/api/v1/mcp</span>, functions <span className="font-mono">/api/v1/functions</span>.
              Hector is a transient OS. Spectral HX is userland. Print-spool jobs wait until the backend is up. Bluetooth-style pairing is how bots join. Ghosts never take keyboard focus. Say “publish this” and the build goes live at name.doomchat.ca — same job as grok.me.
            </p>
            <div className="mt-4 grid gap-2">
              {(
                [
                  ["ghosts", "Ghosts"],
                  ["verbose", "Verbose"],
                  ["notifications", "Notifications"],
                  ["reducedMotion", "Less motion"],
                  ["autoStart", "Start with OS"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={"flex h-11 items-center justify-between rounded-md px-3 text-sm " + (host[key] ? "bg-accent text-accent-fg" : "glass-thin")}
                  onClick={() => useForgeStore.getState().setHost({ [key]: !host[key] })}
                >
                  <span>{label}</span>
                  <span>{host[key] ? "on" : "off"}</span>
                </button>
              ))}
            </div>
            <p className="mt-4 text-xs tracking-[0.14em] text-subtle uppercase">Keyboard</p>
            <div className="mt-2 flex gap-2">
              {(["auto", "desktop", "touch"] as const).map((kb) => (
                <button
                  key={kb}
                  type="button"
                  className={"h-11 flex-1 rounded-md text-sm " + (host.keyboard === kb ? "bg-accent text-accent-fg" : "glass-thin")}
                  onClick={() => useForgeStore.getState().setHost({ keyboard: kb })}
                >
                  {kb}
                </button>
              ))}
            </div>
            <p className="mt-6 text-xs tracking-[0.14em] text-subtle uppercase">Arcade.dev</p>
            <p className="mt-1 text-sm text-muted text-pretty">Optional. Gmail, Slack, GitHub. Key from app.arcade.dev.</p>
            <input
              type="password"
              value={ext.arcadeKey}
              onChange={(e) => setExt({ ...ext, arcadeKey: e.target.value })}
              placeholder="ARCADE_API_KEY"
              className="mt-2 h-11 w-full rounded-md bg-inset px-3 text-sm outline-none"
            />
            <input
              value={ext.arcadeUser}
              onChange={(e) => setExt({ ...ext, arcadeUser: e.target.value })}
              placeholder="Arcade user id (email)"
              className="mt-2 h-11 w-full rounded-md bg-inset px-3 text-sm outline-none"
            />
            <p className="mt-4 text-xs tracking-[0.14em] text-subtle uppercase">Google Cloud MCP</p>
            <p className="mt-1 text-sm text-muted text-pretty">OAuth token, cloud-platform scope. Not an API key.</p>
            <input
              type="password"
              value={ext.gcpToken}
              onChange={(e) => setExt({ ...ext, gcpToken: e.target.value })}
              placeholder="GCP access token"
              className="mt-2 h-11 w-full rounded-md bg-inset px-3 text-sm outline-none"
            />
            <input
              value={ext.gcpProject}
              onChange={(e) => setExt({ ...ext, gcpProject: e.target.value })}
              placeholder="GCP project id"
              className="mt-2 h-11 w-full rounded-md bg-inset px-3 text-sm outline-none"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {["cli", "bigquery", "storage", "compute", "run", "functions", "firestore"].map((id) => (
                <button
                  key={id}
                  type="button"
                  className={"h-9 rounded-md px-3 text-sm " + (ext.gcpMcp === id ? "bg-accent text-accent-fg" : "glass-thin")}
                  onClick={() => setExt({ ...ext, gcpMcp: id })}
                >
                  {id}
                </button>
              ))}
            </div>
            <p className="mt-4 text-xs tracking-[0.14em] text-subtle uppercase">IBM ContextForge</p>
            <p className="mt-1 text-sm text-muted text-pretty">On. Always. IBM on :4444 if it is running, Hector otherwise. No switch.</p>
            <input
              value={ext.ibmForge}
              onChange={(e) => setExt({ ...ext, ibmForge: e.target.value })}
              placeholder="http://127.0.0.1:4444"
              className="mt-2 h-11 w-full rounded-md bg-inset px-3 text-sm outline-none"
            />
            <input
              type="password"
              value={ext.ibmForgeToken}
              onChange={(e) => setExt({ ...ext, ibmForgeToken: e.target.value })}
              placeholder="Bearer token (optional)"
              className="mt-2 h-11 w-full rounded-md bg-inset px-3 text-sm outline-none"
            />
            <Button
              type="button"
              className="mt-3 h-11 w-full"
              onClick={() => {
                saveExt(ext);
                setSaved(true);
              }}
            >
              Save extensions
            </Button>
          </>
        ) : null}
        {tab === "Chatbot" ? (
          <>
            <p className="text-xs tracking-[0.14em] text-subtle uppercase">Home server</p>
            <p className="mt-1 text-xs text-muted">Ollama on this PC, LAN, or https://ollama.doomchat.ca. Hector picks the strongest coder it finds.</p>
            <input
              value={home}
              onChange={(e) => setHome(e.target.value)}
              placeholder="http://192.168.1.10:11434"
              className="mt-2 h-11 w-full rounded-md bg-inset px-3 text-sm outline-none"
            />
            <p className="mt-3 text-xs tracking-[0.14em] text-subtle uppercase">Provider</p>
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
            {pid === "custom" || pid === "ollama" || pid === "lmstudio" ? (
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
            {CHAT_PROVIDERS.find((p) => p.id === pid)?.hint ? (
              <p className="mt-2 text-xs text-muted">{CHAT_PROVIDERS.find((p) => p.id === pid)?.hint}</p>
            ) : null}
            {pid === "xai" || pid === "openai" || pid === "groq" || pid === "openrouter" || pid === "custom" ? (
              <>
                <input
                  type="password"
                  autoComplete="off"
                  spellCheck={false}
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="Private key — encrypted on this device"
                  className="mt-3 h-11 w-full rounded-md bg-inset px-3 text-sm outline-none"
                />
                {useForgeStore.getState().visitorKey ? (
                  <p className="mt-2 text-xs text-muted">
                    Lockbox {maskKey(useForgeStore.getState().visitorKey)}.{" "}
                    <button
                      type="button"
                      className="underline"
                      onClick={() => {
                        forgetVisitorKey();
                        setKey("");
                        useForgeStore.getState().setVisitorKey("");
                      }}
                    >
                      Remove
                    </button>
                  </p>
                ) : null}
              </>
            ) : null}
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
