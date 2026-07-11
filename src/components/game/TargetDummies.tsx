"use client";

const TARGETS: [number, number, number][] = [
  // Drop Zone practice — immediate frag feed
  [4, 1.1, 0],
  [-5, 1.1, -1],
  [2, 1.1, -6],
  [6.5, 1.1, 2],
  [-7, 1.1, 1.5],
  // Approach flanks — rail-pierce practice line
  [9, 1.2, -14],
  [9, 1.2, -18],
  [9, 1.2, -22],
  [-10, 1.2, -16],
  [14, 1.5, -26],
  [0, 5.8, -16],
  [-14, 1.2, -22],
  [6, 1.2, -32],
  [-6, 1.2, -34],
  [11, 1.2, -36],
  [-11, 1.2, -38],
];

function BlockyDummy({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Torso */}
      <mesh
        castShadow
        userData={{ destructible: true, hp: 40, kind: "dummy" }}
        position={[0, 0, 0]}
      >
        <boxGeometry args={[1.0, 1.35, 0.75]} />
        <meshStandardMaterial
          color="#e8e0d4"
          emissive="#ff7a18"
          emissiveIntensity={0.4}
          roughness={0.55}
          metalness={0.25}
        />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.95, 0]} castShadow userData={{ skipHit: true }}>
        <boxGeometry args={[0.55, 0.5, 0.55]} />
        <meshStandardMaterial
          color="#f5f0e8"
          emissive="#ff9f43"
          emissiveIntensity={0.3}
          roughness={0.5}
          metalness={0.2}
        />
      </mesh>
      {/* Shoulder pads */}
      <mesh position={[-0.6, 0.35, 0]} castShadow userData={{ skipHit: true }}>
        <boxGeometry args={[0.28, 0.35, 0.5]} />
        <meshStandardMaterial color="#9ca3af" roughness={0.6} metalness={0.35} />
      </mesh>
      <mesh position={[0.6, 0.35, 0]} castShadow userData={{ skipHit: true }}>
        <boxGeometry args={[0.28, 0.35, 0.5]} />
        <meshStandardMaterial color="#9ca3af" roughness={0.6} metalness={0.35} />
      </mesh>
    </group>
  );
}

/** Blocky practice targets — Quake dummy silhouettes. */
export function TargetDummies() {
  return (
    <group>
      {TARGETS.map((pos, i) => (
        <BlockyDummy key={i} position={pos} />
      ))}
    </group>
  );
}
