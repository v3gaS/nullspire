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
        mat.emissiveIntensity = 0.7;
        mat.metalness = 0.55;
        mat.roughness = 0.35;
        m.material = mat;
        m.frustumCulled = false;
      }
    });
    return c;
  }, [scene, color]);
  return (
    <primitive
      object={cloned}
      scale={5}
      position={[0, -0.02, 0]}
      rotation={[0.2, Math.PI, 0]}
    />
  );
}

/**
 * Kenney blaster viewmodel.
 * World-space follow (not camera.add) so R3F cannot detach the mesh.
 */
export function WeaponViewmodel() {
  const group = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const active = useGameStore((s) => s.activeWeapon);
  const screen = useGameStore((s) => s.screen);
  const bob = useRef(0);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g || screen !== "playing") {
      if (g) g.visible = false;
      return;
    }
    g.visible = true;
    const fx = useFxStore.getState();
    const kicking = performance.now() < fx.muzzleUntil;
    bob.current += dt * 8;

    const kickZ = kicking ? 0.12 : fx.kick * 0.07;
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(
      camera.quaternion,
    );

    const x = 0.28 + Math.cos(bob.current * 0.5) * 0.004;
    const y = -0.22 + Math.sin(bob.current) * 0.008;
    const z = -0.48 + kickZ;

    g.position
      .copy(camera.position)
      .addScaledVector(right, x)
      .addScaledVector(up, y)
      .addScaledVector(forward, -z);
    g.quaternion.copy(camera.quaternion);
    g.rotateX(kicking ? -0.1 : 0.05);
    g.rotateY(0.08);

    if (glowRef.current) {
      glowRef.current.visible = kicking;
      (glowRef.current.material as THREE.MeshBasicMaterial).color.set(
        fx.muzzleColor,
      );
    }
  });

  return (
    <group ref={group} userData={{ skipHit: true }} visible={false}>
      <Suspense
        fallback={
          <mesh position={[0, 0, -0.15]} frustumCulled={false}>
            <boxGeometry args={[0.14, 0.16, 0.55]} />
            <meshStandardMaterial
              color="#475569"
              emissive={COLORS[active]}
              emissiveIntensity={1.2}
              metalness={0.7}
            />
          </mesh>
        }
      >
        <GunModel url={GUN_URL[active]} color={COLORS[active]} />
      </Suspense>
      <mesh
        ref={glowRef}
        position={[0, 0.04, -0.85]}
        visible={false}
        frustumCulled={false}
      >
        <sphereGeometry args={[0.1, 10, 10]} />
        <meshBasicMaterial color="#fff" toneMapped={false} />
      </mesh>
    </group>
  );
}

useGLTF.preload("/assets/models/kenney-fps/blaster.glb");
useGLTF.preload("/assets/models/kenney-fps/blaster-repeater.glb");
