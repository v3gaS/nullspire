"use client";

import { Suspense, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useGameStore, type WeaponId } from "@/stores/gameStore";
import { useFxStore } from "@/stores/fxStore";

const COLORS: Record<WeaponId, string> = {
  pulse_smg: "#7dffef",
  scatter_carbine: "#ffb347",
  arc_caster: "#60a5fa",
  rail_lance: "#e879f9",
  void_launcher: "#c084fc",
};

const GUN_URL: Record<WeaponId, string> = {
  pulse_smg: "/assets/models/kenney-fps/blaster-repeater.glb",
  scatter_carbine: "/assets/models/kenney-fps/blaster.glb",
  arc_caster: "/assets/models/kenney-fps/blaster.glb",
  rail_lance: "/assets/models/kenney-fps/blaster-repeater.glb",
  void_launcher: "/assets/models/kenney-fps/blaster.glb",
};

function GunModel({ url, color }: { url: string; color: string }) {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh && m.material) {
        const base = Array.isArray(m.material) ? m.material[0] : m.material;
        const mat = (base as THREE.MeshStandardMaterial).clone();
        mat.emissive = new THREE.Color(color);
        mat.emissiveIntensity = 0.55;
        mat.metalness = 0.6;
        mat.roughness = 0.35;
        m.material = mat;
      }
    });
    return c;
  }, [scene, color]);
  // Kenney blasters face +Z in kit — flip and enlarge for FPS hold
  return (
    <primitive
      object={cloned}
      scale={4.2}
      position={[0, -0.05, 0.05]}
      rotation={[0.15, Math.PI, 0]}
    />
  );
}

/** Kenney blaster viewmodel + recoil kick + barrel glow on fire. */
export function WeaponViewmodel() {
  const group = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const active = useGameStore((s) => s.activeWeapon);
  const screen = useGameStore((s) => s.screen);
  const bob = useRef(0);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g || screen !== "playing") return;
    const fx = useFxStore.getState();
    const kicking = performance.now() < fx.muzzleUntil;
    bob.current += dt * 8;
    const kickZ = kicking ? 0.1 : fx.kick * 0.06;
    const kickPitch = kicking ? -0.08 : 0;
    const y = -0.28 + Math.sin(bob.current) * 0.01;
    const x = 0.3 + Math.cos(bob.current * 0.5) * 0.005;
    g.position.set(x, y, -0.55 + kickZ);
    g.rotation.set(0.05 + kickPitch, 0, 0.03);
    camera.add(g);

    if (glowRef.current) {
      glowRef.current.visible = kicking;
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.color.set(fx.muzzleColor);
      glowRef.current.scale.setScalar(kicking ? 1.6 : 1);
    }
  });

  return (
    <group ref={group} userData={{ skipHit: true }}>
      <Suspense
        fallback={
          <mesh position={[0, 0, -0.1]}>
            <boxGeometry args={[0.12, 0.14, 0.5]} />
            <meshStandardMaterial
              color="#334155"
              emissive={COLORS[active]}
              emissiveIntensity={0.8}
              metalness={0.7}
            />
          </mesh>
        }
      >
        <GunModel url={GUN_URL[active]} color={COLORS[active]} />
      </Suspense>
      <mesh ref={glowRef} position={[0, 0.02, -0.72]} visible={false}>
        <sphereGeometry args={[0.09, 10, 10]} />
        <meshBasicMaterial color="#fff" toneMapped={false} />
      </mesh>
    </group>
  );
}

useGLTF.preload("/assets/models/kenney-fps/blaster.glb");
useGLTF.preload("/assets/models/kenney-fps/blaster-repeater.glb");
