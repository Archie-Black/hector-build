import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  guestConsole,
  guestSnapshot,
  guestStart,
  guestStatus,
  guestStop,
  guestWipe,
} from "@/lib/guest/hector-os";

type Os = { session?: { id?: string; phase?: string; persist?: boolean }; kind?: string; note?: string };

export function GuestPanel() {
  const [text, setText] = useState("…");
  const [con, setCon] = useState("");
  const [ok, setOk] = useState(false);
  const [qemu, setQemu] = useState(false);
  const [iso, setIso] = useState(false);
  const [live, setLive] = useState(false);
  const [os, setOs] = useState<Os | null>(null);

  async function refresh() {
    const s = await guestStatus();
    setText(s.text);
    setQemu(s.qemu);
    setIso(s.iso);
    setLive(s.live);
    const c = await guestConsole();
    setCon(c.text);
    try {
      const r = await fetch("/api/v1/os");
      setOs((await r.json()) as Os);
    } catch {
      setOs(null);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <div>
      <p className="text-xs tracking-[0.14em] text-subtle uppercase">Hector Transient OS</p>
      <p className="mt-2 text-sm text-muted text-pretty">
        Hector is the OS. Spectral HX is userland. The host is firmware. RAM-first. The vault is the
        only disk. Optional QEMU is a disposable hardware jail, not the OS itself.
      </p>
      <p className="mt-2 font-mono text-xs text-muted">
        OS {os?.session?.phase === "live" ? "LIVE" : "down"} · {os?.session?.id || "—"} · persist{" "}
        {os?.session?.persist ? "on" : "off"}
      </p>
      <p className="mt-3 text-xs tracking-[0.14em] text-subtle uppercase">Hardware jail (optional)</p>
      <p className="mt-2 font-mono text-xs text-muted">
        QEMU {qemu ? "LIVE" : "off"} · ISO {iso ? "ready" : "missing"} · {live ? "running" : "down"}
      </p>
      <p className="mt-2 font-mono text-xs">{text}</p>
      <label className="mt-3 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} />
        I approve starting the hardware jail on this machine
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" disabled={!ok} onClick={() => void guestStart().then(() => refresh())}>
          Start jail
        </Button>
        <Button type="button" variant="line" onClick={() => void guestStop().then(() => refresh())}>
          Stop
        </Button>
        <Button type="button" variant="line" onClick={() => void guestSnapshot().then(() => refresh())}>
          Snapshot
        </Button>
        <Button type="button" variant="line" onClick={() => void guestWipe().then(() => refresh())}>
          Wipe traces
        </Button>
      </div>
      <pre className="mt-3 max-h-40 overflow-auto rounded-md bg-inset p-2 font-mono text-[10px] text-muted">
        {con || "serial quiet"}
      </pre>
    </div>
  );
}