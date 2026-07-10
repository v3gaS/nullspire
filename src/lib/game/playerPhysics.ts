"use client";

import type { RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";

/** Shared player physics hooks — impulses survive wishdir overwrites. */
export const playerPhysics = {
  body: null as RapierRigidBody | null,
  knock: new THREE.Vector3(),
  punchPitch: 0,
  punchYaw: 0,
  padUntil: 0,
  spawnGraceUntil: 0,

  register(body: RapierRigidBody | null) {
    this.body = body;
  },

  beginSpawnGrace(ms = 8000) {
    this.spawnGraceUntil = performance.now() + ms;
    this.knock.set(0, 0, 0);
  },

  /** Add world-space knockback that decays each frame in PlayerController. */
  pushKnock(x: number, y: number, z: number) {
    this.knock.x += x;
    this.knock.y += y;
    this.knock.z += z;
    const len = this.knock.length();
    if (len > 18) this.knock.multiplyScalar(18 / len);
  },

  /** Instant Rapier impulse if body is registered (pads / explosions). */
  applyImpulse(x: number, y: number, z: number, opts?: { pad?: boolean }) {
    if (opts?.pad) {
      if (performance.now() < this.padUntil) return;
      this.padUntil = performance.now() + 600;
    }
    const b = this.body;
    if (!b) {
      this.pushKnock(x, y * 0.15, z);
      return;
    }
    b.applyImpulse({ x, y, z }, true);
  },

  punch(pitch = 0.04, yaw = 0) {
    this.punchPitch += pitch;
    this.punchYaw += yaw;
  },
};

/** Apply a one-shot positional stagger to mesh enemies / dummies. */
export function staggerObject(
  obj: THREE.Object3D,
  from: THREE.Vector3,
  strength = 0.55,
) {
  const wp = new THREE.Vector3();
  obj.getWorldPosition(wp);
  const dir = wp.clone().sub(from);
  dir.y = 0;
  if (dir.lengthSq() < 0.001) dir.set(0, 0, 1);
  dir.normalize().multiplyScalar(strength);
  obj.position.x += dir.x;
  obj.position.z += dir.z;
  obj.userData.staggerUntil = performance.now() + 180;
}

/** Impulse a Rapier body stored on userData.rigidBody. */
export function impulseRigid(
  obj: THREE.Object3D,
  dir: THREE.Vector3,
  force: number,
) {
  const body = obj.userData.rigidBody as RapierRigidBody | undefined;
  if (!body) return false;
  const n = dir.clone();
  if (n.lengthSq() < 0.001) n.set(0, 0.2, 1);
  n.normalize();
  body.applyImpulse(
    { x: n.x * force, y: Math.max(2, n.y * force + force * 0.35), z: n.z * force },
    true,
  );
  body.applyTorqueImpulse(
    { x: (Math.random() - 0.5) * force * 0.08, y: (Math.random() - 0.5) * force * 0.1, z: (Math.random() - 0.5) * force * 0.08 },
    true,
  );
  return true;
}
