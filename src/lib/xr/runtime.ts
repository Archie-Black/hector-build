import { pickSession, probeXr, sessionInit, xrSystem, type ImmersivePref, type XrKind } from "./caps.ts";
import { ImmersiveWorld } from "./world.ts";

export type XrHandle = {
  world: ImmersiveWorld;
  kind: XrKind | "room";
  session: XRSession | null;
  stop: () => Promise<void>;
};

export async function startImmersive(opts: {
  canvas: HTMLCanvasElement;
  pref: ImmersivePref;
  overlay?: HTMLElement | null;
}): Promise<XrHandle | null> {
  const world = new ImmersiveWorld(opts.canvas);
  const caps = await probeXr();
  const kind = pickSession(caps, opts.pref);

  if (opts.pref === "room" || kind === "inline" || !kind) {
    world.startInline();
    return {
      world,
      kind: "room",
      session: null,
      stop: async () => world.dispose(),
    };
  }

  const xr = xrSystem();
  if (!xr) {
    world.startInline();
    return { world, kind: "room", session: null, stop: async () => world.dispose() };
  }

  const session = await xr.requestSession(kind, sessionInit(kind, opts.overlay));
  await world.attach(session, kind);
  session.addEventListener("select", () => world.placeAtReticle());
  session.addEventListener("end", () => {
    world.dispose();
  });
  return {
    world,
    kind,
    session,
    stop: () => world.stop(),
  };
}
