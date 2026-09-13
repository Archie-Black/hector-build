import { useEffect, useState } from "react";
import { MHC } from "@/lib/hx/metahuman";

type Snap = { editor?: boolean; creator?: boolean; rig?: boolean; note?: string };

export function MetaHuman() {
  const [snap, setSnap] = useState<Snap>({});
  const [note, setNote] = useState<string>(MHC.note);

  async function load() {
    const r = await fetch("/api/v1/hx/metahuman");
    const j = (await r.json()) as Snap;
    setSnap(j);
    setNote(j.note || MHC.note);
  }

  useEffect(() => {
    void load();
  }, []);

  async function open() {
    const r = await fetch("/api/v1/hx/metahuman", { method: "POST" });
    const j = (await r.json()) as { note?: string };
    setNote(j.note || "Stopped.");
  }

  return (
    <section className="genesis-tools mh">
      <p>MetaHuman Creator 5.8</p>
      <ul>
        <li>
          <b>Editor</b>
          <span>{snap.editor ? "Unreal 5.8 found." : "Not on this machine yet."}</span>
        </li>
        <li>
          <b>Rig</b>
          <span>{snap.rig ? "OpenRigLogic is local." : "Install OpenRigLogic when you want the same face outside UE."}</span>
        </li>
        <li>
          <b>Hector</b>
          <span>{MHC.character}</span>
        </li>
      </ul>
      <p className="genesis-note">{note}</p>
      <button type="button" className="genesis-go" onClick={() => void open()}>
        Open Creator
      </button>
    </section>
  );
}
