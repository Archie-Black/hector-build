import { useEffect, useRef, useState } from "react";
import { loadImmersive, probeXr, saveImmersive, type ImmersivePref, type XrCaps } from "@/lib/xr/caps";
import { startImmersive, type XrHandle } from "@/lib/xr/runtime";

type Props = {
  overlayId?: string;
};

export function XrPortal({ overlayId = "hector-xr-overlay" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<XrHandle | null>(null);
  const [pref, setPref] = useState<ImmersivePref>("glass");
  const [caps, setCaps] = useState<XrCaps>({ xr: false, vr: false, ar: false, inline: false });
  const [live, setLive] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    setPref(loadImmersive());
    void probeXr().then(setCaps);
    const onPref = (e: Event) => setPref((e as CustomEvent<ImmersivePref>).detail);
    window.addEventListener("hector-immersive", onPref);
    return () => window.removeEventListener("hector-immersive", onPref);
  }, []);

  useEffect(() => {
    const field = canvasRef.current?.closest(".spatial-field");
    field?.classList.toggle("xr-live", live);
  }, [live]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let dead = false;
    void (async () => {
      if (pref !== "room") {
        if (pref === "glass") {
          await handleRef.current?.stop();
          handleRef.current = null;
          if (!dead) setLive(false);
        }
        return;
      }
      await handleRef.current?.stop();
      if (dead) return;
      const handle = await startImmersive({ canvas, pref: "room" });
      if (dead) {
        await handle?.stop();
        return;
      }
      handleRef.current = handle;
      setLive(Boolean(handle));
      setNote("Room");
    })();
    return () => {
      dead = true;
    };
  }, [pref]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const field = canvasRef.current?.closest(".spatial-field") as HTMLElement | null;
      const sx = Number(field?.style.getPropertyValue("--sx") || 0);
      const sy = Number(field?.style.getPropertyValue("--sy") || 0);
      handleRef.current?.world.look(sx, sy);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => () => void handleRef.current?.stop(), []);

  async function enterHeadset() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    saveImmersive("headset");
    setPref("headset");
    setNote(null);
    try {
      await handleRef.current?.stop();
      const overlay = document.getElementById(overlayId);
      const handle = await startImmersive({ canvas, pref: "headset", overlay });
      handleRef.current = handle;
      setLive(Boolean(handle));
      setNote(handle?.kind === "immersive-ar" ? "AR" : handle?.kind === "immersive-vr" ? "VR" : "Room");
    } catch (err) {
      setNote(err instanceof Error ? err.message : "XR blocked");
      setLive(false);
    }
  }

  const showEnter = caps.vr || caps.ar;

  return (
    <>
      <canvas
        ref={canvasRef}
        className={"xr-canvas" + (pref === "glass" && !live ? " xr-canvas-off" : "")}
        aria-hidden
      />
      {showEnter && !live ? (
        <button type="button" className="xr-enter" onClick={() => void enterHeadset()}>
          Enter space
        </button>
      ) : null}
      {live && note ? <p className="xr-live">{note}</p> : null}
    </>
  );
}
