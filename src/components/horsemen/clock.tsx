import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { now as ntpNow, syncNtp } from "@/lib/sky/clock";
import { readLink, saveLink, type Link } from "@/lib/net/link";

export function ClockNet({ onSettings }: { onSettings: () => void }) {
  const [now, setNow] = useState(() => new Date());
  const [link, setLink] = useState<Link>({ ssid: "…", on: false, note: "" });
  const [form, setForm] = useState(false);
  const [ssid, setSsid] = useState("");
  const [pass, setPass] = useState("");

  useEffect(() => {
    const id = window.setInterval(() => setNow(ntpNow()), 1000);
    setNow(ntpNow());
    void syncNtp().then(() => setNow(ntpNow()));
    void readLink().then(setLink);
    return () => window.clearInterval(id);
  }, []);

  const t = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

  return (
    <div className="clock-net flex flex-col items-end gap-1" onPointerDown={(e) => e.stopPropagation()}>
      <p className="clock-glass" aria-label="Time">
        {t}
      </p>
      <div className="flex items-center gap-1">
        <p className="ssid-chip" title={link.note}>
          {link.on ? link.ssid : "Off"}
        </p>
        <button type="button" aria-label="Network settings" className="ssid-plus" onClick={() => setForm((v) => !v)}>
          <Plus className="size-3.5" />
        </button>
      </div>
      {form ? (
        <form
          className="pane-glass w-64 rounded-xl p-3"
          onSubmit={(e) => {
            e.preventDefault();
            void saveLink(ssid, pass).then((l) => {
              setLink(l);
              setForm(false);
            });
          }}
        >
          <p className="pb-2 text-xs text-steel">Join a network. Hector only uses what you allow.</p>
          <input value={ssid} onChange={(e) => setSsid(e.target.value)} placeholder="Network name" className="mb-2 h-10 w-full rounded-lg bg-ink px-3 text-sm text-ash outline-none" />
          <input value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Password" type="password" className="mb-2 h-10 w-full rounded-lg bg-ink px-3 text-sm text-ash outline-none" />
          <div className="flex gap-2">
            <button type="submit" className="h-10 flex-1 rounded-lg bg-cobalt text-sm text-ash">
              Join
            </button>
            <button type="button" className="h-10 rounded-lg px-3 text-sm text-ice" onClick={onSettings}>
              More
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
