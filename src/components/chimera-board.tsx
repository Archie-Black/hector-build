import { useEffect, useMemo, useState } from "react";
import { Enclave, Riv, STACK_NOTE, STACKS, VECTORS, hopPort, status } from "@/lib/chimera";
import { hectorEpoch, hectorHop } from "@/lib/hector";

export function ChimeraBoard() {
  const enc = useMemo(() => new Enclave(new Uint8Array(32).fill(3)), []);
  const riv = useMemo(() => new Riv(), []);
  const [snap, setSnap] = useState(() => status(enc, riv));
  const [note, setNote] = useState("Hector is on Chimera. Sealed.");

  useEffect(() => {
    void riv.pin([{ name: "hector", bytes: new TextEncoder().encode("chimera-v1") }]).then(() => setSnap(status(enc, riv)));
  }, [enc, riv]);

  async function ping(vec: (typeof VECTORS)[number]) {
    const wire = await hectorHop(vec, "heartbeat");
    setNote(`Hector ${vec} epoch ${wire.epoch} hop ${wire.hop} wait ${wire.wait}ms pad ${wire.body.length}`);
    setSnap(status(enc, riv));
  }

  return (
    <main className="min-h-dvh bg-black px-6 py-10 text-[#c5d4f0]">
      <p className="text-xs tracking-[0.28em] text-[#6ea8ff] uppercase">OS V01D · Chimera</p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight text-white">Defense is the product.</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#8aa0c8]">
        Assume the box is owned. Secrets stay in the enclave. REST, WebSockets, gRPC, and RF
        leave as padded hops. Rust, Go, C++, Kubernetes speak the same envelope. Invalid probes
        get decoys. Logs are hashes.
      </p>
      <p className="mt-4 text-xs text-[#6ea8ff]">
        Hector epoch {hectorEpoch()} · shield {snap.epoch} · hop {hopPort(snap.epoch)} · {snap.riv}
      </p>
      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[#0047ab] bg-[#070b14]/80 p-4">
          <p className="text-[11px] tracking-[0.18em] uppercase text-[#6ea8ff]">Vectors</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {VECTORS.map((v) => (
              <button
                key={v}
                type="button"
                className="h-11 rounded-md border border-[#0047ab] px-3 text-sm text-white"
                onClick={() => void ping(v)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-[#0047ab] bg-[#070b14]/80 p-4">
          <p className="text-[11px] tracking-[0.18em] uppercase text-[#6ea8ff]">Stacks</p>
          <ul className="mt-3 space-y-2 text-sm">
            {STACKS.map((s) => (
              <li key={s}>
                <span className="text-white">{s}</span>
                <span className="ml-2 text-[#8aa0c8]">{STACK_NOTE[s]}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <p className="mt-6 text-sm text-[#e6ff2a]">{note}</p>
    </main>
  );
}
