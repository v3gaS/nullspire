"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore, type WeaponId } from "@/stores/gameStore";
import { useFxStore } from "@/stores/fxStore";
import { playerLocomotion } from "@/lib/game/playerLocomotion";

/** Industrial Quake/UT palette — orange/grey body + weapon accent. */
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
      return 0.16;
    case "scatter_carbine":
      return 0.28;
    case "arc_caster":
      return 0.18;
    case "rail_lance":
      return 0.26;
    case "void_launcher":
      return 0.34;
    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}

function Mat({
  color,
  emissive,
  emissiveIntensity = 0.35,
  metalness = 0.65,
  roughness = 0.38,
}: {
  color: string;
  emissive?: string;
  emissiveIntensity?: number;
  metalness?: number;
  roughness?: number;
}) {
  return (
    <meshStandardMaterial
      color={color}
      emissive={emissive ?? color}
      emissiveIntensity={emissiveIntensity}
      metalness={metalness}
      roughness={roughness}
    />
  );
}

/** Chunky low-poly industrial silhouettes — fill lower-right like classic FPS. */
function ChunkyGun({ id }: { id: WeaponId }) {
  const accent = ACCENT[id];
  switch (id) {
    case "pulse_smg":
      return (
        <group>
          <mesh position={[0.02, -0.02, 0.02]} frustumCulled={false}>
            <boxGeometry args={[0.14, 0.16, 0.52]} />
            <Mat color="#4a5563" emissive="#1e293b" emissiveIntensity={0.15} />
          </mesh>
          <mesh position={[0.02, 0.04, -0.22]} frustumCulled={false}>
            <boxGeometry args={[0.1, 0.1, 0.28]} />
            <Mat color="#6b7280" emissive="#374151" emissiveIntensity={0.2} />
          </mesh>
          <mesh position={[0.02, 0.02, -0.42]} frustumCulled={false}>
            <boxGeometry args={[0.06, 0.06, 0.22]} />
            <Mat color={accent} emissive={accent} emissiveIntensity={1.4} />
          </mesh>
          <mesh position={[0.02, -0.14, 0.08]} frustumCulled={false}>
            <boxGeometry args={[0.07, 0.16, 0.12]} />
            <Mat color="#2d3748" emissive="#111827" emissiveIntensity={0.1} />
          </mesh>
          <mesh position={[0.02, 0.12, 0.05]} frustumCulled={false}>
            <boxGeometry args={[0.05, 0.06, 0.18]} />
            <Mat color={accent} emissive={accent} emissiveIntensity={0.9} />
          </mesh>
        </group>
      );
    case "scatter_carbine":
      return (
        <group>
          <mesh position={[0.02, -0.01, 0]} frustumCulled={false}>
            <boxGeometry args={[0.18, 0.18, 0.48]} />
            <Mat color="#5a6472" emissive="#1f2937" emissiveIntensity={0.12} />
          </mesh>
          <mesh position={[0.02, 0.02, -0.32]} frustumCulled={false}>
            <boxGeometry args={[0.22, 0.14, 0.2]} />
            <Mat color="#9ca3af" emissive="#4b5563" emissiveIntensity={0.2} />
          </mesh>
          <mesh position={[0.02, 0.02, -0.48]} frustumCulled={false}>
            <cylinderGeometry args={[0.07, 0.09, 0.16, 8]} />
            <Mat color={accent} emissive={accent} emissiveIntensity={1.2} />
          </mesh>
          <mesh position={[0.02, -0.16, 0.06]} frustumCulled={false}>
            <boxGeometry args={[0.08, 0.18, 0.14]} />
            <Mat color="#1f2937" emissive="#0f172a" emissiveIntensity={0.1} />
          </mesh>
          <mesh position={[0.02, 0.14, -0.05]} frustumCulled={false}>
            <boxGeometry args={[0.06, 0.08, 0.22]} />
            <Mat color="#d1d5db" emissive="#6b7280" emissiveIntensity={0.25} />
          </mesh>
        </group>
      );
    case "arc_caster":
      return (
        <group>
          <mesh position={[0.02, 0, 0]} frustumCulled={false}>
            <boxGeometry args={[0.15, 0.2, 0.42]} />
            <Mat color="#3d4a5c" emissive="#1e293b" emissiveIntensity={0.15} />
          </mesh>
          <mesh position={[0.02, 0.06, -0.28]} frustumCulled={false}>
            <boxGeometry args={[0.12, 0.12, 0.32]} />
            <Mat color="#64748b" emissive="#334155" emissiveIntensity={0.2} />
          </mesh>
          <mesh position={[0.02, 0.06, -0.5]} frustumCulled={false}>
            <boxGeometry args={[0.05, 0.05, 0.18]} />
            <Mat color={accent} emissive={accent} emissiveIntensity={1.6} />
          </mesh>
          <mesh position={[0.12, 0.08, -0.1]} frustumCulled={false}>
            <boxGeometry args={[0.08, 0.08, 0.2]} />
            <Mat color={accent} emissive={accent} emissiveIntensity={1.1} />
          </mesh>
          <mesh position={[0.02, -0.15, 0.05]} frustumCulled={false}>
            <boxGeometry args={[0.07, 0.16, 0.12]} />
            <Mat color="#1e293b" emissive="#0f172a" emissiveIntensity={0.1} />
          </mesh>
        </group>
      );
    case "rail_lance":
      return (
        <group>
          <mesh position={[0.02, 0.02, -0.05]} frustumCulled={false}>
            <boxGeometry args={[0.12, 0.14, 0.7]} />
            <Mat color="#4b5563" emissive="#1f2937" emissiveIntensity={0.12} />
          </mesh>
          <mesh position={[0.02, 0.02, -0.48]} frustumCulled={false}>
            <boxGeometry args={[0.07, 0.07, 0.36]} />
            <Mat color={accent} emissive={accent} emissiveIntensity={1.5} />
          </mesh>
          <mesh position={[0.02, 0.12, 0.1]} frustumCulled={false}>
            <boxGeometry args={[0.1, 0.1, 0.22]} />
            <Mat color="#9ca3af" emissive="#6b7280" emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[0.02, -0.14, 0.12]} frustumCulled={false}>
            <boxGeometry args={[0.07, 0.16, 0.14]} />
            <Mat color="#111827" emissive="#020617" emissiveIntensity={0.08} />
          </mesh>
          <mesh position={[0.02, 0.02, 0.28]} frustumCulled={false}>
            <boxGeometry args={[0.14, 0.16, 0.16]} />
            <Mat color="#374151" emissive="#1f2937" emissiveIntensity={0.15} />
          </mesh>
        </group>
      );
    case "void_launcher":
      return (
        <group>
          {/* Quake-style chunky RL: orange tube + grey body */}
          <mesh position={[0.02, 0.02, 0.02]} frustumCulled={false}>
            <boxGeometry args={[0.2, 0.22, 0.46]} />
            <Mat color="#6b7280" emissive="#374151" emissiveIntensity={0.18} />
          </mesh>
          <mesh
            position={[0.02, 0.04, -0.28]}
            rotation={[Math.PI / 2, 0, 0]}
            frustumCulled={false}
          >
            <cylinderGeometry args={[0.11, 0.13, 0.42, 10]} />
            <Mat color="#ff7a18" emissive="#ff7a18" emissiveIntensity={0.85} />
          </mesh>
          <mesh
            position={[0.02, 0.04, -0.52]}
            rotation={[Math.PI / 2, 0, 0]}
            frustumCulled={false}
          >
            <cylinderGeometry args={[0.14, 0.12, 0.1, 10]} />
            <Mat color="#e5e7eb" emissive="#9ca3af" emissiveIntensity={0.35} />
          </mesh>
          <mesh position={[0.02, -0.16, 0.08]} frustumCulled={false}>
            <boxGeometry args={[0.09, 0.2, 0.16]} />
            <Mat color="#1f2937" emissive="#0f172a" emissiveIntensity={0.1} />
          </mesh>
          <mesh position={[0.02, 0.18, 0.05]} frustumCulled={false}>
            <boxGeometry args={[0.08, 0.08, 0.2]} />
            <Mat color="#9ca3af" emissive="#6b7280" emissiveIntensity={0.25} />
          </mesh>
          <mesh position={[0.14, 0.02, 0.05]} frustumCulled={false}>
            <boxGeometry args={[0.08, 0.1, 0.18]} />
            <Mat color="#ff9f43" emissive="#ff7a18" emissiveIntensity={0.7} />
          </mesh>
        </group>
      );
    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}

