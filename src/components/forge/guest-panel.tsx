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

export function GuestPanel() {
  const [text, setText] = useState("…");
  const [con, setCon] = useState("");
  const [ok, setOk] = useState(false);
  const [qemu, setQemu] = useState(false);
  const [iso, setIso] = useState(false);
  const [live, setLive] = useState(false);

  async function refresh() {
    const s = await guestStatus();
    setText(s.text);
    setQemu(s.qemu);
    setIso(s.iso);
    setLive(s.live);
    const c = await guestConsole();
    setCon(c.text);
  }

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <div>
      <p className="text-xs tracking-[0.14em] text-subtle uppercase">Hector Guest</p>
      <p className="mt-2 text-sm text-muted text-pretty">
        Alpine in QEMU. Virtio disk, balloon, rng, 9p share of this workspace, SSH on 2222, serial
        console. You approve start. Wipe deletes the disk and logs.
      </p>
      <p className="mt-2 font-mono text-xs text-muted">
        QEMU {qemu ? "LIVE" : "STUB (install qemu-system-x86_64)"} · ISO {iso ? "ready" : "missing"} ·{" "}
        {live ? "running" : "down"}
      </p>
      <p className="mt-2 font-mono text-xs">{text}</p>
      <label className="mt-3 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} />
        I approve starting the guest on this machine
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={!ok}
          onClick={() => void guestStart().then(() => refresh())}
        >
          Start guest
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
      <p className="mt-2 text-xs text-subtle text-pretty">
        Inside the guest: <code>mount -t 9p -o trans=virtio hector /mnt</code>. SSH:{" "}
        <code>ssh -p 2222 root@127.0.0.1</code> after you set a password. This is not Damn Small Linux
        — it is a current Alpine virtio machine branded Hector Guest.
      </p>
    </div>
  );
}
