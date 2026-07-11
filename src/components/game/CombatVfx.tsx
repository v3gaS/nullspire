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

const MAX_IMPACTS = 8;
const MAX_BEAMS = 4;
const MAX_BOOMS = 2;

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
      width: Math.min(width, 0.18),
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
      radius: Math.min(radius, 4),
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

type BeamSlot = {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  geo: THREE.CylinderGeometry;
};

type ImpactSlot = {
  sprite: THREE.Sprite;
  mat: THREE.SpriteMaterial;
};

type BoomSlot = {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
};

/**
 * Pooled VFX — never allocate geometry/materials every frame.
 * Previous version create/dispose on every frame froze even high-end Macs.
 */
export function CombatVfx() {
  const { camera } = useThree();
  const flashMesh = useRef<THREE.Mesh>(null);
  const beamsGroup = useRef<THREE.Group>(null);
  const impactsGroup = useRef<THREE.Group>(null);
  const boomsGroup = useRef<THREE.Group>(null);
  const hitMap = useTexture("/assets/sprites/kenney-fps/hit.png");
  const burstMap = useTexture("/assets/sprites/kenney-fps/burst.png");

  const flashGeo = useMemo(() => new THREE.SphereGeometry(0.08, 6, 6), []);
  const boomGeo = useMemo(() => new THREE.SphereGeometry(1, 8, 6), []);

  const beamPool = useMemo(() => {
    const slots: BeamSlot[] = [];
    for (let i = 0; i < MAX_BEAMS; i++) {
      const geo = new THREE.CylinderGeometry(0.05, 0.02, 1, 4, 1, true);
      const mat = new THREE.MeshBasicMaterial({
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false;
      mesh.frustumCulled = false;
      slots.push({ mesh, mat, geo });
    }
    return slots;
  }, []);

  const impactPool = useMemo(() => {
    const slots: ImpactSlot[] = [];
    for (let i = 0; i < MAX_IMPACTS; i++) {
      const mat = new THREE.SpriteMaterial({
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      });
      const sprite = new THREE.Sprite(mat);
      sprite.visible = false;
      sprite.frustumCulled = false;
      slots.push({ sprite, mat });
    }
    return slots;
  }, []);

  const boomPool = useMemo(() => {
    const slots: BoomSlot[] = [];
    for (let i = 0; i < MAX_BOOMS; i++) {
      const mat = new THREE.MeshBasicMaterial({
        transparent: true,
        depthWrite: false,
        toneMapped: false,
        wireframe: false,
      });
      const mesh = new THREE.Mesh(boomGeo, mat);
      mesh.visible = false;
      mesh.frustumCulled = false;
      slots.push({ mesh, mat });
    }
    return slots;
  }, [boomGeo]);

  const poolsMounted = useRef(false);

  useFrame(() => {
    const now = performance.now();
    const fx = useFxStore.getState();
    const flashing = now < fx.muzzleUntil;

    const bg = beamsGroup.current;
    const ig = impactsGroup.current;
    const bgBoom = boomsGroup.current;
    if (!poolsMounted.current && bg && ig && bgBoom) {
      for (const s of beamPool) bg.add(s.mesh);
      for (const s of impactPool) ig.add(s.sprite);
      for (const s of boomPool) bgBoom.add(s.mesh);
      poolsMounted.current = true;
    }

    const mesh = flashMesh.current;
    if (mesh) {
      camera.getWorldDirection(_dir);
      _pos.copy(camera.position).addScaledVector(_dir, 0.7);
      _offset.set(0.22, -0.12, 0).applyQuaternion(camera.quaternion);
      _pos.add(_offset);
      mesh.position.copy(_pos);
      mesh.visible = flashing;
      if (flashing) {
        const mat = mesh.material as THREE.MeshBasicMaterial;
        mat.color.set(fx.muzzleColor);
        const ageLeft = Math.max(0, fx.muzzleUntil - now);
        mesh.scale.setScalar(0.8 + Math.min(0.5, ageLeft / 900));
      }
    }

    // Decay kick without notifying React subscribers every frame
    if (fx.kick > 0) {
      const next = Math.max(0, fx.kick - 0.12);
      if (next !== fx.kick) {
        // Mutate store silently — kick is polled via getState in HUD/viewmodel
        (fx as { kick: number }).kick = next;
      }
    }

    const beamLife = 90;
    combatFx.beams = combatFx.beams.filter((b) => now - b.born < beamLife);
    for (let i = 0; i < MAX_BEAMS; i++) {
      const slot = beamPool[i]!;
      const b = combatFx.beams[i];
      if (!b) {
        slot.mesh.visible = false;
        continue;
      }
      const len = b.origin.distanceTo(b.end);
      if (len < 0.05) {
        slot.mesh.visible = false;
        continue;
      }
      _mid.copy(b.origin).add(b.end).multiplyScalar(0.5);
      _beamDir.copy(b.end).sub(b.origin).normalize();
      slot.mesh.position.copy(_mid);
      slot.mesh.scale.set(b.width / 0.05, len, b.width / 0.05);
      slot.mesh.quaternion.setFromUnitVectors(_axis, _beamDir);
      const age = (now - b.born) / beamLife;
      slot.mat.color.set(b.color);
      slot.mat.opacity = 0.75 * (1 - age);
      slot.mesh.visible = true;
    }

    combatFx.impacts = combatFx.impacts.filter((i) => now - i.born < 140);
    for (let i = 0; i < MAX_IMPACTS; i++) {
      const slot = impactPool[i]!;
      const imp = combatFx.impacts[i];
      if (!imp) {
        slot.sprite.visible = false;
        continue;
      }
      const age = (now - imp.born) / 140;
      slot.mat.map = age < 0.4 ? burstMap : hitMap;
      slot.mat.color.set(imp.color);
      slot.mat.opacity = 1 - age;
      slot.sprite.position.copy(imp.pos);
      const s = 0.7 + age * 1.2;
      slot.sprite.scale.set(s, s, s);
      slot.sprite.visible = true;
    }

    combatFx.booms = combatFx.booms.filter((b) => now - b.born < 260);
    for (let i = 0; i < MAX_BOOMS; i++) {
      const slot = boomPool[i]!;
      const boom = combatFx.booms[i];
      if (!boom) {
        slot.mesh.visible = false;
        continue;
      }
      const age = (now - boom.born) / 260;
      const scale = boom.radius * (0.35 + age * 1.1);
      slot.mesh.position.copy(boom.pos);
      slot.mesh.scale.setScalar(scale);
      slot.mat.color.set(boom.color);
      slot.mat.opacity = 0.55 * (1 - age);
      slot.mat.wireframe = age > 0.45;
      slot.mesh.visible = true;
    }
  });

  return (
    <group>
      <mesh ref={flashMesh} geometry={flashGeo} visible={false}>
        <meshBasicMaterial color="#fff" toneMapped={false} />
      </mesh>
      <group ref={beamsGroup} />
      <group ref={impactsGroup} />
      <group ref={boomsGroup} />
    </group>
  );
}
