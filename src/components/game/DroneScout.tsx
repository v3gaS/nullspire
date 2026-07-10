"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useGameStore } from "@/stores/gameStore";
import { playSfx } from "@/lib/game/audio";

interface DroneProps {
  position: [number, number, number];
  id: string;
}

/** Simple aggro drone — orbits then fires damage pulses at the player. */
export function DroneScout({ position, id }: DroneProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const hp = useRef(50);
  const cooldown = useRef(0);
  const origin = useRef(new THREE.Vector3(...position));
  const dead = useRef(false);

  useFrame((state, dt) => {
    const mesh = meshRef.current;
    if (!mesh || dead.current) return;
    if (useGameStore.getState().screen !== "playing") return;

    const t = state.clock.elapsedTime;
    const cam = state.camera.position;
    const dist = cam.distanceTo(mesh.position);

    mesh.position.x = origin.current.x + Math.sin(t + id.length) * 2.5;
    mesh.position.y = origin.current.y + Math.sin(t * 1.4) * 0.4;
    mesh.position.z = origin.current.z + Math.cos(t * 0.7 + id.length) * 2.5;
    mesh.lookAt(cam);

    cooldown.current = Math.max(0, cooldown.current - dt);
    // Nerf: shorter range, less damage, longer CD
    if (dist < 16 && cooldown.current <= 0) {
      cooldown.current = 2.2;
      useGameStore.getState().damagePlayer(4);
      playSfx("/assets/audio/kenney-fps/enemy_attack.ogg", 0.2);
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.emissive = new THREE.Color("#ff3344");
    }

    mesh.userData.destructible = true;
    if (typeof mesh.userData.hp === "number") hp.current = mesh.userData.hp;
    mesh.userData.hp = hp.current;
    if (hp.current <= 0) {
      dead.current = true;
      mesh.visible = false;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      castShadow
      userData={{ destructible: true, hp: 50, kind: "drone", id }}
    >
      <icosahedronGeometry args={[0.7, 0]} />
      <meshStandardMaterial
        color="#6ecbff"
        emissive="#123a55"
        emissiveIntensity={0.6}
        metalness={0.7}
        roughness={0.25}
      />
    </mesh>
  );
}

export function DroneSquad() {
  return (
    <group>
      <DroneScout id="d1" position={[4, 3, -6]} />
      <DroneScout id="d2" position={[-8, 3.5, -12]} />
      <DroneScout id="d3" position={[14, 4, -18]} />
    </group>
  );
}
