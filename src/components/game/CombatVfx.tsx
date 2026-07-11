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

const MAX_IMPACTS = 12;
const MAX_BEAMS = 8;
const MAX_BOOMS = 4;

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
    if (this.impacts.length > MAX_IMPACTS) {
      this.impacts.splice(0, this.impacts.length - MAX_IMPACTS);
    }
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
      width: Math.min(width, 0.22),
    });
    if (this.beams.length > MAX_BEAMS) {
      this.beams.splice(0, this.beams.length - MAX_BEAMS);
    }
  },
  pushBoom(pos: THREE.Vector3, color: string, radius = 3.5) {
    this.booms.push({
      id: boomId++,
      pos: pos.clone(),
      color,
      born: performance.now(),
      radius: Math.min(radius, 4.5),
    });
    if (this.booms.length > MAX_BOOMS) {
      this.booms.splice(0, this.booms.length - MAX_BOOMS);
    }
  },
};

const _dir = new THREE.Vector3();
const _pos = new THREE.Vector3();
const _offset = new THREE.Vector3();
const _mid = new THREE.Vector3();
const _axis = new THREE.Vector3(0, 1, 0);
const _beamDir = new THREE.Vector3();

/** Light muzzle flash + capped beams/impacts/booms (no per-FX lights). */
export function CombatVfx() {
  const { camera } = useThree();
  const flashRef = useRef<THREE.PointLight>(null);
  const flashMesh = useRef<THREE.Mesh>(null);
  const beamsGroup = useRef<THREE.Group>(null);
  const impactsGroup = useRef<THREE.Group>(null);
  const boomsGroup = useRef<THREE.Group>(null);
  const hitMap = useTexture("/assets/sprites/kenney-fps/hit.png");
  const burstMap = useTexture("/assets/sprites/kenney-fps/burst.png");

  const flashGeo = useMemo(() => new THREE.SphereGeometry(0.08, 6, 6), []);
  const boomGeo = useMemo(() => new THREE.SphereGeometry(1, 8, 6), []);

  useFrame(() => {
    const now = performance.now();
    const fx = useFxStore.getState();
    const flashing = now < fx.muzzleUntil;

    const light = flashRef.current;
    const mesh = flashMesh.current;
    if (light && mesh) {
      camera.getWorldDirection(_dir);
      _pos.copy(camera.position).addScaledVector(_dir, 0.7);
      _offset.set(0.22, -0.12, 0).applyQuaternion(camera.quaternion);
      _pos.add(_offset);
      light.position.copy(_pos);
      mesh.position.copy(_pos);
      light.intensity = flashing ? 12 : 0;
      light.color.set(fx.muzzleColor);
      mesh.visible = flashing;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.color.set(fx.muzzleColor);
      if (flashing) {
        const ageLeft = Math.max(0, fx.muzzleUntil - now);
        mesh.scale.setScalar((0.1 + Math.min(0.06, ageLeft / 900)) / 0.08);
      }
    }

    if (fx.kick > 0) {
      useFxStore.setState({ kick: Math.max(0, fx.kick - 0.1) });
    }

    // Beams — short life, single cylinder, no halo/core
    const beamLife = 120;
    combatFx.beams = combatFx.beams.filter((b) => now - b.born < beamLife);
    const bg = beamsGroup.current;
    if (bg) {
      while (bg.children.length) {
        const c = bg.children[0]!;
        bg.remove(c);
        if (c instanceof THREE.Mesh) {
          c.geometry.dispose();
          (c.material as THREE.Material).dispose();
        }
      }
      for (const b of combatFx.beams) {
        _mid.copy(b.origin).add(b.end).multiplyScalar(0.5);
        const len = b.origin.distanceTo(b.end);
        if (len < 0.05) continue;
        const geo = new THREE.CylinderGeometry(
          b.width * 0.7,
          b.width * 0.25,
          len,
          4,
          1,
          true,
        );
        const age = (now - b.born) / beamLife;
        const mat = new THREE.MeshBasicMaterial({
          color: b.color,
          transparent: true,
          opacity: 0.85 * (1 - age),
          depthWrite: false,
        });
        const cyl = new THREE.Mesh(geo, mat);
        cyl.position.copy(_mid);
        _beamDir.copy(b.end).sub(b.origin).normalize();
        cyl.quaternion.setFromUnitVectors(_axis, _beamDir);
        bg.add(cyl);
      }
    }

    // Impacts — sprites only, no PointLights
    combatFx.impacts = combatFx.impacts.filter((i) => now - i.born < 180);
    const ig = impactsGroup.current;
    if (ig) {
      while (ig.children.length) {
        const c = ig.children[0]!;
        ig.remove(c);
        if (c instanceof THREE.Sprite) {
          (c.material as THREE.Material).dispose();
        }
      }
      for (const imp of combatFx.impacts) {
        const age = (now - imp.born) / 180;
        const sprite = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: age < 0.4 ? burstMap : hitMap,
            color: imp.color,
            transparent: true,
            opacity: 1 - age,
            depthWrite: false,
          }),
        );
        sprite.position.copy(imp.pos);
        const s = 0.9 + age * 1.6;
        sprite.scale.set(s, s, s);
        ig.add(sprite);
      }
    }

    // Booms — one sphere + optional faint ring, no spark swarm / lights
    combatFx.booms = combatFx.booms.filter((b) => now - b.born < 320);
    const bgBoom = boomsGroup.current;
    if (bgBoom) {
      while (bgBoom.children.length) {
        const c = bgBoom.children[0]!;
        bgBoom.remove(c);
        if (c instanceof THREE.Mesh) {
          if (c.geometry !== boomGeo) c.geometry.dispose();
          (c.material as THREE.Material).dispose();
        }
      }
      for (const boom of combatFx.booms) {
        const age = (now - boom.born) / 320;
        const scale = boom.radius * (0.4 + age * 1.2);
        const shell = new THREE.Mesh(
          boomGeo,
          new THREE.MeshBasicMaterial({
            color: boom.color,
            transparent: true,
            opacity: 0.7 * (1 - age),
            depthWrite: false,
            wireframe: age > 0.4,
          }),
        );
        shell.position.copy(boom.pos);
        shell.scale.setScalar(scale);
        bgBoom.add(shell);
      }
    }
  });

  return (
    <group>
      <pointLight ref={flashRef} intensity={0} distance={8} decay={2} />
      <mesh ref={flashMesh} geometry={flashGeo} visible={false}>
        <meshBasicMaterial color="#fff" toneMapped={false} />
      </mesh>
      <group ref={beamsGroup} />
      <group ref={impactsGroup} />
      <group ref={boomsGroup} />
    </group>
  );
}
