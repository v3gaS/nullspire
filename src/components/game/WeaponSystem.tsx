"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useGameStore } from "@/stores/gameStore";

interface Tracer {
  id: number;
  origin: THREE.Vector3;
  end: THREE.Vector3;
  born: number;
}

let tracerId = 0;

/** Hitscan Pulse SMG baseline — Phase 2 combat. */
export function WeaponSystem() {
  const { camera, scene, gl } = useThree();
  const tracers = useRef<Tracer[]>([]);
  const groupRef = useRef<THREE.Group>(null);
  const fireCooldown = useRef(0);
  const firing = useRef(false);
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

    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [gl]);

  useFrame((_, dt) => {
    fireCooldown.current = Math.max(0, fireCooldown.current - dt);
    const state = useGameStore.getState();
    if (state.screen !== "playing") return;

    if (firing.current && fireCooldown.current <= 0) {
      const weapon = state.weapons[state.activeWeapon];
      if (weapon.ammo > 0) {
        fireCooldown.current = 0.09;
        useGameStore.setState({
          weapons: {
            ...state.weapons,
            [state.activeWeapon]: { ...weapon, ammo: weapon.ammo - 1 },
          },
        });

        const origin = camera.position.clone();
        const dir = new THREE.Vector3();
        camera.getWorldDirection(dir);
        raycaster.current.set(origin, dir);
        const hits = raycaster.current.intersectObjects(scene.children, true);
        const valid = hits.find((h) => h.distance > 1.2);
        const impact = valid
          ? valid.point.clone()
          : origin.clone().add(dir.clone().multiplyScalar(80));

        tracers.current.push({
          id: tracerId++,
          origin: origin.clone().add(dir.clone().multiplyScalar(0.8)),
          end: impact,
          born: performance.now(),
        });

        if (valid?.object) {
          const obj = valid.object as THREE.Mesh;
          if (obj.userData?.destructible) {
            obj.userData.hp = (obj.userData.hp ?? 30) - 12;
            const mat = obj.material;
            if (mat && !Array.isArray(mat) && "emissive" in mat) {
              (mat as THREE.MeshStandardMaterial).emissive = new THREE.Color(
                "#ff4466",
              );
            }
            if (obj.userData.hp <= 0) {
              obj.visible = false;
              obj.userData.dead = true;
            }
          }
        }
      }
    }

    const now = performance.now();
    tracers.current = tracers.current.filter((t) => now - t.born < 80);

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
          color: "#7dffef",
          transparent: true,
          opacity: 0.85,
        }),
      );
      group.add(line);
    }
  });

  return <group ref={groupRef} />;
}
