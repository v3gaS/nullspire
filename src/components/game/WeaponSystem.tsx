"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useGameStore, type WeaponId } from "@/stores/gameStore";
import { playSfx } from "@/lib/game/audio";
import { useFxStore } from "@/stores/fxStore";
import { combatFx } from "@/components/game/CombatVfx";
import { worldPos } from "@/lib/game/math";
import { intersectScene } from "@/lib/game/raycast";
import {
  impulseRigid,
  playerPhysics,
  staggerObject,
} from "@/lib/game/playerPhysics";

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

function fragName(kind: unknown): string {
  if (typeof kind !== "string" || !kind) return "hostile";
  switch (kind) {
    case "drone":
      return "Drone";
    case "bastion":
      return "Bastion";
    case "stalker":
      return "Stalker";
    case "spitter":
      return "Spitter";
    case "turret":
      return "Turret";
    case "skitter":
      return "Skitter";
    case "elite":
      return "Elite";
    case "boss_aegis":
      return "Aegis Warden";
    case "boss_bloom":
      return "Bloom Matriarch";
    case "boss_primarch":
      return "Nullspire Primarch";
    case "bloom_sac":
      return "Bloom Sac";
    case "dummy":
      return "Dummy";
    default:
      return kind.replace(/_/g, " ");
  }
}

