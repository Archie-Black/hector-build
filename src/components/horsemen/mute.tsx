import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";
import { bootSound, muted, onMute, toggleMute, unlock } from "@/lib/v01d/sound";

export function Mute() {
  const [off, setOff] = useState(false);
  useEffect(() => {
    bootSound();
    setOff(muted());
    return onMute(() => setOff(muted()));
  }, []);
  return (
    <button
      type="button"
      className="void-mute"
      aria-label={off ? "Unmute" : "Mute"}
      aria-pressed={off}
      onPointerDown={(e) => {
        e.stopPropagation();
        unlock();
      }}
      onClick={() => {
        unlock();
        toggleMute();
      }}
    >
      {off ? <VolumeX size={18} /> : <Volume2 size={18} />}
    </button>
  );
}
