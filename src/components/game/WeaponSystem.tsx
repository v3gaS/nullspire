"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useGameStore, type WeaponId } from "@/stores/gameStore";
import { playSfx } from "@/lib/game/audio";

interface Tracer {
  id: number;
  origin: THREE.Vector3;
  end: THREE.Vector3;
  born: number;
  color: string;
}

let tracerId = 0;

function fireInterval(id: WeaponId, overclocked: boolean): number {
  switch (id) {
    case "pulse_smg":
      return overclocked ? 0.045 : 0.09;
    case "scatter_carbine":
      return 0.55;
    case "arc_caster":
      return 0.28;
    case "rail_lance":
      return 0.9;
    case "void_launcher":
      return 1.1;
    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}

function applyHit(obj: THREE.Object3D, damage: number) {
  const mesh = obj as THREE.Mesh;
  if (!mesh.userData?.destructible) return;
  mesh.userData.hp = (mesh.userData.hp ?? 30) - damage;
  const mat = mesh.material;
  if (mat && !Array.isArray(mat) && "emissive" in mat) {
    (mat as THREE.MeshStandardMaterial).emissive = new THREE.Color("#ff4466");
  }
  if (mesh.userData.hp <= 0) {
    mesh.visible = false;
    mesh.userData.dead = true;
    playSfx("/assets/audio/kenney-fps/enemy_destroy.ogg", 0.4);
  } else {
    playSfx("/assets/audio/kenney-fps/enemy_hurt.ogg", 0.3);
  }
}

/** Multi-weapon hitscan + abilities (F). */
export function WeaponSystem() {
  const { camera, scene, gl } = useThree();
  const tracers = useRef<Tracer[]>([]);
  const groupRef = useRef<THREE.Group>(null);
  const fireCooldown = useRef(0);
  const firing = useRef(false);
  const overclockUntil = useRef(0);
  const raycaster = useRef(new THREE.Raycaster());

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      if (useGameStore.getState().screen !== "playing") return;
      if (document.pointerLockElement !== gl.domElement) return;
      firing.current = true;
    };
    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0) firing.current = false;
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "KeyF" && e.code !== "KeyQ") return;
      const state = useGameStore.getState();
      if (state.screen !== "playing") return;

      switch (state.activeWeapon) {
        case "pulse_smg": {
          if (!state.spendNullEnergy(35)) return;
          overclockUntil.current = performance.now() + 3000;
          playSfx("/assets/audio/kenney-fps/weapon_change.ogg", 0.45);
          break;
        }
        case "scatter_carbine": {
          if (!state.spendNullEnergy(40)) return;
          // Shockwave: damage all nearby destructibles
          const origin = camera.position.clone();
          scene.traverse((obj) => {
            if (!obj.userData?.destructible || !obj.visible) return;
            if (obj.position.distanceTo(origin) < 8) {
              applyHit(obj, 40);
            }
          });
          playSfx("/assets/audio/kenney-fps/enemy_destroy.ogg", 0.5);
          break;
        }
        case "arc_caster":
        case "rail_lance":
        case "void_launcher":
          // Implemented as weapons unlock
          break;
        default: {
          const _exhaustive: never = state.activeWeapon;
          return _exhaustive;
        }
      }
    };

    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [gl, camera, scene]);

  useFrame((_, dt) => {
    fireCooldown.current = Math.max(0, fireCooldown.current - dt);
    const state = useGameStore.getState();
    if (state.screen !== "playing") return;

    const overclocked = performance.now() < overclockUntil.current;
    const id = state.activeWeapon;

    if (firing.current && fireCooldown.current <= 0) {
      const weapon = state.weapons[id];
      if (weapon.ammo > 0) {
        fireCooldown.current = fireInterval(id, overclocked);
        useGameStore.setState({
          weapons: {
            ...state.weapons,
            [id]: { ...weapon, ammo: weapon.ammo - 1 },
          },
        });

        const origin = camera.position.clone();
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);

        const shots: { dir: THREE.Vector3; damage: number; color: string }[] =
          [];

        switch (id) {
          case "pulse_smg":
            playSfx("/assets/audio/kenney-fps/blaster_repeater.ogg", 0.22);
            shots.push({
              dir: forward.clone(),
              damage: overclocked ? 18 : 12,
              color: overclocked ? "#ffe066" : "#7dffef",
            });
            break;
          case "scatter_carbine":
            playSfx("/assets/audio/kenney-fps/blaster.ogg", 0.35);
            for (let i = 0; i < 8; i++) {
              const dir = forward.clone();
              dir.x += (Math.random() - 0.5) * 0.25;
              dir.y += (Math.random() - 0.5) * 0.18;
              dir.z += (Math.random() - 0.5) * 0.25;
              dir.normalize();
              shots.push({ dir, damage: 9, color: "#ffb347" });
            }
            break;
          case "arc_caster":
          case "rail_lance":
          case "void_launcher":
            playSfx("/assets/audio/kenney-fps/blaster.ogg", 0.3);
            shots.push({ dir: forward.clone(), damage: 20, color: "#a78bfa" });
            break;
          default: {
            const _exhaustive: never = id;
            return _exhaustive;
          }
        }

        for (const shot of shots) {
          raycaster.current.set(origin, shot.dir);
          const hits = raycaster.current.intersectObjects(scene.children, true);
          const valid = hits.find((h) => h.distance > 1.2);
          const impact = valid
            ? valid.point.clone()
            : origin.clone().add(shot.dir.clone().multiplyScalar(60));
          tracers.current.push({
            id: tracerId++,
            origin: origin.clone().add(shot.dir.clone().multiplyScalar(0.8)),
            end: impact,
            born: performance.now(),
            color: shot.color,
          });
          if (valid?.object) applyHit(valid.object, shot.damage);
        }
      }
    }

    if (Math.random() < dt * 2) {
      const e = useGameStore.getState().nullEnergy;
      if (e < 100) useGameStore.getState().setNullEnergy(Math.min(100, e + 1));
    }

    const now = performance.now();
    tracers.current = tracers.current.filter((t) => now - t.born < 90);

    const group = groupRef.current;
    if (!group) return;
    while (group.children.length) {
      const child = group.children[0];
      group.remove(child);
      if (child instanceof THREE.Line) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    }
    for (const t of tracers.current) {
      const geo = new THREE.BufferGeometry().setFromPoints([t.origin, t.end]);
      const line = new THREE.Line(
        geo,
        new THREE.LineBasicMaterial({
          color: t.color,
          transparent: true,
          opacity: 0.85,
        }),
      );
      group.add(line);
    }
  });

  return <group ref={groupRef} />;
}
