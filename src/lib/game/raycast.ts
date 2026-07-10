import * as THREE from "three";

/**
 * Raycast only meshes that are still parented with a valid matrixWorld.
 * Rapier/R3F can briefly detach colliders — naive scene.intersectObjects throws.
 */
export function intersectScene(
  raycaster: THREE.Raycaster,
  scene: THREE.Scene,
): THREE.Intersection[] {
  const targets: THREE.Object3D[] = [];
  scene.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh || !mesh.visible) return;
    if (!mesh.parent) return;
    if (!mesh.matrixWorld) return;
    targets.push(mesh);
  });
  try {
    return raycaster.intersectObjects(targets, false);
  } catch {
    return [];
  }
}
