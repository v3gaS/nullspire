"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "@/stores/gameStore";
import { playerPhysics } from "@/lib/game/playerPhysics";
import { playSfx } from "@/lib/game/audio";
import { combatFx } from "@/components/game/CombatVfx";
import { worldPos } from "@/lib/game/math";
import { intersectScene } from "@/lib/game/raycast";

const _losOrigin = new THREE.Vector3();
const _losDir = new THREE.Vector3();
const _tmp = new THREE.Vector3();

function playerHurtAllowed(): boolean {
  const now = performance.now();
  if (now < useGameStore.getState().invulnerableUntil) return false;
  if (now < playerPhysics.spawnGraceUntil) return false;
  return true;
}

function hasLineOfSight(
  from: THREE.Vector3,
  to: THREE.Vector3,
  scene: THREE.Scene,
  raycaster: THREE.Raycaster,
  self: THREE.Object3D,
): boolean {
  _losDir.copy(to).sub(from);
  const dist = _losDir.length();
  if (dist < 0.5) return true;
  _losDir.multiplyScalar(1 / dist);
  raycaster.set(from, _losDir);
  raycaster.far = dist - 0.4;
  const hits = intersectScene(raycaster, scene);
  for (const h of hits) {
    if (h.object === self || h.object.parent === self) continue;
    if (h.object.userData?.destructible) continue;
    if (h.object.userData?.skipHit) continue;
    if (h.distance < dist - 0.5) return false;
  }
  return true;
}

type EnemyKind = "grunt" | "shooter" | "brute";

interface SpawnSpec {
  kind: EnemyKind;
  position: [number, number, number];
}

const WAVE_SPAWNS: SpawnSpec[][] = [
  [
    { kind: "grunt", position: [-8, 0.7, -18] },
    { kind: "grunt", position: [8, 0.7, -20] },
    { kind: "shooter", position: [0, 0.9, -28] },
  ],
  [
    { kind: "grunt", position: [-10, 0.7, -16] },
    { kind: "grunt", position: [10, 0.7, -18] },
    { kind: "shooter", position: [-6, 0.9, -30] },
    { kind: "shooter", position: [6, 0.9, -32] },
  ],
  [
    { kind: "brute", position: [0, 1.1, -26] },
    { kind: "grunt", position: [-12, 0.7, -22] },
    { kind: "grunt", position: [12, 0.7, -22] },
    { kind: "shooter", position: [0, 0.9, -36] },
  ],
];

const KIND_META: Record<
  EnemyKind,
  {
    color: string;
    emissive: string;
    hp: number;
    size: [number, number, number];
    speed: number;
    damage: number;
    range: number;
    melee: boolean;
    label: string;
  }
> = {
  grunt: {
    color: "#f87171",
    emissive: "#dc2626",
    hp: 55,
    size: [1.3, 1.3, 1.3],
    speed: 5.5,
    damage: 8,
    range: 2.8,
    melee: true,
    label: "Grunt",
  },
  shooter: {
    color: "#60a5fa",
    emissive: "#2563eb",
    hp: 45,
    size: [1.1, 1.5, 1.1],
    speed: 3.2,
    damage: 6,
    range: 18,
    melee: false,
    label: "Shooter",
  },
  brute: {
    color: "#fbbf24",
    emissive: "#d97706",
    hp: 140,
    size: [2.0, 2.0, 2.0],
    speed: 4.0,
    damage: 12,
    range: 3.2,
    melee: true,
    label: "Brute",
  },
};

