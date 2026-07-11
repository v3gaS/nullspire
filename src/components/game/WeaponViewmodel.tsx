"use client";

import { Suspense, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useGameStore, type WeaponId } from "@/stores/gameStore";
import { useFxStore } from "@/stores/fxStore";
import { playerLocomotion } from "@/lib/game/playerLocomotion";

/** Kenney Blaster Kit GLBs — distinct silhouettes per slot. */
const VIEW_URL: Record<WeaponId, string> = {
  pulse_smg: "/assets/models/kenney-blaster/blaster-a.glb",
  scatter_carbine: "/assets/models/kenney-blaster/blaster-f.glb",
  arc_caster: "/assets/models/kenney-blaster/blaster-c.glb",
  rail_lance: "/assets/models/kenney-blaster/blaster-p.glb",
  void_launcher: "/assets/models/kenney-blaster/blaster-r.glb",
};

const ACCENT: Record<WeaponId, string> = {
  pulse_smg: "#7dffef",
  scatter_carbine: "#ff9f43",
  arc_caster: "#60a5fa",
  rail_lance: "#e879f9",
  void_launcher: "#ff7a18",
};

function viewKick(id: WeaponId): number {
  switch (id) {
    case "pulse_smg":
      return 0.22;
    case "scatter_carbine":
      return 0.36;
    case "arc_caster":
      return 0.24;
    case "rail_lance":
      return 0.34;
    case "void_launcher":
      return 0.48;
    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}

function BlasterMesh({ id }: { id: WeaponId }) {
  const { scene } = useGLTF(VIEW_URL[id]);
  const accent = ACCENT[id];
  const cloned = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.frustumCulled = false;
      m.castShadow = false;
      m.receiveShadow = false;
      m.userData.skipHit = true;
    });
    return c;
  }, [scene]);

  return (
    <group
      // Kenney blasters face +Z; FPS camera looks -Z
      rotation={[0.08, Math.PI, 0]}
      position={[0, -0.02, -0.08]}
      scale={1.15}
    >
      <primitive object={cloned} />
      {/* Tiny accent glow so each gun stays readable */}
      <mesh position={[0, 0.04, 0.35]} frustumCulled={false}>
        <boxGeometry args={[0.04, 0.04, 0.12]} />
        <meshBasicMaterial color={accent} toneMapped={false} />
      </mesh>
    </group>
  );
}

/**
 * World-space viewmodel using real Blaster Kit meshes.
 * Follows camera; never parented under Physics.
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
    const reloadDip = reloading ? 0.16 : 0;
    const amp = playerLocomotion.sprinting ? 0.018 : 0.01;
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(
      camera.quaternion,
    );

    const x =
      0.34 +
      (playerLocomotion.moving ? Math.cos(bob.current * 0.5) * amp : 0) +
      (reloading ? Math.sin(performance.now() * 0.02) * 0.04 : 0);
    const y =
      -0.3 +
      (playerLocomotion.moving ? Math.sin(bob.current) * amp * 0.65 : 0) -
      reloadDip;
    const z = 0.52 - kickZ;

    g.position
      .copy(camera.position)
      .addScaledVector(right, x)
      .addScaledVector(up, y)
      .addScaledVector(forward, z);
    g.quaternion.copy(camera.quaternion);
    const kickPitch =
      active === "void_launcher"
        ? 0.28
        : active === "scatter_carbine"
          ? 0.2
          : 0.14;
    g.rotateX(0.04 - fx.kick * kickPitch);
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
      <Suspense fallback={null}>
        <BlasterMesh key={active} id={active} />
      </Suspense>
      <mesh
        ref={glowRef}
        position={[0.02, 0.04, -0.42]}
        visible={false}
        frustumCulled={false}
      >
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshBasicMaterial color="#fff" toneMapped={false} />
      </mesh>
    </group>
  );
}

useGLTF.preload("/assets/models/kenney-blaster/blaster-a.glb");
useGLTF.preload("/assets/models/kenney-blaster/blaster-f.glb");
useGLTF.preload("/assets/models/kenney-blaster/blaster-c.glb");
useGLTF.preload("/assets/models/kenney-blaster/blaster-p.glb");
useGLTF.preload("/assets/models/kenney-blaster/blaster-r.glb");
