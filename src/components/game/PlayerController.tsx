"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import {
  RigidBody,
  CapsuleCollider,
  type RapierRigidBody,
} from "@react-three/rapier";
import { PLAYER } from "@/lib/game/constants";
import { useGameStore } from "@/stores/gameStore";

type Keys = Record<string, boolean>;

export function PlayerController() {
  const bodyRef = useRef<RapierRigidBody>(null);
  const yaw = useRef(0);
  const pitch = useRef(0);
  const keys = useRef<Keys>({});
  const coyote = useRef(0);
  const wasAirborne = useRef(false);
  const peakFallSpeed = useRef(0);
  const spawn = useRef({ x: 0, y: 2, z: 8 });
  const groundedRay = useRef(new THREE.Raycaster());
  const downDir = useRef(new THREE.Vector3(0, -1, 0));
  const { camera, gl, scene } = useThree();
  const screen = useGameStore((s) => s.screen);
  const sensitivity = useGameStore((s) => s.mouseSensitivity);
  const checkpoint = useGameStore((s) => s.checkpoint);

  useEffect(() => {
    spawn.current = {
      x: checkpoint.x,
      y: checkpoint.y,
      z: checkpoint.z,
    };
  }, [checkpoint]);

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
    groundedRay.current.set(
      new THREE.Vector3(pos.x, pos.y, pos.z),
      downDir.current,
    );
    const hits = groundedRay.current.intersectObjects(scene.children, true);
    const groundHit = hits.find(
      (h) =>
        h.distance < 1.35 &&
        !(h.object as THREE.Object3D).userData?.destructible,
    );
    const nearGround =
      !!groundHit || (Math.abs(vel.y) < 0.25 && pos.y < 3.5);

    if (vel.y < -0.5) {
      wasAirborne.current = true;
      peakFallSpeed.current = Math.min(peakFallSpeed.current, vel.y);
    }

    if (nearGround) {
      coyote.current = PLAYER.coyoteTime;
      if (wasAirborne.current) {
        const impact = Math.abs(peakFallSpeed.current);
        if (impact > 14) {
          const dmg = Math.round((impact - 14) * 8);
          useGameStore.getState().damagePlayer(dmg);
        }
        wasAirborne.current = false;
        peakFallSpeed.current = 0;
      }
    } else {
      coyote.current = Math.max(0, coyote.current - dt);
    }

    // Soft kill floor / void → checkpoint
    if (pos.y < -20) {
      const cp = useGameStore.getState().checkpoint;
      body.setTranslation({ x: cp.x, y: cp.y, z: cp.z }, true);
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      useGameStore.getState().damagePlayer(20);
      useGameStore.setState({
        invulnerableUntil: performance.now() + 2000,
      });
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
    body.setLinvel({ x: wish.x * speed, y: vel.y, z: wish.z * speed }, true);

    if (keys.current["Space"] && coyote.current > 0) {
      body.setLinvel(
        { x: wish.x * speed, y: PLAYER.jumpImpulse, z: wish.z * speed },
        true,
      );
      coyote.current = 0;
    }

    // Pink jump pads (world markers near y≈0.2)
    const onPad =
      (Math.hypot(pos.x - 0, pos.z + 28) < 1.8 && pos.y < 1.5) ||
      (Math.hypot(pos.x - 8, pos.z + 48) < 1.8 && pos.y < 1.5);
    if (onPad && vel.y <= 0.5) {
      body.setLinvel({ x: wish.x * speed, y: 14, z: wish.z * speed }, true);
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