function FairEnemy({
  kind,
  position,
  id,
  onDead,
}: {
  kind: EnemyKind;
  position: [number, number, number];
  id: string;
  onDead: (id: string) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const hp = useRef(KIND_META[kind].hp);
  const dead = useRef(false);
  const cooldown = useRef(1.2 + Math.random());
  const windup = useRef(0);
  const reported = useRef(false);
  const { scene } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const meta = KIND_META[kind];

  useFrame((state, dt) => {
    const mesh = meshRef.current;
    if (!mesh || dead.current) return;
    if (useGameStore.getState().screen !== "playing") return;

    if (typeof mesh.userData.hp === "number") hp.current = mesh.userData.hp;
    mesh.userData.destructible = true;
    mesh.userData.hp = hp.current;
    mesh.userData.kind = kind;

    if (hp.current <= 0) {
      dead.current = true;
      mesh.visible = false;
      if (!reported.current) {
        reported.current = true;
        onDead(id);
      }
      return;
    }

    const cam = state.camera.position;
    const wp = worldPos(mesh, _tmp);
    const dist = cam.distanceTo(wp);
    const mat = mesh.material as THREE.MeshStandardMaterial;

    if (dist > 38) {
      mat.emissiveIntensity = 0.4;
      return;
    }

    mesh.lookAt(cam.x, wp.y, cam.z);
    cooldown.current = Math.max(0, cooldown.current - dt);

    if (meta.melee && dist > meta.range && dist < 28) {
      const dir = _losDir.copy(cam).sub(wp);
      dir.y = 0;
      if (dir.lengthSq() > 0.01) {
        dir.normalize();
        mesh.position.x += dir.x * meta.speed * dt;
        mesh.position.z += dir.z * meta.speed * dt;
      }
    }

    const eye = _losOrigin.set(wp.x, wp.y + 0.5, wp.z);
    const canSee = hasLineOfSight(eye, cam, scene, raycaster.current, mesh);

    if (windup.current > 0) {
      windup.current = Math.max(0, windup.current - dt);
      mat.emissiveIntensity = 1.6 + Math.sin(state.clock.elapsedTime * 16) * 0.5;
      if (!meta.melee && Math.random() < dt * 8) {
        combatFx.pushBeam(eye, cam.clone(), "#fef08a", 0.04);
      }
      if (windup.current <= 0) {
        cooldown.current = meta.melee ? 1.1 : 1.8;
        if (playerHurtAllowed() && canSee) {
          const stillClose =
            cam.distanceTo(worldPos(mesh)) <= meta.range + (meta.melee ? 0.4 : 2);
          if (stillClose || !meta.melee) {
            useGameStore.getState().damagePlayer(meta.damage);
            playSfx("/assets/audio/kenney-fps/enemy_attack.ogg", 0.28);
            combatFx.pushBeam(eye, cam.clone(), meta.emissive, meta.melee ? 0.08 : 0.1);
            combatFx.pushImpact(cam.clone(), meta.emissive);
          }
        }
      }
      return;
    }

    mat.emissiveIntensity = 0.55 + Math.sin(state.clock.elapsedTime * 2) * 0.15;

    if (
      canSee &&
      dist <= meta.range &&
      cooldown.current <= 0 &&
      playerHurtAllowed()
    ) {
      windup.current = meta.melee ? 0.35 : 0.55;
      playSfx("/assets/audio/kenney-fps/weapon_change.ogg", 0.12);
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      userData={{ destructible: true, hp: meta.hp, kind }}
    >
      <boxGeometry args={meta.size} />
      <meshStandardMaterial
        color={meta.color}
        emissive={meta.emissive}
        emissiveIntensity={0.7}
        roughness={0.45}
        metalness={0.2}
      />
    </mesh>
  );
}

function PracticeDummy({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const hp = useRef(80);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    if (typeof mesh.userData.hp === "number") hp.current = mesh.userData.hp;
    mesh.userData.destructible = true;
    mesh.userData.hp = hp.current;
    mesh.userData.kind = "dummy";
    if (hp.current <= 0) {
      hp.current = 80;
      mesh.userData.hp = 80;
      mesh.visible = true;
      combatFx.pushBoom(worldPos(mesh), "#94a3b8", 1.6);
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      userData={{ destructible: true, hp: 80, kind: "dummy" }}
    >
      <boxGeometry args={[1.0, 1.6, 0.7]} />
      <meshStandardMaterial
        color="#cbd5e1"
        emissive="#64748b"
        emissiveIntensity={0.35}
      />
    </mesh>
  );
}

/**
 * Fair wave combat — few bright enemies, LOS required, spawn grace respected.
 * Clear 3 waves → victory.
 */
export function FairEnemies() {
  const [wave, setWave] = useState(0);
  const [waveKey, setWaveKey] = useState(0);
  const alive = useRef(new Set<string>());

  useEffect(() => {
    const specs = WAVE_SPAWNS[0]!;
    alive.current = new Set(specs.map((_, i) => `w0-${i}`));
    useGameStore
      .getState()
      .setObjective(`Wave 1 of 3 — clear hostiles (${specs.length} left)`);
  }, []);

  const onDead = useCallback(
    (id: string) => {
      alive.current.delete(id);
      const left = alive.current.size;
      if (left > 0) {
        useGameStore
          .getState()
          .setObjective(`Wave ${wave + 1} of 3 — ${left} remaining`);
        return;
      }
      const next = wave + 1;
      if (next >= WAVE_SPAWNS.length) {
        useGameStore.getState().setObjective("Arena cleared");
        useGameStore.getState().setScreen("victory");
        playSfx("/assets/audio/kenney-fps/weapon_change.ogg", 0.7);
        return;
      }
      useGameStore.getState().healPlayer(30);
      useGameStore.getState().setArmor(
        Math.min(100, useGameStore.getState().armor + 20),
      );
      useGameStore.getState().setNullEnergy(100);
      useGameStore.setState({
        invulnerableUntil: performance.now() + 2000,
      });
      playerPhysics.beginSpawnGrace(2000);
      useGameStore
        .getState()
        .setObjective(`Wave ${next + 1} inbound — breathe`);
      window.setTimeout(() => {
        const specs = WAVE_SPAWNS[next]!;
        alive.current = new Set(specs.map((_, i) => `w${next}-${i}`));
        setWave(next);
        setWaveKey((k) => k + 1);
        useGameStore
          .getState()
          .setObjective(
            `Wave ${next + 1} of 3 — eliminate hostiles (${specs.length} left)`,
          );
      }, 1800);
    },
    [wave],
  );

  const specs = WAVE_SPAWNS[wave] ?? [];

  return (
    <group>
      <PracticeDummy position={[-3, 0.8, 2]} />
      <PracticeDummy position={[3, 0.8, 2]} />
      <group key={waveKey}>
        {specs.map((s, i) => {
          const id = `w${wave}-${i}`;
          return (
            <FairEnemy
              key={`${waveKey}-${id}`}
              id={id}
              kind={s.kind}
              position={s.position}
              onDead={onDead}
            />
          );
        })}
      </group>
    </group>
  );
}