function fireInterval(id: WeaponId, overclocked: boolean): number {
  switch (id) {
    case "pulse_smg":
      return overclocked ? 0.032 : 0.07;
    case "scatter_carbine":
      return 0.42;
    case "arc_caster":
      return 0.2;
    case "rail_lance":
      return 0.7;
    case "void_launcher":
      return 0.66;
    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}

function magSize(id: WeaponId): number {
  switch (id) {
    case "pulse_smg":
      return 35;
    case "scatter_carbine":
      return 9;
    case "arc_caster":
      return 14;
    case "rail_lance":
      return 6;
    case "void_launcher":
      return 5;
    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}

export function applyHit(
  obj: THREE.Object3D,
  damage: number,
  from?: THREE.Vector3,
) {
  const mesh = obj as THREE.Mesh;
  if (!mesh.userData?.destructible || !mesh.visible) return false;
  mesh.userData.hp = (mesh.userData.hp ?? 30) - damage;
  useFxStore.getState().pulseHit();
  useFxStore.getState().pushDamage(Math.round(damage));

  if (from) {
    const dir = worldPos(mesh).clone().sub(from);
    if (!impulseRigid(mesh, dir, 6 + damage * 0.22)) {
      staggerObject(mesh, from, 0.45 + Math.min(1.1, damage * 0.025));
    }
  }

  const mat = mesh.material;
  if (mat && !Array.isArray(mat) && "emissive" in mat) {
    const std = mat as THREE.MeshStandardMaterial;
    const prev = std.emissive.clone();
    std.emissive = new THREE.Color("#ff4466");
    window.setTimeout(() => {
      if (!mesh.userData?.dead) std.emissive.copy(prev);
    }, 90);
  }
  if (mesh.userData.hp <= 0) {
    if (mesh.userData.kind === "debris" && mesh.userData.rigidBody) {
      impulseRigid(
        mesh,
        from ? worldPos(mesh).clone().sub(from) : new THREE.Vector3(0, 1, 0),
        12,
      );
      mesh.userData.hp = 1;
      mesh.userData.destructible = false;
    } else if (mesh.userData.kind === "barrel") {
      // Barrel death handled by ExplosiveBarrels tick
      mesh.userData.hp = 0;
    } else {
      // Quake-ish gib spray — orange/white chunk debris
      const wp = worldPos(mesh);
      for (let i = 0; i < 18; i++) {
        const gib = wp
          .clone()
          .add(
            new THREE.Vector3(
              (Math.random() - 0.5) * 4.0,
              Math.random() * 2.8,
              (Math.random() - 0.5) * 4.0,
            ),
          );
        const gibColor =
          i % 3 === 0 ? "#ff7a18" : i % 3 === 1 ? "#f8fafc" : "#ff4466";
        combatFx.pushImpact(gib, gibColor);
      }
      combatFx.pushBoom(wp, "#ff6644", 4.0);
      combatFx.pushBoom(wp.clone().add(new THREE.Vector3(0, 0.45, 0)), "#ff9f43", 2.0);
      combatFx.pushBoom(wp.clone().add(new THREE.Vector3(0, 0.15, 0)), "#ffffff", 1.0);
      mesh.visible = false;
      mesh.userData.dead = true;
      playSfx("/assets/audio/kenney-fps/enemy_destroy.ogg", 0.55);
      useFxStore.getState().pulseKill(fragName(mesh.userData.kind));
      useGameStore.getState().addFrag();
      useFxStore.getState().pulseShake(0.17, 210);
    }
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
          overclockUntil.current = performance.now() + 3200;
          useFxStore.getState().pulseOverclock(3200);
          useFxStore.getState().pulseShake(0.14, 220);
          combatFx.pushBoom(
            origin.clone().add(forward.clone().multiplyScalar(1.2)),
            "#ffe066",
            2.6,
          );
          combatFx.pushBoom(origin.clone(), "#7dffef", 1.6);
          playerPhysics.punch(0.05);
          playSfx("/assets/audio/kenney-fps/weapon_change.ogg", 0.55);
          break;
        }
        case "scatter_carbine": {
          if (!state.spendNullEnergy(40)) return;
          for (const obj of collectDestructibles(scene)) {
            const op = worldPos(obj);
            if (op.distanceTo(origin) < 9) {
              applyHit(obj, 45, origin);
              impulseRigid(obj, op.clone().sub(origin), 16);
            }
          }
          // Self knockback — shockwave kick
          playerPhysics.pushKnock(
            -forward.x * 7.5,
            3.0,
            -forward.z * 7.5,
          );
          playerPhysics.punch(0.09);
          combatFx.pushBoom(
            origin.clone().add(forward.clone().multiplyScalar(2.5)),
            "#ffb347",
            4.0,
          );
          combatFx.pushImpact(origin.clone().add(forward.clone().multiplyScalar(2)), "#ffb347");
          useFxStore.getState().pulseShake(0.2, 300);
          playSfx("/assets/audio/kenney-fps/enemy_destroy.ogg", 0.58);
          break;
        }
        case "arc_caster": {
          if (!state.spendNullEnergy(45)) return;
          const pos = origin.clone().add(forward.clone().multiplyScalar(6));
          pos.y = Math.max(0.5, pos.y - 0.5);
          nests.current.push({
            id: nestId++,
            pos,
            until: performance.now() + 5500,
          });
          combatFx.pushBoom(pos.clone(), "#60a5fa", 3.4);
          combatFx.pushImpact(pos.clone(), "#93c5fd");
          combatFx.pushImpact(
            pos.clone().add(new THREE.Vector3(0.5, 0.4, 0)),
            "#60a5fa",
          );
          useFxStore.getState().pulseShake(0.1, 160);
          playSfx("/assets/audio/kenney-fps/weapon_change.ogg", 0.55);
          break;
        }
        case "rail_lance": {
          if (!state.spendNullEnergy(30)) return;
          raycaster.current.set(origin, forward);
          const hits = intersectScene(raycaster.current, scene);
          const valid = hits.find(
            (h) => h.distance > 1.2 && h.object.userData?.destructible,
          );
          if (valid) {
            marked.current = valid.object;
            valid.object.userData.marked = true;
            combatFx.pushImpact(valid.point.clone(), "#e879f9");
            combatFx.pushBeam(origin, valid.point.clone(), "#f0abfc", 0.08);
            combatFx.pushBoom(valid.point.clone(), "#e879f9", 1.6);
            useFxStore.getState().pulseShake(0.07, 120);
            playSfx("/assets/audio/kenney-fps/weapon_change.ogg", 0.5);
          }
          break;
        }
        case "void_launcher": {
          if (!state.spendNullEnergy(50)) return;
          const pos = origin.clone().add(forward.clone().multiplyScalar(10));
          singularities.current.push({
            id: singId++,
            pos,
            until: performance.now() + 2000,
            detonated: false,
          });
          combatFx.pushBoom(pos.clone(), "#c084fc", 2.8);
          combatFx.pushImpact(pos.clone(), "#e9d5ff");
          useFxStore.getState().pulseShake(0.09, 140);
          playSfx("/assets/audio/kenney-fps/enemy_attack.ogg", 0.48);
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
      if (Math.random() < dt * 6) {
        combatFx.pushImpact(
          nest.pos
            .clone()
            .add(
              new THREE.Vector3(
                (Math.random() - 0.5) * 3,
                Math.random() * 1.5,
                (Math.random() - 0.5) * 3,
              ),
            ),
          "#60a5fa",
        );
      }
      for (const obj of collectDestructibles(scene)) {
        const op = worldPos(obj);
        if (op.distanceTo(nest.pos) < 5.5 && Math.random() < dt * 5) {
          applyHit(obj, 7, nest.pos);
        }
      }
    }
    nests.current = nests.current.filter((n) => now < n.until);

    // Marked target pulse — Rail Lance Mark readability
    if (marked.current && marked.current.visible) {
      const mat = (marked.current as THREE.Mesh).material;
      if (mat && !Array.isArray(mat) && "emissive" in mat) {
        const std = mat as THREE.MeshStandardMaterial;
        std.emissive = new THREE.Color("#e879f9");
        std.emissiveIntensity = 1.2 + Math.sin(now * 0.016) * 0.8;
      }
      if (Math.random() < dt * 4) {
        combatFx.pushImpact(worldPos(marked.current), "#f0abfc");
      }
    }

    // Singularity pull then boom — physics pull on debris, stagger on meshes
    for (const s of singularities.current) {
      if (!s.detonated && now < s.until) {
        for (const obj of collectDestructibles(scene)) {
          const op = worldPos(obj);
          const to = new THREE.Vector3().subVectors(s.pos, op);
          const dist = to.length();
          if (dist < 12 && dist > 0.2) {
            to.normalize();
            if (!impulseRigid(obj, to, dt * 28)) {
              obj.position.add(to.multiplyScalar(dt * 6));
            }
          }
        }
        const cam = camera.position;
        if (cam.distanceTo(s.pos) < 10) {
          const pull = new THREE.Vector3().subVectors(s.pos, cam).normalize();
          playerPhysics.pushKnock(pull.x * dt * 8, 0, pull.z * dt * 8);
        }
      }
      if (!s.detonated && now >= s.until) {
        s.detonated = true;
        for (const obj of collectDestructibles(scene)) {
          const op = worldPos(obj);
          if (op.distanceTo(s.pos) < 10) {
            applyHit(obj, 65, s.pos);
            impulseRigid(obj, op.clone().sub(s.pos), 26);
          }
        }
        const cam = camera.position;
        if (cam.distanceTo(s.pos) < 13) {
          const blast = cam.clone().sub(s.pos).normalize();
          playerPhysics.pushKnock(blast.x * 12, 6.5, blast.z * 12);
          playerPhysics.punch(0.15);
        }
        playSfx("/assets/audio/kenney-fps/enemy_destroy.ogg", 0.78);
        combatFx.pushBoom(s.pos.clone(), "#c084fc", 6.5);
        combatFx.pushBoom(s.pos.clone().add(new THREE.Vector3(0, 1, 0)), "#ffffff", 3.2);
        combatFx.pushImpact(s.pos.clone(), "#c084fc");
        useFxStore.getState().pulseShake(0.34, 450);
      }
    }
    singularities.current = singularities.current.filter(
      (s) => now < s.until + 400,
    );

    if (firing.current && fireCooldown.current <= 0) {
      const weapon = state.weapons[id];
      if (weapon.ammo <= 0 && weapon.reserve > 0) {
        // Dry-fire → auto-reload
        fireCooldown.current = 0.8;
        useFxStore.getState().pulseReload(750);
        playSfx("/assets/audio/kenney-fps/weapon_change.ogg", 0.3);
        const need = magSize(id) - weapon.ammo;
        const take = Math.min(need, weapon.reserve);
        useGameStore.setState({
          weapons: {
            ...state.weapons,
            [id]: {
              ...weapon,
              ammo: weapon.ammo + take,
              reserve: weapon.reserve - take,
            },
          },
        });
      } else if (weapon.ammo > 0) {
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
            playSfx("/assets/audio/kenney-fps/blaster_repeater.ogg", overclocked ? 0.42 : 0.32);
            useFxStore.getState().pulseMuzzle(overclocked ? "#ffe066" : "#7dffef", overclocked ? 95 : 70);
            useFxStore.getState().pulseShake(overclocked ? 0.075 : 0.032, overclocked ? 100 : 75);
            playerPhysics.punch(overclocked ? 0.04 : 0.026);
            {
              const dir = forward.clone();
              const kick = useFxStore.getState().kick;
              dir.x += (Math.random() - 0.5) * kick * (overclocked ? 0.05 : 0.035);
              dir.y += (Math.random() - 0.5) * kick * (overclocked ? 0.04 : 0.028);
              dir.normalize();
              shots.push({
                dir,
                damage: overclocked ? 32 : 18,
                color: overclocked ? "#ffe066" : "#7dffef",
              });
            }
            break;
          case "scatter_carbine":
            playSfx("/assets/audio/kenney-fps/blaster.ogg", 0.52);
            useFxStore.getState().pulseMuzzle("#ff7a18", 160);
            useFxStore.getState().pulseShake(0.12, 155);
            playerPhysics.punch(0.14);
            for (let i = 0; i < 16; i++) {
              const dir = forward.clone();
              dir.x += (Math.random() - 0.5) * 0.38;
              dir.y += (Math.random() - 0.5) * 0.3;
              dir.z += (Math.random() - 0.5) * 0.38;
              dir.normalize();
              shots.push({ dir, damage: 14, color: "#ff9f43" });
            }
            break;
          case "arc_caster": {
            playSfx("/assets/audio/kenney-fps/blaster.ogg", 0.38);
            useFxStore.getState().pulseMuzzle("#60a5fa", 115);
            useFxStore.getState().pulseShake(0.045, 90);
            playerPhysics.punch(0.05);
            {
              const dir = forward.clone();
              const kick = useFxStore.getState().kick;
              dir.x += (Math.random() - 0.5) * kick * 0.02;
              dir.y += (Math.random() - 0.5) * kick * 0.016;
              dir.normalize();
              shots.push({ dir, damage: 22, color: "#60a5fa" });
            }
            break;
          }
          case "rail_lance":
            playSfx("/assets/audio/kenney-fps/blaster.ogg", 0.58);
            useFxStore.getState().pulseMuzzle("#f0abfc", 200);
            useFxStore.getState().pulseShake(0.1, 170);
            playerPhysics.punch(0.12);
            shots.push({ dir: forward.clone(), damage: 74, color: "#e879f9" });
            break;
          case "void_launcher":
            playSfx("/assets/audio/kenney-fps/blaster.ogg", 0.58);
            useFxStore.getState().pulseMuzzle("#ff7a18", 260);
            useFxStore.getState().pulseShake(0.16, 200);
            playerPhysics.punch(0.16);
            shots.push({ dir: forward.clone(), damage: 68, color: "#ff7a18" });
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
          const hits = intersectScene(raycaster.current, scene);
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
            id === "rail_lance"
              ? 0.4
              : id === "void_launcher"
                ? 0.24
                : id === "scatter_carbine"
                  ? 0.085
                  : 0.14;
          combatFx.pushBeam(muzzle, impact, shot.color, beamWidth);
          combatFx.pushImpact(impact, shot.color);
          if (id === "void_launcher") {
            combatFx.pushBoom(impact, "#ff7a18", 4.4);
            combatFx.pushBoom(
              impact.clone().add(new THREE.Vector3(0, 0.35, 0)),
              "#ffb347",
              2.2,
            );
            useFxStore.getState().pulseShake(0.18, 220);
          }

          if (valid?.object?.userData?.destructible) {
            let dmg = shot.damage;
            if (
              valid.object.userData.marked ||
              marked.current === valid.object
            ) {
              dmg = Math.round(dmg * 1.5);
            }
            applyHit(valid.object, dmg, origin);

            if (id === "arc_caster") {
              const primary = worldPos(valid.object).clone();
              let chained = 0;
              for (const obj of collectDestructibles(scene)) {
                if (obj === valid.object) continue;
                const op = worldPos(obj);
                if (op.distanceTo(primary) < 9.5 && chained < 5) {
                  applyHit(obj, 14, primary);
                  combatFx.pushBeam(primary, op, "#93c5fd", 0.08);
                  combatFx.pushImpact(op, "#93c5fd");
                  chained++;
                }
              }
              if (chained > 0) {
                useFxStore.getState().pulseShake(0.04, 80);
              }
            }

            if (id === "rail_lance") {
              playerPhysics.punch(0.04);
              // Quake rail pierce — keep punching through lined-up targets
              let pierced = 0;
              for (const h of hits) {
                if (h.distance <= 1.2) continue;
                const obj = h.object as THREE.Object3D;
                if (!obj.userData?.destructible || obj === valid.object) continue;
                if (pierced >= 3) break;
                let pierceDmg = Math.round(shot.damage * (0.75 - pierced * 0.18));
                if (obj.userData.marked) pierceDmg = Math.round(pierceDmg * 1.5);
                applyHit(obj, pierceDmg, origin);
                combatFx.pushImpact(h.point.clone(), "#f0abfc");
                combatFx.pushBeam(impact, h.point.clone(), "#e879f9", 0.1);
                pierced++;
              }
            }

            if (id === "void_launcher") {
              for (const obj of collectDestructibles(scene)) {
                const op = worldPos(obj);
                if (op.distanceTo(impact) < 8.0) {
                  applyHit(obj, 36, impact);
                  impulseRigid(obj, op.clone().sub(impact), 18);
                }
              }
              combatFx.pushBoom(impact, "#ff7a18", 6.4);
              combatFx.pushBoom(
                impact.clone().add(new THREE.Vector3(0, 0.55, 0)),
                "#ffb347",
                3.0,
              );
              combatFx.pushBoom(
                impact.clone().add(new THREE.Vector3(0, 0.15, 0)),
                "#ffffff",
                1.4,
              );
              combatFx.pushImpact(impact, "#ff9f43");
              useFxStore.getState().pulseShake(0.3, 400);
              playSfx("/assets/audio/kenney-fps/enemy_destroy.ogg", 0.78);
              playerPhysics.punch(0.1);
              // Soft rocket-jump if close — Quake RJ window
              if (origin.distanceTo(impact) < 8.0) {
                const up = origin.clone().sub(impact).normalize();
                playerPhysics.pushKnock(up.x * 10, 11.5, up.z * 10);
                playerPhysics.punch(-0.12);
              }
            }
          }
        }
      }
    }

    if (Math.random() < dt * 2.8) {
      const e = useGameStore.getState().nullEnergy;
      if (e < 100) useGameStore.getState().setNullEnergy(Math.min(100, e + 2.2));
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
