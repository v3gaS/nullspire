"use client";

import { Suspense, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useGameStore, type WeaponId } from "@/stores/gameStore";
import { useFxStore } from "@/stores/fxStore";
import { playerLocomotion } from "@/lib/game/playerLocomotion";

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

function viewKick(id: WeaponId): number {
  switch (id) {
    case "pulse_smg":
      return 0.13;
    case "scatter_carbine":
      return 0.24;
    case "arc_caster":
      return 0.15;
    case "rail_lance":
      return 0.22;
    case "void_launcher":
      return 0.28;
    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}

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
      scale={0.15}
      position={[0, -0.01, 0.04]}
      rotation={[0.15, Math.PI, 0]}
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
    if (!g || screen !== "playing") return;
    const fx = useFxStore.getState();
    const kicking = performance.now() < fx.muzzleUntil;
    const bobRate = playerLocomotion.moving
      ? playerLocomotion.sprinting
        ? 14
        : 9
      : 0;
    if (bobRate > 0) bob.current += dt * bobRate;

    const kickZ = kicking ? viewKick(active) : fx.kick * 0.1;
    const reloading = performance.now() < fx.reloadUntil;
    const reloadDip = reloading ? 0.14 : 0;
    const amp = playerLocomotion.sprinting ? 0.014 : 0.008;
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(
      camera.quaternion,
    );

    const x =
      0.26 +
      (playerLocomotion.moving ? Math.cos(bob.current * 0.5) * amp : 0) +
      (reloading ? Math.sin(performance.now() * 0.02) * 0.04 : 0);
    const y =
      -0.24 +
      (playerLocomotion.moving ? Math.sin(bob.current) * amp * 0.6 : 0) -
      reloadDip;
    const z = 0.55 - kickZ;

    g.position
      .copy(camera.position)
      .addScaledVector(right, x)
      .addScaledVector(up, y)
      .addScaledVector(forward, z);
    g.quaternion.copy(camera.quaternion);
    g.rotateX(0.05 - fx.kick * 0.15);
    g.rotateY(0.08);

    if (glowRef.current) {
      glowRef.current.visible = kicking;
      (glowRef.current.material as THREE.MeshBasicMaterial).color.set(
        fx.muzzleColor,
      );
    }
  });

  return (
    <group ref={group} userData={{ skipHit: true }}>
      {/* Always-on silhouette so a gun is visible even while GLB streams */}
      <mesh position={[0.03, -0.03, -0.04]} frustumCulled={false}>
        <boxGeometry args={[0.1, 0.11, 0.38]} />
        <meshStandardMaterial
          color="#1e293b"
          emissive={COLORS[active]}
          emissiveIntensity={0.9}
          metalness={0.8}
          roughness={0.25}
        />
      </mesh>
      <mesh position={[0.03, 0.015, -0.28]} frustumCulled={false}>
        <boxGeometry args={[0.055, 0.055, 0.2]} />
        <meshStandardMaterial
          color={COLORS[active]}
          emissive={COLORS[active]}
          emissiveIntensity={1.6}
        />
      </mesh>
      <Suspense fallback={null}>
        <group position={[0, 0, 0.02]}>
          <GunModel url={GUN_URL[active]} color={COLORS[active]} />
        </group>
      </Suspense>
      <mesh
        ref={glowRef}
        position={[0, 0.03, -0.4]}
        visible={false}
        frustumCulled={false}
      >
        <sphereGeometry args={[0.08, 10, 10]} />
        <meshBasicMaterial color="#fff" toneMapped={false} />
      </mesh>
    </group>
  );
}

useGLTF.preload("/assets/models/kenney-fps/blaster.glb");
useGLTF.preload("/assets/models/kenney-fps/blaster-repeater.glb");
