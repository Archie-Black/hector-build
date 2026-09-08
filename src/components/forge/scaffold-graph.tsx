import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Group } from "three";
import { useForgeStore } from "@/lib/forge-store";

function Lattice({ progress }: { progress: number }) {
  const group = useRef<Group>(null);
  const nodes = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const rings = 9;
    const around = 8;
    for (let y = 0; y < rings; y++) {
      const yy = y * 0.38 - 1.55;
      const rad = 0.7 + Math.sin(y * 0.5) * 0.12;
      for (let i = 0; i < around; i++) {
        const a = (i / around) * Math.PI * 2 + y * 0.22;
        pts.push(new THREE.Vector3(Math.cos(a) * rad, yy, Math.sin(a) * rad));
      }
    }
    return pts;
  }, []);

  const geo = useMemo(() => {
    const positions: number[] = [];
    const around = 8;
    for (let i = 0; i < nodes.length; i++) {
      const next = nodes[i + 1] && Math.floor((i + 1) / around) === Math.floor(i / around) ? nodes[i + 1] : nodes[i - (around - 1)];
      if (next) {
        positions.push(nodes[i].x, nodes[i].y, nodes[i].z, next.x, next.y, next.z);
      }
      const up = nodes[i + around];
      if (up) {
        positions.push(nodes[i].x, nodes[i].y, nodes[i].z, up.x, up.y, up.z);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return g;
  }, [nodes]);

  const lit = Math.max(3, Math.round((progress / 100) * nodes.length));

  useFrame((_, delta) => {
    if (!group.current) return;
    group.current.rotation.y += Math.min(delta, 0.05) * 0.4;
    group.current.rotation.x = Math.sin(performance.now() / 2800) * 0.08;
  });

  return (
    <group ref={group}>
      <lineSegments geometry={geo}>
        <lineBasicMaterial color="#9a8e88" transparent opacity={0.45} />
      </lineSegments>
      {nodes.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[i < lit ? 0.07 : 0.04, 12, 12]} />
          <meshStandardMaterial
            color={i < lit ? "#0047ab" : "#8b97ad"}
            emissive={i < lit ? "#0047ab" : "#8b97ad"}
            emissiveIntensity={i < lit ? 1.1 : 0.18}
            roughness={0.35}
            metalness={0.2}
          />
        </mesh>
      ))}
    </group>
  );
}

export function ScaffoldGraph() {
  const progress = useForgeStore((s) => s.progress);
  return (
    <div className="relative h-52 w-full overflow-hidden rounded-md bg-inset">
      <Canvas camera={{ position: [0, 0.15, 3.4], fov: 46 }} dpr={[1, 1.75]} gl={{ antialias: true, alpha: false }}>
        <color attach="background" args={["#000000"]} />
        <ambientLight intensity={0.7} />
        <pointLight position={[2.4, 2.2, 3]} intensity={22} color="#0047ab" />
        <pointLight position={[-2, -1.2, 2]} intensity={12} color="#e8eef8" />
        <Lattice progress={progress} />
      </Canvas>
      <div className="pointer-events-none absolute inset-x-0 bottom-2 text-center">
        <p className="text-[11px] tracking-[0.16em] text-subtle uppercase">Scaffold</p>
        <p className="text-sm tabular-nums text-fg">{Math.round(progress)}%</p>
      </div>
    </div>
  );
}
