import * as THREE from "three";
import type { XrKind } from "./caps.ts";

const COBALT = 0x0047ab;
const URANIUM = 0xe6ff2a;

type Orbit = { mesh: THREE.Sprite; tilt: number; yaw: number; r: number; speed: number; phase: number };

export class ImmersiveWorld {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(72, 1, 0.05, 40);
  private skull = new THREE.Sprite();
  private orbits: Orbit[] = [];
  private grid: THREE.GridHelper;
  private clock = new THREE.Clock();
  private hitSource: XRHitTestSource | null = null;
  private reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.06, 0.08, 32),
    new THREE.MeshBasicMaterial({ color: URANIUM, side: THREE.DoubleSide, transparent: true, opacity: 0.85 }),
  );
  private placed = false;
  private kind: XrKind = "inline";
  private lookX = 0;
  private lookY = 0;
  private disposed = false;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.xr.enabled = true;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.scene.fog = new THREE.FogExp2(0x000000, 0.08);
    this.camera.position.set(0, 1.5, 2.4);

    this.scene.add(new THREE.HemisphereLight(0x6ea8ff, 0x05070c, 1.1));
    const key = new THREE.PointLight(COBALT, 8, 8, 2);
    key.position.set(-0.6, 2.1, 1.2);
    this.scene.add(key);
    const rim = new THREE.PointLight(URANIUM, 3.2, 6, 2);
    rim.position.set(0.8, 1.4, 0.4);
    this.scene.add(rim);

    this.grid = new THREE.GridHelper(8, 16, COBALT, 0x0c1220);
    this.grid.position.y = 0;
    this.scene.add(this.grid);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(4.2, 64),
      new THREE.MeshBasicMaterial({ color: COBALT, transparent: true, opacity: 0.12, side: THREE.DoubleSide }),
    );
    floor.rotation.x = -Math.PI / 2;
    this.scene.add(floor);

    this.reticle.rotation.x = -Math.PI / 2;
    this.reticle.visible = false;
    this.scene.add(this.reticle);

    const skullTex = new THREE.TextureLoader().load("/hector/skull-cut.png");
    skullTex.colorSpace = THREE.SRGBColorSpace;
    this.skull.material = new THREE.SpriteMaterial({ map: skullTex, transparent: true, depthWrite: false });
    this.skull.scale.set(0.72, 0.72, 1);
    this.skull.position.set(0, 1.42, -1.55);
    this.scene.add(this.skull);

    const ghostTex = new THREE.TextureLoader().load("/hector/agent-cut.png");
    ghostTex.colorSpace = THREE.SRGBColorSpace;
    const rings = [
      { tilt: 1.15, yaw: 0.1, r: 0.62, speed: 1.15 },
      { tilt: 1.05, yaw: 2.2, r: 0.54, speed: 0.82 },
      { tilt: 1.28, yaw: -0.9, r: 0.58, speed: 1.4 },
    ];
    this.orbits = rings.map((ring, i) => {
      const mesh = new THREE.Sprite(new THREE.SpriteMaterial({ map: ghostTex, transparent: true, depthWrite: false }));
      mesh.scale.set(0.16, 0.16, 1);
      this.scene.add(mesh);
      return { mesh, ...ring, phase: i * 2.1 };
    });

    window.addEventListener("resize", this.resize);
    this.resize();
  }

  private resize = () => {
    if (this.renderer.xr.isPresenting) return;
    const c = this.renderer.domElement;
    const w = c.clientWidth || 1;
    const h = c.clientHeight || 1;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  };

  look(sx: number, sy: number) {
    this.lookX = sx;
    this.lookY = sy;
  }

  async attach(session: XRSession, kind: XrKind) {
    this.kind = kind;
    this.renderer.setClearColor(0x000000, kind === "immersive-ar" ? 0 : 1);
    this.grid.visible = kind !== "immersive-ar";
    await this.renderer.xr.setSession(session);
    const space = await this.refSpace(session);
    this.renderer.xr.setReferenceSpace(space);
    if (kind === "immersive-ar" && session.requestHitTestSource) {
      const viewer = await session.requestReferenceSpace("viewer");
      this.hitSource = (await session.requestHitTestSource({ space: viewer })) ?? null;
    }
    this.renderer.setAnimationLoop(this.loop);
  }

  startInline() {
    this.kind = "inline";
    this.renderer.setClearColor(0x000000, 1);
    this.grid.visible = true;
    this.renderer.setAnimationLoop(this.loop);
  }

  private async refSpace(session: XRSession) {
    try {
      return await session.requestReferenceSpace("local-floor");
    } catch {
      return session.requestReferenceSpace("local");
    }
  }

  private loop = (_t: number, frame?: XRFrame) => {
    if (this.disposed) return;
    const dt = this.clock.getDelta();
    const t = this.clock.elapsedTime;
    if (this.kind === "inline" && !this.renderer.xr.isPresenting) {
      this.camera.position.set(Math.sin(this.lookX * 0.5) * 0.35, 1.5 + this.lookY * -0.12, 2.35);
      this.camera.lookAt(this.skull.position);
    }
    for (const o of this.orbits) {
      const a = t * o.speed + o.phase;
      const x = Math.cos(a) * o.r;
      const y = Math.sin(a) * Math.sin(o.tilt) * o.r * 0.55;
      const z = Math.sin(a) * Math.cos(o.tilt) * o.r;
      const cy = Math.cos(o.yaw);
      const sy = Math.sin(o.yaw);
      o.mesh.position.set(
        this.skull.position.x + x * cy - z * sy,
        this.skull.position.y + y,
        this.skull.position.z + x * sy + z * cy,
      );
    }
    this.skull.material.rotation = Math.sin(t * 0.4) * 0.04;
    if (frame && this.hitSource && !this.placed) {
      const hits = frame.getHitTestResults(this.hitSource);
      const pose = hits[0]?.getPose(this.renderer.xr.getReferenceSpace()!);
      if (pose) {
        this.reticle.visible = true;
        this.reticle.position.set(pose.transform.position.x, pose.transform.position.y + 0.002, pose.transform.position.z);
      }
    }
    void dt;
    this.renderer.render(this.scene, this.camera);
  };

  placeAtReticle() {
    if (!this.reticle.visible) return;
    this.skull.position.copy(this.reticle.position).add(new THREE.Vector3(0, 1.35, 0));
    this.placed = true;
    this.reticle.visible = false;
  }

  async stop() {
    const session = this.renderer.xr.getSession();
    this.renderer.setAnimationLoop(null);
    this.hitSource?.cancel();
    this.hitSource = null;
    if (session) await session.end().catch(() => undefined);
  }

  dispose() {
    this.disposed = true;
    window.removeEventListener("resize", this.resize);
    void this.stop();
    this.renderer.dispose();
  }
}
