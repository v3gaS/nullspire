"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { RigidBody, CapsuleCollider, type RapierRigidBody } from "@react-three/rapier";
import { PLAYER } from "@/lib/game/constants";
import { useGameStore } from "@/stores/gameStore";

type Keys = Record<string, boolean>;

export function PlayerController() {
  const bodyRef = useRef<RapierRigidBody>(null);
  const yaw = useRef(0);
  const pitch = useRef(0);
  const keys = useRef<Keys>({});
  const grounded = useRef(false);
  const coyote = useRef(0);
  const { camera, gl } = useThree();
  const screen = useGameStore((s) => s.screen);
  const sensitivity = useGameStore((s) => s.mouseSensitivity);

  useEffect(() => {
    const canvas = gl.domElement;

    const onKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
      if (e.code === "Escape" && useGameStore.getState().screen === "playing") {
        useGameStore.getState().setScreen("paused");
        document.exitPointerLock();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== canvas) return;
      if (useGameStore.getState().screen !== "playing") return;
      yaw.current -= e.movementX * 0.002 * sensitivity;
      pitch.current -= e.movementY * 0.002 * sensitivity;
      pitch.current = Math.max(-1.4, Math.min(1.4, pitch.current));
    };
    const onClick = () => {
      if (useGameStore.getState().screen === "playing") {
        canvas.requestPointerLock();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("click", onClick);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("click", onClick);
    };
  }, [gl, sensitivity]);

  useFrame((_, dt) => {
    const body = bodyRef.current;
    if (!body || screen !== "playing") return;

    const vel = body.linvel();
    const pos = body.translation();

    // Ground probe via downward velocity heuristic + coyote
    if (Math.abs(vel.y) < 0.15) {
      grounded.current = true;
      coyote.current = PLAYER.coyoteTime;
    } else {
      grounded.current = false;
      coyote.current = Math.max(0, coyote.current - dt);
    }

    const forward = new THREE.Vector3(
      -Math.sin(yaw.current),
      0,
      -Math.cos(yaw.current),
    );
    const right = new THREE.Vector3(
      Math.cos(yaw.current),
      0,
      -Math.sin(yaw.current),
    );

    const wish = new THREE.Vector3();
    if (keys.current["KeyW"]) wish.add(forward);
    if (keys.current["KeyS"]) wish.sub(forward);
    if (keys.current["KeyD"]) wish.add(right);
    if (keys.current["KeyA"]) wish.sub(right);
    if (wish.lengthSq() > 0) wish.normalize();

    const sprint = !!keys.current["ShiftLeft"] || !!keys.current["ShiftRight"];
    const speed = sprint ? PLAYER.sprintSpeed : PLAYER.walkSpeed;
    body.setLinvel(
      { x: wish.x * speed, y: vel.y, z: wish.z * speed },
      true,
    );

    if (keys.current["Space"] && coyote.current > 0) {
      body.setLinvel(
        { x: wish.x * speed, y: PLAYER.jumpImpulse, z: wish.z * speed },
        true,
      );
      coyote.current = 0;
    }

    camera.position.set(pos.x, pos.y + 0.6, pos.z);
    camera.rotation.order = "YXZ";
    camera.rotation.y = yaw.current;
    camera.rotation.x = pitch.current;
  });

  return (
    <RigidBody
      ref={bodyRef}
      position={[0, 2, 8]}
      enabledRotations={[false, false, false]}
      colliders={false}
      mass={1}
      friction={1}
      linearDamping={0.1}
    >
      <CapsuleCollider args={[PLAYER.height * 0.25, PLAYER.radius]} />
    </RigidBody>
  );
}