/**
 * Chunky industrial viewmodel — world-space follow (not camera.add)
 * so R3F cannot detach the mesh. Sized to fill lower-right like Quake/UT.
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

    const kickZ = kicking ? viewKick(active) : fx.kick * 0.12;
    const reloading = performance.now() < fx.reloadUntil;
    const reloadDip = reloading ? 0.18 : 0;
    const amp = playerLocomotion.sprinting ? 0.016 : 0.009;
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(
      camera.quaternion,
    );

    // Bigger, closer, more lower-right presence
    const x =
      0.32 +
      (playerLocomotion.moving ? Math.cos(bob.current * 0.5) * amp : 0) +
      (reloading ? Math.sin(performance.now() * 0.02) * 0.045 : 0);
    const y =
      -0.28 +
      (playerLocomotion.moving ? Math.sin(bob.current) * amp * 0.6 : 0) -
      reloadDip;
    const z = 0.62 - kickZ;

    g.position
      .copy(camera.position)
      .addScaledVector(right, x)
      .addScaledVector(up, y)
      .addScaledVector(forward, z);
    g.quaternion.copy(camera.quaternion);
    g.rotateX(0.06 - fx.kick * 0.18);
    g.rotateY(0.1);

    if (glowRef.current) {
      glowRef.current.visible = kicking;
      (glowRef.current.material as THREE.MeshBasicMaterial).color.set(
        fx.muzzleColor,
      );
    }
  });

  return (
    <group ref={group} userData={{ skipHit: true }} scale={1.15}>
      <ChunkyGun id={active} />
      <mesh
        ref={glowRef}
        position={[0.02, 0.04, -0.58]}
        visible={false}
        frustumCulled={false}
      >
        <sphereGeometry args={[0.12, 10, 10]} />
        <meshBasicMaterial color="#fff" toneMapped={false} />
      </mesh>
    </group>
  );
}
