/** One-person studio. Godot 4.7 + Unreal 5.8. Hector fills the chairs. */

export type Seat = "design" | "art" | "code" | "audio" | "ship" | "promo";

export type Kit = {
  title: string;
  engine: "both";
  godot: string;
  unreal: string;
  seats: Record<Seat, string>;
  store: string;
  trailer: string[];
  post: string;
};

export function author(want: string): Kit {
  const title = name(want);
  return {
    title,
    engine: "both",
    godot: "native/horizon/Godot/project.godot",
    unreal: "native/horizon/UE/SpectralHorizon/SpectralHorizon.uproject",
    seats: {
      design: `Loop, camera, and fail states for ${title}. One pass. No committee.`,
      art: "Hell light, volcanic glass, uranium and cobalt. Unique plates. No copies.",
      code: "Spectral HX knot persistency. Godot 4.7 iterates. Unreal 5.8 ships the cinematic.",
      audio: "Braided space. Delay taps. No stock whooshes.",
      ship: "Windows and Linux from the same build. Guest off. Defense only.",
      promo: "True words. No fake reviews. DooMChaT first.",
    },
    store: `${title}. You play. Hector built the rest. Free to run. Needs an honest key.`,
    trailer: ["Hell gate opens.", "One person at the desk.", "The world keeps going.", title],
    post: `${title} is live on OS V01D. Built in Portal Forge. y.doomchat.ca`,
  };
}

function name(want: string) {
  const t = want.replace(/\s+/g, " ").trim() || "Spectral Horizon";
  return t.slice(0, 48);
}
