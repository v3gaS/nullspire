import * as THREE from "three";

/** World-space position (safe for meshes inside offset groups). */
export function worldPos(
  obj: THREE.Object3D,
  out = new THREE.Vector3(),
): THREE.Vector3 {
  // Rapier/R3F can leave matrixWorld stale on the first frames after mount —
  // without this, bosses at z=-70 read as local (0,y,0) and melt the drop zone.
  obj.updateWorldMatrix(true, false);
  return obj.getWorldPosition(out);
}

export function distToCam(obj: THREE.Object3D, cam: THREE.Vector3): number {
  return cam.distanceTo(worldPos(obj));
}
