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
import { combatFx } from "@/components/game/CombatVfx";

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
  /** Hard lock on the drop pad until Rapier colliders are live. */
  const spawnProtect = useRef(6);
  const spawn = useRef({ x: 0, y: 2.2, z: 8 });
  const groundedRay = useRef(new THREE.Raycaster());
  const downDir = useRef(new THREE.Vector3(0, -1, 0));
  const { camera, gl, scene } = useThree();
  const sensitivity = useGameStore((s) => s.mouseSensitivity);
  const checkpoint = useGameStore((s) => s.checkpoint);

  useEffect(() => {
    spawn.current = {
      x: checkpoint.x,
      y: Math.max(checkpoint.y, 2.2),
      z: checkpoint.z,
    };
    spawnProtect.current = 6;
    playerPhysics.beginSpawnGrace(9000);
    const body = bodyRef.current;
    if (body) {
      body.setTranslation(
        { x: spawn.current.x, y: spawn.current.y, z: spawn.current.z },
        true,
      );
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }
  }, [checkpoint]);

  useEffect(() => {
    playerPhysics.register(bodyRef.current);
    playerPhysics.beginSpawnGrace(9000);
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
    if (typeof window !== "undefined") {
      (
        window as unknown as { __ns?: Record<string, unknown> }
      ).__ns = {
        tick: performance.now(),
        hasBody: !!bodyRef.current,
        screen: useGameStore.getState().screen,
      };
    }
    const body = bodyRef.current;
    if (!body || useGameStore.getState().screen !== "playing") return;
    playerPhysics.register(body);

    const vel = body.linvel();
    const pos = body.translation();

    // Soft floor catch — if Rapier tunnels, snap back onto the arena
    if (pos.y < -0.35) {
      body.setTranslation(
        { x: pos.x, y: 1.35, z: pos.z },
        true,
      );
      body.setLinvel({ x: vel.x * 0.4, y: 0, z: vel.z * 0.4 }, true);
      spawnProtect.current = Math.max(spawnProtect.current, 1.2);
    }

    // Pin to pad until physics world is trustworthy — no void, no fall damage
    spawnProtect.current = Math.max(0, spawnProtect.current - dt);
    if (spawnProtect.current > 0) {
      const sx = spawn.current.x;
      const sy = spawn.current.y;
      const sz = spawn.current.z;
      if (
        pos.y < sy - 0.15 ||
        pos.y > sy + 4 ||
        Math.hypot(pos.x - sx, pos.z - sz) > 6
      ) {
        body.setTranslation({ x: sx, y: sy, z: sz }, true);
      } else if (pos.y < sy) {
        body.setTranslation({ x: pos.x, y: sy, z: pos.z }, true);
      }
      body.setLinvel(
        { x: vel.x * 0.35, y: Math.max(vel.y, 0), z: vel.z * 0.35 },
        true,
      );
    }

    if (typeof window !== "undefined") {
      (
        window as unknown as {
          __ns?: {
            y: number;
            z: number;
            velY: number;
            hp: number;
            armor: number;
            protect: number;
            keys: string;
          };
        }
      ).__ns = {
        y: body.translation().y,
        z: body.translation().z,
        velY: body.linvel().y,
        hp: useGameStore.getState().health,
        armor: useGameStore.getState().armor,
        protect: spawnProtect.current,
        keys: Object.entries(keys.current)
          .filter(([, v]) => v)
          .map(([k]) => k)
          .join(","),
      };
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
      !!groundHit ||
      spawnProtect.current > 0 ||
      (Math.abs(vel.y) < 0.25 && pos.y < 3.5);

    if (vel.y < -0.5 && spawnProtect.current <= 0) {
      wasAirborne.current = true;
      peakFallSpeed.current = Math.min(peakFallSpeed.current, vel.y);
    }

    if (nearGround) {
      coyote.current = PLAYER.coyoteTime;
      if (wasAirborne.current && spawnProtect.current <= 0) {
        const impact = Math.abs(peakFallSpeed.current);
        const grace = performance.now() < playerPhysics.spawnGraceUntil;
        if (!grace && impact > 14) {
          const dmg = Math.round((impact - 14) * 8);
          useGameStore.getState().damagePlayer(dmg);
          playerPhysics.punch(0.08);
        } else if (!grace && impact > 4) {
          playSfx("/assets/audio/kenney-fps/land.ogg", 0.22);
          playerPhysics.punch(0.035);
          useFxStore.getState().pulseShake(0.035, 90);
          combatFx.pushImpact(
            new THREE.Vector3(pos.x, 0.15, pos.z),
            "#94a3b8",
          );
        } else if (impact > 1.5) {
          playerPhysics.punch(0.01);
        }
        wasAirborne.current = false;
        peakFallSpeed.current = 0;
      }
    } else {
      coyote.current = Math.max(0, coyote.current - dt);
    }

    if (pos.y < -8) {
      const cp = useGameStore.getState().checkpoint;
      const canHurt = spawnProtect.current <= 0;
      body.setTranslation(
        { x: cp.x, y: Math.max(cp.y, 2.2), z: cp.z },
        true,
      );
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      playerPhysics.knock.set(0, 0, 0);
      spawnProtect.current = Math.max(spawnProtect.current, 2.5);
      if (canHurt) {
        useGameStore.getState().damagePlayer(15);
      }
      useGameStore.setState({
        invulnerableUntil: performance.now() + 2500,
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

    const knock = playerPhysics.knock;
    knock.multiplyScalar(Math.exp(-dt * 4.2));
    if (knock.lengthSq() < 0.01) knock.set(0, 0, 0);

    const airControl = nearGround ? 1 : 0.72;
    const hx = wish.x * speed * airControl + knock.x;
    const hz = wish.z * speed * airControl + knock.z;
    let hy = vel.y + knock.y;
    knock.y *= Math.exp(-dt * 6);
    if (spawnProtect.current > 0) {
      hy = Math.max(0, hy * 0.2);
    } else if (nearGround && hy < 0) {
      // Stick to floor — prevents Rapier depenetration launches
      hy = 0;
    }

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
      playSfx("/assets/audio/kenney-fps/jump_a.ogg", 0.28);
      playerPhysics.punch(-0.045);
      combatFx.pushImpact(
        new THREE.Vector3(pos.x, 0.1, pos.z),
        "#94a3b8",
      );
      coyote.current = 0;
      jumpBuffer.current = 0;
      canCutJump.current = true;
    };

    if (coyote.current > 0 && jumpBuffer.current > 0) {
      tryJump();
    }

    if (!jumpHeld.current && canCutJump.current) {
      const v = body.linvel();
      if (v.y > 2) {
        body.setLinvel({ x: v.x, y: v.y * 0.45, z: v.z }, true);
      }
      canCutJump.current = false;
    }
    if (nearGround) canCutJump.current = false;

    padCooldown.current = Math.max(0, padCooldown.current - dt);
    const onPad =
      performance.now() >= playerPhysics.spawnGraceUntil &&
      ((Math.hypot(pos.x - 0, pos.z + 28) < 1.8 && pos.y < 1.5) ||
        (Math.hypot(pos.x - 8, pos.z + 48) < 1.8 && pos.y < 1.5));
    if (onPad && vel.y <= 0.5 && padCooldown.current <= 0) {
      body.applyImpulse({ x: wish.x * 2, y: 16, z: wish.z * 2 }, true);
      playSfx("/assets/audio/kenney-fps/jump_a.ogg", 0.35);
      padCooldown.current = 0.6;
      playerPhysics.punch(-0.06);
    }

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

    const camPos = body.translation();
    camera.position.set(camPos.x + shakeX, camPos.y + 0.6 + shakeY, camPos.z);
    camera.rotation.order = "YXZ";
    camera.rotation.y = yaw.current + playerPhysics.punchYaw;
    camera.rotation.x = pitch.current + playerPhysics.punchPitch;
    // Quake sprint FOV punch
    const persp = camera as THREE.PerspectiveCamera;
    if (persp.isPerspectiveCamera) {
      const targetFov = playerLocomotion.sprinting ? 82 : 75;
      persp.fov += (targetFov - persp.fov) * Math.min(1, dt * 8);
      persp.updateProjectionMatrix();
    }
  });

  return (
    <RigidBody
      ref={bodyRef}
      position={[spawn.current.x, spawn.current.y, spawn.current.z]}
      enabledRotations={[false, false, false]}
      colliders={false}
      mass={1}
      friction={1.2}
      linearDamping={0.02}
      ccd
    >
      <CapsuleCollider args={[PLAYER.height * 0.25, PLAYER.radius]} />
    </RigidBody>
  );
}
