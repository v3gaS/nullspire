import * as THREE from "three";

/** World-space position (safe for meshes inside offset groups). */
export function worldPos(
  obj: THREE.Object3D,
  out = new THREE.Vector3(),
): THREE.Vector3 {
  return obj.getWorldPosition(out);
}

export function distToCam(obj: THREE.Object3D, cam: THREE.Vector3): number {
  return cam.distanceTo(worldPos(obj));
}
