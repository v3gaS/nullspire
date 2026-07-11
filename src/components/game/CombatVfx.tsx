"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { useFxStore } from "@/stores/fxStore";

export interface ImpactSpec {
  id: number;
  pos: THREE.Vector3;
  color: string;
  born: number;
}

export interface BeamSpec {
  id: number;
  origin: THREE.Vector3;
  end: THREE.Vector3;
  color: string;
  born: number;
  width: number;
}

export interface BoomSpec {
  id: number;
  pos: THREE.Vector3;
  color: string;
  born: number;
  radius: number;
}

let impactId = 0;
let beamId = 0;
let boomId = 0;

/** Shared mutable FX queues — WeaponSystem pushes, this renders. */
export const combatFx = {
  impacts: [] as ImpactSpec[],
  beams: [] as BeamSpec[],
  booms: [] as BoomSpec[],
  pushImpact(pos: THREE.Vector3, color: string) {
    this.impacts.push({
      id: impactId++,
      pos: pos.clone(),
      color,
      born: performance.now(),
    });
  },
  pushBeam(
    origin: THREE.Vector3,
    end: THREE.Vector3,
    color: string,
    width = 0.06,
  ) {
    this.beams.push({
      id: beamId++,
      origin: origin.clone(),
      end: end.clone(),
      color,
      born: performance.now(),
      width,
    });
  },
  pushBoom(pos: THREE.Vector3, color: string, radius = 3.5) {
    this.booms.push({
      id: boomId++,
      pos: pos.clone(),
      color,
      born: performance.now(),
      radius,
    });
  },
};

