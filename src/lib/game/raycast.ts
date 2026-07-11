import * as THREE from "three";

let cachedTargets: THREE.Object3D[] = [];
let cacheAt = 0;
const CACHE_MS = 250;

/**
 * Raycast only visible meshes that can block/hit.
 * Skips decorative skipHit meshes. Refreshes target list every 250ms
 * instead of rebuilding every shot (was freezing SMG fire).
 */
export function intersectScene(
  raycaster: THREE.Raycaster,
  scene: THREE.Scene,
): THREE.Intersection[] {
  const now = performance.now();
  if (now - cacheAt > CACHE_MS || cachedTargets.length === 0) {
    const targets: THREE.Object3D[] = [];
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh || !mesh.visible) return;
      if (!mesh.parent || !mesh.matrixWorld) return;
      if (mesh.userData?.skipHit && !mesh.userData?.destructible) return;
      targets.push(mesh);
    });
    cachedTargets = targets;
    cacheAt = now;
  }
  try {
    return raycaster.intersectObjects(cachedTargets, false);
  } catch {
    return [];
  }
}

/** Call after spawning/despawning destructibles if hits feel stale. */
export function invalidateRaycastCache() {
  cacheAt = 0;
  cachedTargets = [];
}
