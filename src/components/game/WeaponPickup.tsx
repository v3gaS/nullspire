"use client";

import { Suspense, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useGameStore, type WeaponId } from "@/stores/gameStore";
import { playSfx } from "@/lib/game/audio";
import { WEAPON_META } from "@/lib/game/constants";

const PICKUP_COLOR: Record<WeaponId, string> = {
  pulse_smg: "#7dffef",
  scatter_carbine: "#ffb347",
  arc_caster: "#60a5fa",
  rail_lance: "#e879f9",
  void_launcher: "#c084fc",
};

const PICKUP_URL: Record<WeaponId, string> = {
  pulse_smg: "/assets/models/kenney-fps/blaster-repeater.glb",
  scatter_carbine: "/assets/models/kenney-fps/blaster.glb",
  arc_caster: "/assets/models/kenney-fps/blaster.glb",
  rail_lance: "/assets/models/kenney-fps/blaster-repeater.glb",
  void_launcher: "/assets/models/kenney-fps/blaster.glb",
};

function PickupModel({ id }: { id: WeaponId }) {
  const { scene } = useGLTF(PICKUP_URL[id]);
  const color = PICKUP_COLOR[id];
  const cloned = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh && m.material) {
        const base = Array.isArray(m.material) ? m.material[0] : m.material;
        const mat = (base as THREE.MeshStandardMaterial).clone();
        mat.emissive = new THREE.Color(color);
        mat.emissiveIntensity = 0.85;
        mat.metalness = 0.55;
        mat.roughness = 0.3;
        m.material = mat;
      }
    });
    return c;
  }, [scene, color]);
  return (
    <primitive object={cloned} scale={4} rotation={[0.3, 0, 0.2]} />
  );
}

export function WeaponPickup({
  id,
  position,
}: {
  id: WeaponId;
  position: [number, number, number];
}) {
  const groupRef = useRef<THREE.Group>(null);
  const taken = useRef(false);
  const color = PICKUP_COLOR[id];

  useFrame((state) => {
    const g = groupRef.current;
    if (!g || taken.current) return;
    g.rotation.y += 0.025;
    g.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.15;

    const dist = state.camera.position.distanceTo(g.position);
    if (dist < 1.8) {
      const s = useGameStore.getState();
      if (!s.weapons[id].unlocked) {
        useGameStore.setState({
          weapons: {
            ...s.weapons,
            [id]: { ...s.weapons[id], unlocked: true },
          },
          activeWeapon: id,
          objective: `Acquired ${WEAPON_META[id].name}`,
        });
        playSfx("/assets/audio/kenney-fps/weapon_change.ogg", 0.5);
      }
      taken.current = true;
      g.visible = false;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <Suspense
        fallback={
          <mesh castShadow>
            <boxGeometry args={[0.5, 0.35, 1.1]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.8}
              metalness={0.6}
              roughness={0.3}
            />
          </mesh>
        }
      >
        <PickupModel id={id} />
      </Suspense>
      <pointLight color={color} intensity={1.4} distance={6} />
    </group>
  );
}

useGLTF.preload("/assets/models/kenney-fps/blaster.glb");
useGLTF.preload("/assets/models/kenney-fps/blaster-repeater.glb");
