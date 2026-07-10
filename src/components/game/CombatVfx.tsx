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

let impactId = 0;
let beamId = 0;

/** Shared mutable FX queues — WeaponSystem pushes, this renders. */
export const combatFx = {
  impacts: [] as ImpactSpec[],
  beams: [] as BeamSpec[],
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
};

/** Visible muzzle flash, fat beams, impact bursts. */
export function CombatVfx() {
  const { camera } = useThree();
  const flashRef = useRef<THREE.PointLight>(null);
  const flashMesh = useRef<THREE.Mesh>(null);
  const beamsGroup = useRef<THREE.Group>(null);
  const impactsGroup = useRef<THREE.Group>(null);
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
      light.intensity = flashing ? 8 : 0;
      light.color.set(fx.muzzleColor);
      mesh.visible = flashing;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.color.set(fx.muzzleColor);
    }

    // Decay kick
    if (fx.kick > 0) {
      useFxStore.setState({ kick: Math.max(0, fx.kick - 0.15) });
    }

    // Beams
    combatFx.beams = combatFx.beams.filter((b) => now - b.born < 140);
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
        const mat = new THREE.MeshBasicMaterial({
          color: b.color,
          transparent: true,
          opacity: 0.95,
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
            opacity: 0.85,
            depthWrite: false,
          }),
        );
        core.position.copy(mid);
        core.quaternion.copy(cyl.quaternion);
        bg.add(core);
      }
    }

    // Impacts
    combatFx.impacts = combatFx.impacts.filter((i) => now - i.born < 280);
    const ig = impactsGroup.current;
    if (ig) {
      while (ig.children.length) {
        const c = ig.children[0];
        ig.remove(c);
      }
      for (const imp of combatFx.impacts) {
        const age = (now - imp.born) / 280;
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
        const s = 0.4 + age * 1.2;
        sprite.scale.set(s, s, s);
        ig.add(sprite);

        const spark = new THREE.PointLight(imp.color, 2.5 * (1 - age), 6);
        spark.position.copy(imp.pos);
        ig.add(spark);
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
    </group>
  );
}
