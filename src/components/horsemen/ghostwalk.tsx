import { ArrowLeft, Ghost, Plus, RotateCcw, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { circuit, cleanUrl, isOnion } from "@/lib/ghostwalk/ghstkrt";

type Tab = { id: string; title: string; url: string; html: string; note: string };

function blank(): Tab {
  return { id: circuit(), title: "Home", url: "", html: "", note: "quiet" };
}

export function GhostWalk() {
  const [tabs, setTabs] = useState<Tab[]>(() => [blank()]);
  const [cur, setCur] = useState(0);
  const [bar, setBar] = useState("");
  const [tor, setTor] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [cid, setCid] = useState(() => circuit());

  useEffect(() => {
    void fetch("/api/v1/ghostwalk?probe=tor")
      .then((r) => r.json())
      .then((j) => setTor(Boolean(j.tor)))
      .catch(() => setTor(false));
  }, [cid]);

  const tab = tabs[cur] ?? tabs[0];

  async function go(raw: string) {
    let href = raw.trim();
    if (!href) return;
    if (!href.includes(".") && !href.includes("://")) {
      href = `https://duckduckgo.com/?q=${encodeURIComponent(href)}`;
    }
    const url = cleanUrl(href);
    if (!url) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/v1/ghostwalk?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      setTabs((xs) =>
        xs.map((t, i) =>
          i === cur
            ? {
                ...t,
                url,
                title: titleOf(url),
                html: typeof data.html === "string" ? data.html : "",
                note: data.note || (data.tor ? "hidden" : "quiet"),
              }
            : t,
        ),
      );
      setBar(url);
      if (typeof data.tor === "boolean") setTor(data.tor);
    } finally {
      setBusy(false);
    }
  }

  function fresh() {
    setCid(circuit());
    setTabs([blank()]);
    setCur(0);
    setBar("");
  }

  return (
    <div className="ghostwalk flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-cobalt/25 px-2 py-1">
        <Ghost className="size-4 text-ice" />
        <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
          {tabs.map((t, i) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setCur(i);
                setBar(t.url);
              }}
              className={`h-9 max-w-40 truncate rounded-lg px-3 text-xs ${i === cur ? "bg-cobalt/35 text-ash" : "text-steel hover:text-ash"}`}
            >
              {t.title}
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-label="New tab"
          onClick={() => {
            setTabs((xs) => [...xs, blank()]);
            setCur(tabs.length);
            setBar("");
          }}
          className="win-hit text-ice"
        >
          <Plus className="size-4" />
        </button>
      </div>
      <form
        className="flex items-center gap-1 border-b border-cobalt/25 px-2 py-2"
        onSubmit={(e) => {
          e.preventDefault();
          void go(bar);
        }}
      >
        <button
          type="button"
          aria-label="Back"
          className="win-hit text-ice"
          onClick={() => {
            setTabs((xs) => xs.map((t, i) => (i === cur ? { ...t, html: "", url: "", title: "Home", note: "quiet" } : t)));
            setBar("");
          }}
        >
          <ArrowLeft className="size-4" />
        </button>
        <input
          value={bar}
          onChange={(e) => setBar(e.target.value)}
          placeholder="Search or type an address. Nobody follows you."
          className="h-11 min-w-0 flex-1 rounded-full bg-ink/80 px-4 text-sm text-ash outline-none ring-1 ring-cobalt/40"
          aria-label="Address"
        />
        <button type="submit" className="h-11 rounded-full bg-cobalt px-4 text-sm text-ash active:scale-[0.96]">
          {busy ? "…" : "Go"}
        </button>
        <button type="button" aria-label="New identity" onClick={fresh} className="win-hit text-ice" title="Forget this walk">
          <RotateCcw className="size-4" />
        </button>
      </form>
      <p className="flex items-center gap-2 px-3 py-1 font-mono text-[10px] tracking-[0.16em] text-ice uppercase">
        <Shield className="size-3" />
        {tor ? "hidden path" : "quiet path"} · {cid.slice(0, 8)} · {tab.note}
        {tab.url && isOnion(tab.url) ? " · onion" : ""}
      </p>
      <div className="relative min-h-0 flex-1">
        {!tab.html ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <Ghost className="size-10 text-ice/70" />
            <p className="text-lg text-ash">GhostWalk</p>
            <p className="max-w-sm text-sm text-steel">
              Hector keeps the trail off you. Trackers get dropped. Cookies do not stick. Tor hides the road when it is running.
            </p>
          </div>
        ) : (
          <iframe title="page" sandbox="allow-same-origin" className="h-full w-full bg-ink" srcDoc={wrap(tab.html, tab.url)} />
        )}
      </div>
    </div>
  );
}

function titleOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "page";
  }
}

function wrap(html: string, url: string): string {
  const safe = url.replace(/"/g, "");
  return `<!doctype html><html><head><base href="${safe}"><meta charset="utf-8"><style>
    body{margin:0;background:#070b14;color:#c5d4f0;font:16px/1.5 ui-sans-serif,system-ui}
    a{color:#6ea8ff} img{max-width:100%}
  </style></head><body>${html}</body></html>`;
}