/** Visible muzzle flash, fat beams, impact bursts. */
export function CombatVfx() {
  const { camera } = useThree();
  const flashRef = useRef<THREE.PointLight>(null);
  const flashMesh = useRef<THREE.Mesh>(null);
  const beamsGroup = useRef<THREE.Group>(null);
  const impactsGroup = useRef<THREE.Group>(null);
  const boomsGroup = useRef<THREE.Group>(null);
  const hitMap = useTexture("/assets/sprites/kenney-fps/hit.png");
  const burstMap = useTexture("/assets/sprites/kenney-fps/burst.png");

  const flashGeo = useMemo(() => new THREE.SphereGeometry(0.08, 8, 8), []);

  useFrame(() => {
    const now = performance.now();
    const fx = useFxStore.getState();
    const flashing = now < fx.muzzleUntil;

    const light = flashRef.current;
    const mesh = flashMesh.current;
    if (light && mesh) {
      // Place flash just ahead of camera / gun
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      const pos = camera.position
        .clone()
        .add(dir.multiplyScalar(0.7))
        .add(new THREE.Vector3(0.22, -0.12, 0).applyQuaternion(camera.quaternion));
      light.position.copy(pos);
      mesh.position.copy(pos);
      light.intensity = flashing ? 26 : 0;
      light.color.set(fx.muzzleColor);
      mesh.visible = flashing;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.color.set(fx.muzzleColor);
      if (flashing) {
        const ageLeft = Math.max(0, fx.muzzleUntil - now);
        const punch = 0.1 + Math.min(0.08, ageLeft / 900);
        mesh.scale.setScalar(punch / 0.08);
      }
    }

    // Decay kick
    if (fx.kick > 0) {
      useFxStore.setState({ kick: Math.max(0, fx.kick - 0.12) });
    }

    // Beams
    combatFx.beams = combatFx.beams.filter((b) => now - b.born < 190);
    const bg = beamsGroup.current;
    if (bg) {
      while (bg.children.length) {
        const c = bg.children[0];
        bg.remove(c);
        if (c instanceof THREE.Mesh) {
          c.geometry.dispose();
          (c.material as THREE.Material).dispose();
        }
      }
      for (const b of combatFx.beams) {
        const mid = b.origin.clone().add(b.end).multiplyScalar(0.5);
        const len = b.origin.distanceTo(b.end);
        const geo = new THREE.CylinderGeometry(b.width, b.width * 0.4, len, 6, 1, true);
        const age = (now - b.born) / 190;
        const mat = new THREE.MeshBasicMaterial({
          color: b.color,
          transparent: true,
          opacity: 0.95 * (1 - age * 0.85),
          depthWrite: false,
        });
        const cyl = new THREE.Mesh(geo, mat);
        cyl.position.copy(mid);
        cyl.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          b.end.clone().sub(b.origin).normalize(),
        );
        bg.add(cyl);

        // Core bright line
        const core = new THREE.Mesh(
          new THREE.CylinderGeometry(b.width * 0.35, b.width * 0.15, len, 5, 1, true),
          new THREE.MeshBasicMaterial({
            color: "#ffffff",
            transparent: true,
            opacity: 0.85 * (1 - age),
            depthWrite: false,
          }),
        );
        core.position.copy(mid);
        core.quaternion.copy(cyl.quaternion);
        bg.add(core);
      }
    }

    // Impacts — chunkier Quake sparks
    combatFx.impacts = combatFx.impacts.filter((i) => now - i.born < 260);
    const ig = impactsGroup.current;
    if (ig) {
      while (ig.children.length) {
        const c = ig.children[0];
        ig.remove(c);
      }
      for (const imp of combatFx.impacts) {
        const age = (now - imp.born) / 260;
        const sprite = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: age < 0.45 ? burstMap : hitMap,
            color: imp.color,
            transparent: true,
            opacity: 1 - age,
            depthWrite: false,
          }),
        );
        sprite.position.copy(imp.pos);
        const s = 0.95 + age * 2.4;
        sprite.scale.set(s, s, s);
        ig.add(sprite);

        const spark = new THREE.PointLight(imp.color, 6.5 * (1 - age), 11);
        spark.position.copy(imp.pos);
        ig.add(spark);
      }
    }

    // DOOM-style explosion spheres + debris ring
    combatFx.booms = combatFx.booms.filter((b) => now - b.born < 580);
    const bgBoom = boomsGroup.current;
    if (bgBoom) {
      while (bgBoom.children.length) {
        const c = bgBoom.children[0];
        bgBoom.remove(c);
        if (c instanceof THREE.Mesh) {
          c.geometry.dispose();
          (c.material as THREE.Material).dispose();
        }
      }
      for (const boom of combatFx.booms) {
        const age = (now - boom.born) / 580;
        const scale = boom.radius * (0.4 + age * 1.7);
        const shell = new THREE.Mesh(
          new THREE.SphereGeometry(1, 14, 12),
          new THREE.MeshBasicMaterial({
            color: boom.color,
            transparent: true,
            opacity: 0.85 * (1 - age),
            depthWrite: false,
            wireframe: age > 0.32,
          }),
        );
        shell.position.copy(boom.pos);
        shell.scale.setScalar(scale);
        bgBoom.add(shell);

        const core = new THREE.Mesh(
          new THREE.SphereGeometry(1, 10, 8),
          new THREE.MeshBasicMaterial({
            color: "#ffffff",
            transparent: true,
            opacity: 0.98 * (1 - age * 1.15),
            depthWrite: false,
          }),
        );
        core.position.copy(boom.pos);
        core.scale.setScalar(scale * 0.42);
        bgBoom.add(core);

        // Quake debris ring — reads as chunky blast
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(scale * 0.55, scale * 0.06, 6, 20),
          new THREE.MeshBasicMaterial({
            color: boom.color,
            transparent: true,
            opacity: 0.7 * (1 - age),
            depthWrite: false,
          }),
        );
        ring.position.copy(boom.pos);
        ring.rotation.x = Math.PI / 2;
        bgBoom.add(ring);

        for (let i = 0; i < 5; i++) {
          const ang = (i / 5) * Math.PI * 2 + age * 2;
          const spark = new THREE.Mesh(
            new THREE.SphereGeometry(0.12, 5, 4),
            new THREE.MeshBasicMaterial({
              color: i % 2 === 0 ? "#ffb347" : "#ffffff",
              transparent: true,
              opacity: 0.9 * (1 - age),
              depthWrite: false,
            }),
          );
          spark.position.set(
            boom.pos.x + Math.cos(ang) * scale * 0.7,
            boom.pos.y + 0.3 + age * 1.2,
            boom.pos.z + Math.sin(ang) * scale * 0.7,
          );
          bgBoom.add(spark);
        }

        const light = new THREE.PointLight(
          boom.color,
          22 * (1 - age),
          boom.radius * 5.5,
        );
        light.position.copy(boom.pos);
        bgBoom.add(light);
      }
    }
  });

  return (
    <group>
      <pointLight ref={flashRef} intensity={0} distance={12} decay={2} />
      <mesh ref={flashMesh} geometry={flashGeo} visible={false}>
        <meshBasicMaterial color="#fff" toneMapped={false} />
      </mesh>
      <group ref={beamsGroup} />
      <group ref={impactsGroup} />
      <group ref={boomsGroup} />
    </group>
  );
}
