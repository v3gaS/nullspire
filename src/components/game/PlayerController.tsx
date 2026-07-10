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
import { playerLocomotion } from "@/lib/game/playerLocomotion";
import { playerPhysics } from "@/lib/game/playerPhysics";
import { playSfx } from "@/lib/game/audio";
import { intersectScene } from "@/lib/game/raycast";
import { useFxStore } from "@/stores/fxStore";

type Keys = Record<string, boolean>;

export function PlayerController() {
  const bodyRef = useRef<RapierRigidBody>(null);
  const yaw = useRef(0);
  const pitch = useRef(0);
  const keys = useRef<Keys>({});
  const coyote = useRef(0);
  const wasAirborne = useRef(false);
  const peakFallSpeed = useRef(0);
  const padCooldown = useRef(0);
  const footstep = useRef(0);
  const jumpHeld = useRef(false);
  const jumpBuffer = useRef(0);
  const canCutJump = useRef(false);
  const spawnProtect = useRef(2.5);
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
    playerPhysics.register(bodyRef.current);
    return () => playerPhysics.register(null);
  }, []);

  useEffect(() => {
    const canvas = gl.domElement;

    const onKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
      if (e.code === "Space") {
        jumpHeld.current = true;
        jumpBuffer.current = 0.12;
      }
      if (e.code === "Escape" && useGameStore.getState().screen === "playing") {
        useGameStore.getState().setScreen("paused");
        document.exitPointerLock();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
      if (e.code === "Space") jumpHeld.current = false;
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
    playerPhysics.register(body);

    const vel = body.linvel();
    const pos = body.translation();

    // Hold above ground until Rapier colliders finish streaming in
    spawnProtect.current = Math.max(0, spawnProtect.current - dt);
    if (spawnProtect.current > 0 && pos.y < 1.6) {
      body.setTranslation({ x: pos.x, y: 2.2, z: pos.z }, true);
      body.setLinvel({ x: vel.x * 0.2, y: 0, z: vel.z * 0.2 }, true);
    }
    groundedRay.current.set(
      new THREE.Vector3(pos.x, pos.y, pos.z),
      downDir.current,
    );
    const hits = intersectScene(groundedRay.current, scene);
    const groundHit = hits.find(
      (h) =>
        h.distance < 1.35 &&
        !(h.object as THREE.Object3D).userData?.destructible &&
        !(h.object as THREE.Object3D).userData?.jumpPad,
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
          playerPhysics.punch(0.08);
        } else if (impact > 4) {
          playSfx("/assets/audio/kenney-fps/land.ogg", 0.22);
          playerPhysics.punch(0.025);
        } else if (impact > 1.5) {
          playerPhysics.punch(0.01);
        }
        wasAirborne.current = false;
        peakFallSpeed.current = 0;
      }
    } else {
      coyote.current = Math.max(0, coyote.current - dt);
    }

    if (pos.y < -20) {
      const cp = useGameStore.getState().checkpoint;
      body.setTranslation({ x: cp.x, y: cp.y, z: cp.z }, true);
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      playerPhysics.knock.set(0, 0, 0);
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
    playerLocomotion.moving = wish.lengthSq() > 0;
    playerLocomotion.sprinting = sprint && playerLocomotion.moving;

    // Decay knockback; blend with wish so explosions/hits feel physical
    const knock = playerPhysics.knock;
    knock.multiplyScalar(Math.exp(-dt * 4.2));
    if (knock.lengthSq() < 0.01) knock.set(0, 0, 0);

    const airControl = nearGround ? 1 : 0.55;
    const hx = wish.x * speed * airControl + knock.x;
    const hz = wish.z * speed * airControl + knock.z;
    let hy = vel.y + knock.y;
    knock.y *= Math.exp(-dt * 6);

    body.setLinvel({ x: hx, y: hy, z: hz }, true);

    if (playerLocomotion.moving && nearGround) {
      footstep.current -= dt;
      if (footstep.current <= 0) {
        playSfx(
          "/assets/audio/kenney-fps/walking.ogg",
          playerLocomotion.sprinting ? 0.18 : 0.12,
        );
        footstep.current = playerLocomotion.sprinting ? 0.32 : 0.45;
      }
    } else {
      footstep.current = 0.1;
    }

    jumpBuffer.current = Math.max(0, jumpBuffer.current - dt);

    const tryJump = () => {
      const v = body.linvel();
      body.setLinvel({ x: v.x, y: Math.max(v.y, 0), z: v.z }, true);
      body.applyImpulse(
        {
          x: wish.x * (sprint ? 2.2 : 1.2),
          y: PLAYER.jumpImpulse * 1.15,
          z: wish.z * (sprint ? 2.2 : 1.2),
        },
        true,
      );
      coyote.current = 0;
      jumpBuffer.current = 0;
      canCutJump.current = true;
      playerPhysics.punch(-0.02);
    };

    if (coyote.current > 0 && jumpBuffer.current > 0) {
      tryJump();
    }

    // Variable jump — release Space once to cut upward velocity
    if (!jumpHeld.current && canCutJump.current) {
      const v = body.linvel();
      if (v.y > 2) {
        body.setLinvel({ x: v.x, y: v.y * 0.45, z: v.z }, true);
      }
      canCutJump.current = false;
    }
    if (nearGround) canCutJump.current = false;

    // Jump pads — impulse via physics (sensor + proximity fallback)
    padCooldown.current = Math.max(0, padCooldown.current - dt);
    const onPad =
      (Math.hypot(pos.x - 0, pos.z + 28) < 1.8 && pos.y < 1.5) ||
      (Math.hypot(pos.x - 8, pos.z + 48) < 1.8 && pos.y < 1.5);
    if (onPad && vel.y <= 0.5 && padCooldown.current <= 0) {
      body.applyImpulse({ x: wish.x * 2, y: 16, z: wish.z * 2 }, true);
      playSfx("/assets/audio/kenney-fps/jump_a.ogg", 0.35);
      padCooldown.current = 0.6;
      playerPhysics.punch(-0.06);
    }

    // Camera punch + Quake-style explosion shake
    playerPhysics.punchPitch *= Math.exp(-dt * 10);
    playerPhysics.punchYaw *= Math.exp(-dt * 10);
    const fx = useFxStore.getState();
    let shakeX = 0;
    let shakeY = 0;
    if (performance.now() < fx.shakeUntil) {
      const t = (fx.shakeUntil - performance.now()) / 280;
      const amp = fx.shakeAmp * t;
      shakeX = (Math.random() - 0.5) * amp;
      shakeY = (Math.random() - 0.5) * amp;
    } else if (fx.shakeAmp > 0) {
      useFxStore.setState({ shakeAmp: 0 });
    }

    camera.position.set(pos.x + shakeX, pos.y + 0.6 + shakeY, pos.z);
    camera.rotation.order = "YXZ";
    camera.rotation.y = yaw.current + playerPhysics.punchYaw;
    camera.rotation.x = pitch.current + playerPhysics.punchPitch;
  });

  return (
    <RigidBody
      ref={bodyRef}
      position={[0, 2.4, 8]}
      enabledRotations={[false, false, false]}
      colliders={false}
      mass={1}
      friction={1.2}
      linearDamping={0.05}
      ccd
    >
      <CapsuleCollider args={[PLAYER.height * 0.25, PLAYER.radius]} />
    </RigidBody>
  );
}
