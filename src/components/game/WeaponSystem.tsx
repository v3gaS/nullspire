"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useGameStore, type WeaponId } from "@/stores/gameStore";
import { playSfx } from "@/lib/game/audio";
import { useFxStore } from "@/stores/fxStore";
import { combatFx } from "@/components/game/CombatVfx";
import { worldPos } from "@/lib/game/math";

interface StormNest {
  id: number;
  pos: THREE.Vector3;
  until: number;
}

interface Singularity {
  id: number;
  pos: THREE.Vector3;
  until: number;
  detonated: boolean;
}

let nestId = 0;
let singId = 0;

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

export function applyHit(obj: THREE.Object3D, damage: number) {
  const mesh = obj as THREE.Mesh;
  if (!mesh.userData?.destructible || !mesh.visible) return false;
  mesh.userData.hp = (mesh.userData.hp ?? 30) - damage;
  useFxStore.getState().pulseHit();
  useFxStore.getState().pushDamage(Math.round(damage));
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
  return true;
}

function collectDestructibles(scene: THREE.Scene): THREE.Object3D[] {
  const out: THREE.Object3D[] = [];
  scene.traverse((obj) => {
    if (obj.userData?.destructible && obj.visible) out.push(obj);
  });
  return out;
}

/** Multi-weapon combat + unique abilities (F). */
export function WeaponSystem() {
  const { camera, scene, gl } = useThree();
  const nests = useRef<StormNest[]>([]);
  const singularities = useRef<Singularity[]>([]);
  const marked = useRef<THREE.Object3D | null>(null);
  const fxRef = useRef<THREE.Group>(null);
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
      const origin = camera.position.clone();
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);

      switch (state.activeWeapon) {
        case "pulse_smg": {
          if (!state.spendNullEnergy(35)) return;
          overclockUntil.current = performance.now() + 3000;
          playSfx("/assets/audio/kenney-fps/weapon_change.ogg", 0.45);
          break;
        }
        case "scatter_carbine": {
          if (!state.spendNullEnergy(40)) return;
          for (const obj of collectDestructibles(scene)) {
            if (obj.position.distanceTo(origin) < 8) applyHit(obj, 40);
          }
          playSfx("/assets/audio/kenney-fps/enemy_destroy.ogg", 0.5);
          break;
        }
        case "arc_caster": {
          if (!state.spendNullEnergy(45)) return;
          const pos = origin.clone().add(forward.clone().multiplyScalar(6));
          pos.y = Math.max(0.5, pos.y - 0.5);
          nests.current.push({
            id: nestId++,
            pos,
            until: performance.now() + 5000,
          });
          playSfx("/assets/audio/kenney-fps/weapon_change.ogg", 0.5);
          break;
        }
        case "rail_lance": {
          if (!state.spendNullEnergy(30)) return;
          raycaster.current.set(origin, forward);
          const hits = raycaster.current.intersectObjects(scene.children, true);
          const valid = hits.find(
            (h) => h.distance > 1.2 && h.object.userData?.destructible,
          );
          if (valid) {
            marked.current = valid.object;
            valid.object.userData.marked = true;
            playSfx("/assets/audio/kenney-fps/weapon_change.ogg", 0.45);
          }
          break;
        }
        case "void_launcher": {
          if (!state.spendNullEnergy(50)) return;
          const pos = origin.clone().add(forward.clone().multiplyScalar(10));
          singularities.current.push({
            id: singId++,
            pos,
            until: performance.now() + 1800,
            detonated: false,
          });
          playSfx("/assets/audio/kenney-fps/enemy_attack.ogg", 0.4);
          break;
        }
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
    const now = performance.now();

    // Storm Nest ticks
    for (const nest of nests.current) {
      if (now > nest.until) continue;
      for (const obj of collectDestructibles(scene)) {
        if (obj.position.distanceTo(nest.pos) < 5 && Math.random() < dt * 4) {
          applyHit(obj, 6);
        }
      }
    }
    nests.current = nests.current.filter((n) => now < n.until);

    // Singularity pull then boom
    for (const s of singularities.current) {
      if (!s.detonated && now < s.until) {
        for (const obj of collectDestructibles(scene)) {
          const to = new THREE.Vector3().subVectors(s.pos, obj.position);
          if (to.length() < 12) {
            obj.position.add(to.normalize().multiplyScalar(dt * 6));
          }
        }
      }
      if (!s.detonated && now >= s.until) {
        s.detonated = true;
        for (const obj of collectDestructibles(scene)) {
          if (obj.position.distanceTo(s.pos) < 9) applyHit(obj, 55);
        }
        playSfx("/assets/audio/kenney-fps/enemy_destroy.ogg", 0.55);
      }
    }
    singularities.current = singularities.current.filter(
      (s) => now < s.until + 400,
    );

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
            useFxStore.getState().pulseMuzzle(overclocked ? "#ffe066" : "#7dffef", 55);
            shots.push({
              dir: forward.clone(),
              damage: overclocked ? 18 : 12,
              color: overclocked ? "#ffe066" : "#7dffef",
            });
            break;
          case "scatter_carbine":
            playSfx("/assets/audio/kenney-fps/blaster.ogg", 0.35);
            useFxStore.getState().pulseMuzzle("#ffb347", 90);
            for (let i = 0; i < 8; i++) {
              const dir = forward.clone();
              dir.x += (Math.random() - 0.5) * 0.25;
              dir.y += (Math.random() - 0.5) * 0.18;
              dir.z += (Math.random() - 0.5) * 0.25;
              dir.normalize();
              shots.push({ dir, damage: 9, color: "#ffb347" });
            }
            break;
          case "arc_caster": {
            playSfx("/assets/audio/kenney-fps/blaster.ogg", 0.28);
            useFxStore.getState().pulseMuzzle("#60a5fa", 80);
            shots.push({ dir: forward.clone(), damage: 14, color: "#60a5fa" });
            break;
          }
          case "rail_lance":
            playSfx("/assets/audio/kenney-fps/blaster.ogg", 0.4);
            useFxStore.getState().pulseMuzzle("#e879f9", 120);
            shots.push({ dir: forward.clone(), damage: 45, color: "#e879f9" });
            break;
          case "void_launcher":
            playSfx("/assets/audio/kenney-fps/blaster.ogg", 0.35);
            useFxStore.getState().pulseMuzzle("#c084fc", 110);
            shots.push({ dir: forward.clone(), damage: 30, color: "#c084fc" });
            break;
          default: {
            const _exhaustive: never = id;
            return _exhaustive;
          }
        }

        const muzzle = origin
          .clone()
          .add(forward.clone().multiplyScalar(0.85))
          .add(
            new THREE.Vector3(0.22, -0.12, 0).applyQuaternion(camera.quaternion),
          );

        for (const shot of shots) {
          raycaster.current.set(origin, shot.dir);
          const hits = raycaster.current.intersectObjects(scene.children, true);
          // Prefer destructibles; skip decorative dressing that would eat shots.
          const valid =
            hits.find(
              (h) =>
                h.distance > 1.2 &&
                (h.object as THREE.Object3D).userData?.destructible,
            ) ??
            hits.find(
              (h) =>
                h.distance > 1.2 &&
                !(h.object as THREE.Object3D).userData?.skipHit,
            );
          const impact = valid
            ? valid.point.clone()
            : origin.clone().add(shot.dir.clone().multiplyScalar(80));

          const beamWidth =
            id === "rail_lance" ? 0.18 : id === "scatter_carbine" ? 0.06 : 0.11;
          combatFx.pushBeam(muzzle, impact, shot.color, beamWidth);
          combatFx.pushImpact(impact, shot.color);

          if (valid?.object?.userData?.destructible) {
            let dmg = shot.damage;
            if (
              valid.object.userData.marked ||
              marked.current === valid.object
            ) {
              dmg = Math.round(dmg * 1.5);
            }
            applyHit(valid.object, dmg);

            if (id === "arc_caster") {
              const primary = worldPos(valid.object).clone();
              let chained = 0;
              for (const obj of collectDestructibles(scene)) {
                if (obj === valid.object) continue;
                const op = worldPos(obj);
                if (op.distanceTo(primary) < 7 && chained < 3) {
                  applyHit(obj, 10);
                  combatFx.pushBeam(primary, op, "#93c5fd", 0.05);
                  combatFx.pushImpact(op, "#93c5fd");
                  chained++;
                }
              }
            }

            if (id === "void_launcher") {
              for (const obj of collectDestructibles(scene)) {
                if (worldPos(obj).distanceTo(impact) < 5) applyHit(obj, 18);
              }
              combatFx.pushImpact(impact, "#c084fc");
            }
          }
        }
      }
    }

    if (Math.random() < dt * 2) {
      const e = useGameStore.getState().nullEnergy;
      if (e < 100) useGameStore.getState().setNullEnergy(Math.min(100, e + 1));
    }

    const fx = fxRef.current;
    if (fx) {
      while (fx.children.length) {
        const child = fx.children[0];
        fx.remove(child);
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
      }
      for (const nest of nests.current) {
        const mesh = new THREE.Mesh(
          new THREE.CylinderGeometry(4.5, 4.5, 0.15, 24),
          new THREE.MeshStandardMaterial({
            color: "#60a5fa",
            emissive: "#2563eb",
            emissiveIntensity: 1.2,
            transparent: true,
            opacity: 0.45,
          }),
        );
        mesh.position.copy(nest.pos);
        fx.add(mesh);
      }
      for (const s of singularities.current) {
        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(s.detonated ? 2.2 : 0.7, 16, 16),
          new THREE.MeshStandardMaterial({
            color: "#c084fc",
            emissive: "#7c3aed",
            emissiveIntensity: 2,
            transparent: true,
            opacity: s.detonated ? 0.35 : 0.9,
          }),
        );
        mesh.position.copy(s.pos);
        fx.add(mesh);
      }
    }
  });

  return <group ref={fxRef} />;
}
