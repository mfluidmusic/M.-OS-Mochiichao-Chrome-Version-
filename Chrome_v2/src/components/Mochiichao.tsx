import { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Sparkles } from "@react-three/drei";
import { Group, Mesh } from "three";
import * as THREE from "three";
import { ProceduralMochiichao } from "./ProceduralMochiichao";
import { UniversalModelLoader } from "./UniversalModelLoader";
import { useGameStore } from '../useGameStore';

interface MochiichaoProps {
  emotion: string;
  started: boolean;
  isIdle: boolean;
  latestMessage?: string;
  cameraMode?: "follow" | "stationary" | "free";
  isUpgrading?: boolean;
  characterId?: string;
  isHit?: boolean;
  isPrismatic?: boolean;
}

const DEFAULT_NEEDS = { hunger: 100, energy: 100, affection: 50 };

export function Mochiichao({
  emotion: propEmotion,
  started,
  isIdle,
  latestMessage,
  cameraMode = "follow",
  isUpgrading = false,
  characterId = "003",
  isHit = false,
  isPrismatic = false,
}: MochiichaoProps) {
  const needs = useGameStore(s => {
    const lead = s.roster.active_party[0];
    return lead?.needs || DEFAULT_NEEDS;
  });

  const entityObj = useGameStore(s => {
    const enemy = s.combat.opponent;
    if (enemy && (enemy.characterId === characterId || enemy.id === characterId)) return enemy;
    const allMochiis = s.roster.active_party.concat(s.roster.pc_box);
    return allMochiis.find(m => m.id === characterId || m.characterId === characterId);
  });

  const [goapAction, setGoapAction] = useState<"IDLE" | "FORAGE" | "SLEEP" | "NUZZLE">("IDLE");
  const active_banter = useGameStore(s => s.combat.active_banter);

  useEffect(() => {
     if (!isIdle) {
        setGoapAction("IDLE");
        return;
     }
     if (needs.hunger < 30) setGoapAction("FORAGE");
     else if (needs.energy < 20) setGoapAction("SLEEP");
     else if (needs.affection > 80) setGoapAction("NUZZLE");
     else setGoapAction("IDLE");
  }, [needs, isIdle]);
  const [emotion, setEmotion] = useState(propEmotion);
  const [isBubbleVisible, setIsBubbleVisible] = useState(true);

  useEffect(() => {
    if (latestMessage) {
      setIsBubbleVisible(true);
    }
  }, [latestMessage]);

  useEffect(() => {
    setEmotion(propEmotion);
    if (propEmotion !== "IDLE") {
      const timer = setTimeout(() => {
        setEmotion("IDLE");
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [propEmotion]);

  const groupRef = useRef<Group>(null);
  const leftArmRef = useRef<Group>(null);
  const rightArmRef = useRef<Group>(null);
  const bodyRef = useRef<Mesh>(null);

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.traverse((child) => {
        if ((child as Mesh).isMesh) {
          const m = child as Mesh;
          if (!m.userData.originalMaterial) {
            m.userData.originalMaterial = m.material;
          }
          
          if (isHit) {
            m.material = new THREE.MeshBasicMaterial({ color: 'red' });
          } else {
            if (isPrismatic && m.userData.originalMaterial && (m.userData.originalMaterial as any).color) {
               const origMat = m.userData.originalMaterial as THREE.MeshStandardMaterial;
               const newMat = origMat.clone();
               newMat.color = new THREE.Color(1 - origMat.color.r, 1 - origMat.color.g, 1 - origMat.color.b);
               m.material = newMat;
            } else {
               m.material = m.userData.originalMaterial;
            }
          }
        }
      });
    }
  }, [isHit, isPrismatic, characterId]);

  const eyeScaleX = useRef(1);
  const eyeScaleY = useRef(1);
  const eyeRotZ = useRef(0);

  // Animation state
  const time = useRef(0);
  const targetPos = useRef(new THREE.Vector3(0, 0, 0));
  const isWalking = useRef(false);
  const nextMoveTimer = useRef(0);

  // Particles
  const particlesRef = useRef<THREE.InstancedMesh>(null);
  const MAX_PARTICLES = 30;
  const particleData = useRef<
    { life: number; pos: THREE.Vector3; vel: THREE.Vector3 }[]
  >(
    Array.from({ length: 30 }).map(() => ({
      life: 0,
      pos: new THREE.Vector3(),
      vel: new THREE.Vector3(),
    })),
  );

  useFrame((state, delta) => {
    if (!groupRef.current || isUpgrading) return;

    time.current += delta;
    const t = time.current;

    // Roaming logic
    if (isIdle && started) {
      if (goapAction === "SLEEP") {
         isWalking.current = false;
         // Don't roam, just sleep
      } else if (goapAction === "FORAGE") {
         // Pathfind to nearest flora/bush (mocked by picking random spots rapidly)
         nextMoveTimer.current -= delta;
         if (nextMoveTimer.current <= 0 && !isWalking.current) {
           targetPos.current.set((Math.random() - 0.5) * 10, 0, (Math.random() - 0.5) * 10);
           isWalking.current = true;
           nextMoveTimer.current = Math.random() * 2 + 1; // Faster roaming looking for food
         }
      } else if (goapAction === "NUZZLE") {
         // Follow player (camera.position) closely
         targetPos.current.set(state.camera.position.x, 0, state.camera.position.z + 1);
         isWalking.current = true;
      } else {
         // Default IDLE roaming
         nextMoveTimer.current -= delta;
         if (nextMoveTimer.current <= 0 && !isWalking.current) {
           // Pick new target (sandbox area is roughly -8 to 8)
           targetPos.current.set(
             (Math.random() - 0.5) * 8,
             0,
             (Math.random() - 0.5) * 8,
           );
           isWalking.current = true;
           nextMoveTimer.current = Math.random() * 5 + 3; // Wait 3-8 seconds before moving again after reaching target
         }
      }

      if (isWalking.current) {
        const currentPos = groupRef.current.position;
        // ignore Y distance
        const dist = new THREE.Vector2(currentPos.x, currentPos.z).distanceTo(
          new THREE.Vector2(targetPos.current.x, targetPos.current.z),
        );

        if (dist > 0.1) {
          // Move towards target
          const dir = targetPos.current.clone().sub(currentPos).normalize();
          dir.y = 0; // stay on ground
          groupRef.current.position.add(dir.multiplyScalar(delta * 1.5));

          // Rotate towards target
          const targetRotation = Math.atan2(dir.x, dir.z);
          const currentRotation = groupRef.current.rotation.y;
          let diff = targetRotation - currentRotation;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          groupRef.current.rotation.y += diff * delta * 5;

          // Massive Kaiju lumbering
          const bouncePhase = t * 8;
          const bounceY = Math.abs(Math.sin(bouncePhase));
          if (bodyRef.current) {
            bodyRef.current.position.y = bounceY * 0.15 + 0.6;
            bodyRef.current.scale.y =
              1 + bounceY * 0.05 - Math.abs(Math.cos(bouncePhase)) * 0.02;
            bodyRef.current.scale.x =
              1 - bounceY * 0.05 + Math.abs(Math.cos(bouncePhase)) * 0.05;
            bodyRef.current.scale.z = bodyRef.current.scale.x;
          }

          // Trigger particle effect when hitting the ground
          if (Math.sin(bouncePhase) > 0.9 && particlesRef.current) {
            const availableP = particleData.current.find((p) => p.life <= 0);
            if (availableP) {
              availableP.life = 1.0;
              availableP.pos.copy(groupRef.current.position);
              availableP.pos.y = 0.1;
              availableP.pos.x += (Math.random() - 0.5) * 0.8;
              availableP.pos.z += (Math.random() - 0.5) * 0.8;
              availableP.vel.set(
                (Math.random() - 0.5) * 2,
                Math.random() * 2 + 1,
                (Math.random() - 0.5) * 2,
              );
            }
          }
        } else {
          isWalking.current = false;
        }
      }
    } else {
      isWalking.current = false;
    }

    // Update Particles
    if (particlesRef.current) {
      const dummyObj = new THREE.Object3D();
      for (let i = 0; i < MAX_PARTICLES; i++) {
        const p = particleData.current[i];
        if (p.life > 0) {
          p.life -= delta * 1.5;
          p.pos.addScaledVector(p.vel, delta);
          p.vel.y -= delta * 5; // gravity
          if (p.pos.y < 0) p.pos.y = 0;
          dummyObj.position.copy(p.pos);
          const s = p.life * 0.3;
          dummyObj.scale.set(s, s, s);
          dummyObj.updateMatrix();
          particlesRef.current.setMatrixAt(i, dummyObj.matrix);
        } else {
          dummyObj.scale.set(0, 0, 0);
          dummyObj.updateMatrix();
          particlesRef.current.setMatrixAt(i, dummyObj.matrix);
        }
      }
      particlesRef.current.instanceMatrix.needsUpdate = true;
    }

    // Idle mechanical breathing animation (stiffer)
    if (!isWalking.current && bodyRef.current) {
      bodyRef.current.position.y = Math.sin(t * 1.5) * 0.02 + 0.5;
      bodyRef.current.scale.y = 1 + Math.sin(t * 1.5) * 0.01;
      bodyRef.current.scale.x = 1 - Math.sin(t * 1.5) * 0.01;
      bodyRef.current.scale.z = bodyRef.current.scale.x;
    }

    // Arm animations (floating and fluid)
    let targetRightArmRotZ = 0;
    let targetRightArmRotX = 0;
    let targetLeftArmRotZ = 0;
    let targetLeftArmRotX = 0;

    if (emotion === "WAVE") {
      targetRightArmRotZ = Math.sin(t * 8) * 0.5 + 2.5;
      targetRightArmRotX = Math.sin(t * 4) * 0.2;
      targetLeftArmRotZ = -0.3;
      targetLeftArmRotX = Math.sin(t * 2) * 0.1;
    } else if (isWalking.current) {
      targetRightArmRotX = Math.sin(t * 12) * 0.6;
      targetRightArmRotZ = Math.sin(t * 6) * 0.1 + 0.3;
      targetLeftArmRotX = Math.sin(t * 12 + Math.PI) * 0.6;
      targetLeftArmRotZ = Math.sin(t * 6 + Math.PI) * 0.1 - 0.3;
    } else {
      // Fluid idle floaty arms extending to ground
      targetRightArmRotZ = Math.sin(t * 1.5) * 0.08 + 0.25;
      targetRightArmRotX = Math.sin(t * 1) * 0.05;
      targetLeftArmRotZ = -Math.sin(t * 1.5 + 1) * 0.08 - 0.25;
      targetLeftArmRotX = Math.sin(t * 1 + 1) * 0.05;

      if (emotion === "EXCITED" || emotion === "LAUGH") {
        targetRightArmRotZ = Math.sin(t * 15) * 0.2 + 2.2;
        targetRightArmRotX = -0.5;
        targetLeftArmRotZ = -Math.sin(t * 15) * 0.2 - 2.2;
        targetLeftArmRotX = -0.5;
      } else if (emotion === "SAD") {
        targetRightArmRotZ = 0.15;
        targetRightArmRotX = 0.2;
        targetLeftArmRotZ = -0.15;
        targetLeftArmRotX = 0.2;
      } else if (emotion === "ANGRY") {
        targetRightArmRotZ = 0.8;
        targetRightArmRotX = -0.5;
        targetLeftArmRotZ = -0.8;
        targetLeftArmRotX = -0.5;
      } else if (emotion === "CONFUSED") {
        targetRightArmRotZ = Math.sin(t * 2) * 0.1 + 0.5;
        targetRightArmRotX = -0.2;
        targetLeftArmRotZ = -0.3;
        targetLeftArmRotX = 0.1;
      } else if (emotion === "THINK") {
        targetRightArmRotZ = Math.sin(t * 1.5) * 0.05 + 1.2;
        targetRightArmRotX = -0.4;
      }
    }

    if (rightArmRef.current) {
      rightArmRef.current.rotation.z = THREE.MathUtils.lerp(
        rightArmRef.current.rotation.z,
        targetRightArmRotZ,
        delta * 8,
      );
      rightArmRef.current.rotation.x = THREE.MathUtils.lerp(
        rightArmRef.current.rotation.x,
        targetRightArmRotX,
        delta * 8,
      );
    }
    if (leftArmRef.current) {
      leftArmRef.current.rotation.z = THREE.MathUtils.lerp(
        leftArmRef.current.rotation.z,
        targetLeftArmRotZ,
        delta * 8,
      );
      leftArmRef.current.rotation.x = THREE.MathUtils.lerp(
        leftArmRef.current.rotation.x,
        targetLeftArmRotX,
        delta * 8,
      );
    }

    // Look at camera or sway slightly (only if not walking)
    if (!isWalking.current) {
      const currentRotation = groupRef.current.rotation.y;
      let targetRotY = 0;

      // Face camera if not idle
      if (!isIdle) {
        targetRotY = Math.atan2(
          state.camera.position.x - groupRef.current.position.x,
          state.camera.position.z - groupRef.current.position.z,
        );
      }

      if (emotion === "THINK") {
        if (isIdle) targetRotY += Math.sin(t) * 0.2 + 0.5;
        groupRef.current.rotation.x = THREE.MathUtils.lerp(
          groupRef.current.rotation.x,
          -0.1,
          delta * 5,
        );
      } else if (emotion === "SAD") {
        groupRef.current.rotation.x = THREE.MathUtils.lerp(
          groupRef.current.rotation.x,
          0.2,
          delta * 5,
        );
      } else {
        if (isIdle) targetRotY = Math.sin(t * 0.5) * 0.1;
        groupRef.current.rotation.x = THREE.MathUtils.lerp(
          groupRef.current.rotation.x,
          Math.sin(t * 1) * 0.05,
          delta * 5,
        );
      }

      let diff = targetRotY - currentRotation;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      groupRef.current.rotation.y += diff * delta * 5;
    }

    // CAMERA LOGIC
    const breathingOffset = Math.sin(t * 1.5) * 0.05;
    const currentCameraPos = state.camera.position;
    const currentPos = groupRef.current.position;

    if (cameraMode === "stationary") {
      if (state.controls && (state.controls as any).target) {
        const targetPoint = new THREE.Vector3(currentPos.x, 0.5, currentPos.z);
        (state.controls as any).target.lerp(targetPoint, delta * 2.5);
      }
    } else if (cameraMode === "follow") {
      let targetCamPos = new THREE.Vector3();

      if (!started) {
        // Boot screen cam
        targetCamPos.set(0, 1.5, 4);
      } else if (isIdle && isWalking.current) {
        // Follow him from behind/side with heavy camera shake
        const shake = Math.sin(t * 8) * 0.1;
        targetCamPos.set(
          currentPos.x - Math.sin(groupRef.current.rotation.y) * 4,
          2.5 + breathingOffset + shake,
          currentPos.z - Math.cos(groupRef.current.rotation.y) * 4,
        );
      } else if (isIdle && !isWalking.current) {
        // Relaxed view drifting
        targetCamPos.set(
          currentPos.x + Math.sin(t * 0.2) * 3,
          1.5 + breathingOffset,
          currentPos.z + 4,
        );
      } else {
        // Active conversation view: closer, directly in front of him from camera's perspective
        const dirToCam = new THREE.Vector3()
          .copy(currentCameraPos)
          .sub(currentPos);
        dirToCam.y = 0;

        if (dirToCam.lengthSq() < 0.1) {
          dirToCam.set(0, 0, 1);
        } else {
          dirToCam.normalize();
        }

        targetCamPos.set(
          currentPos.x + dirToCam.x * 4,
          1.5 + breathingOffset,
          currentPos.z + dirToCam.z * 4,
        );
      }

      // Lerp camera position
      state.camera.position.lerp(targetCamPos, delta * 2.5);

      // Smooth lookAt
      const targetLookAt = new THREE.Vector3(
        currentPos.x,
        currentPos.y + 0.5,
        currentPos.z,
      );
      const currentQuat = state.camera.quaternion.clone();
      state.camera.lookAt(targetLookAt);
      const targetQuat = state.camera.quaternion.clone();
      state.camera.quaternion.copy(currentQuat).slerp(targetQuat, delta * 5);
    }
  });

  // Expressions setup
  let eyeY = 0.2;
  let mouthX = 0;
  let mouthY = 0.05;
  let useLinesForEyes = false;
  eyeScaleX.current = 1;
  eyeScaleY.current = 1;
  eyeRotZ.current = 0;

  if (goapAction === "SLEEP") {
    useLinesForEyes = true;
    eyeScaleX.current = 1.2;
    eyeScaleY.current = 0.2;
    eyeY = 0.15;
  } else if (
    emotion === "HAPPY" ||
    emotion === "SMILE" ||
    emotion === "EXCITED" ||
    emotion === "LAUGH"
  ) {
    eyeScaleX.current = 1.2;
    eyeScaleY.current = 1.2;
    if (emotion === "LAUGH") {
      useLinesForEyes = true;
    }
  } else if (emotion === "SURPRISE") {
    eyeScaleX.current = 1.3;
    eyeScaleY.current = 1.5;
    eyeY = 0.25;
  } else if (emotion === "SAD") {
    eyeScaleX.current = 1;
    eyeScaleY.current = 0.6;
    eyeY = 0.15;
    eyeRotZ.current = 0.2;
  } else if (emotion === "THINK") {
    eyeScaleX.current = 0.9;
    eyeScaleY.current = 0.9;
  } else if (emotion === "ANGRY") {
    eyeScaleX.current = 1.1;
    eyeScaleY.current = 0.5;
    eyeRotZ.current = -0.3;
    eyeY = 0.18;
  } else if (emotion === "CONFUSED") {
    eyeScaleX.current = 1.2;
    eyeScaleY.current = 0.8;
  }

  // Mouth expressions
  const renderMouth = () => {
    if (
      emotion === "HAPPY" ||
      emotion === "SMILE" ||
      emotion === "WAVE" ||
      emotion === "EXCITED"
    ) {
      return (
        <mesh rotation={[0, 0, Math.PI]}>
          <ringGeometry args={[0.05, 0.1, 16, 1, 0, Math.PI]} />
          <meshBasicMaterial color="#fcd34d" side={THREE.DoubleSide} />
        </mesh>
      );
    }
    if (emotion === "LAUGH") {
      return (
        <mesh rotation={[0, 0, Math.PI]}>
          <ringGeometry args={[0.08, 0.12, 16, 1, 0, Math.PI]} />
          <meshBasicMaterial color="#fcd34d" side={THREE.DoubleSide} />
        </mesh>
      );
    }
    if (emotion === "SURPRISE") {
      return (
        <mesh>
          <circleGeometry args={[0.08, 16]} />
          <meshBasicMaterial color="#fcd34d" />
        </mesh>
      );
    }
    if (emotion === "SAD") {
      return (
        <mesh position={[0, -0.05, 0]}>
          <ringGeometry args={[0.05, 0.1, 16, 1, 0, Math.PI]} />
          <meshBasicMaterial color="#fcd34d" side={THREE.DoubleSide} />
        </mesh>
      );
    }
    if (emotion === "CONFUSED") {
      return (
        <mesh rotation={[0, 0, 0.2]}>
          <capsuleGeometry args={[0.02, 0.08]} />
          <meshBasicMaterial color="#fcd34d" />
        </mesh>
      );
    }
    if (emotion === "ANGRY") {
      return (
        <mesh position={[0, 0.05, 0]} rotation={[0, 0, Math.PI]}>
          <ringGeometry args={[0.05, 0.1, 16, 1, 0, Math.PI]} />
          <meshBasicMaterial color="#fcd34d" side={THREE.DoubleSide} />
        </mesh>
      );
    }
    // IDLE, THINK, default
    return (
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.02, 0.08]} />
        <meshBasicMaterial color="#fcd34d" />
      </mesh>
    );
  };

  const particleColor =
    characterId === "001"
      ? "#0ea5e9"
      : characterId === "002"
        ? "#ffffff"
        : "#C2B280";

  return (
    <>
      <instancedMesh
        ref={particlesRef}
        args={[undefined, undefined, MAX_PARTICLES]}
        castShadow
      >
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial
          color={particleColor}
          roughness={1}
          opacity={0.6}
          transparent
          depthWrite={false}
        />
      </instancedMesh>
      <group
        ref={groupRef}
        position={[0, 0, 0]}
        onPointerDown={(e) => {
          e.stopPropagation();
          setEmotion(Math.random() > 0.5 ? "EXCITED" : "LAUGH");
        }}
      >
        {/* Zzz for sleeping */}
        {goapAction === "SLEEP" && (
          <Html position={[0, 1.8, 0]} center>
            <div className="font-mono text-white/80 animate-pulse text-lg tracking-widest font-bold">
               Zzz...
            </div>
          </Html>
        )}

        {/* 3D Speech Bubble for Messages */}
        {latestMessage && started && isBubbleVisible && !active_banter && (
          <Html position={[0, 1.6, 0]} center zIndexRange={[100, 0]}>
            <div
              className="bg-white/95 backdrop-blur shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200 text-slate-900 rounded-[20px] font-sans text-sm cursor-pointer pointer-events-auto animate-in zoom-in duration-300 relative"
              style={{
                minWidth: "200px",
                maxWidth: "300px",
                padding: "12px 16px",
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                setIsBubbleVisible(false);
              }}
            >
              {latestMessage}
              <div className="mt-2 text-[8px] text-slate-400 uppercase tracking-widest text-center opacity-50">Tap to close</div>
              {/* Speech bubble tail */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-t-[10px] border-t-white/95 border-r-[8px] border-r-transparent filter drop-shadow-sm pointer-events-none"></div>
            </div>
          </Html>
        )}
        
        {/* Banter Speech Bubble (Phase 30) */}
        {active_banter && started && (
          <Html position={[0, 2.5, 0]} center zIndexRange={[100, 0]}>
            <div
              className="bg-red-900/90 backdrop-blur shadow-[0_0_30px_rgb(220,38,38,0.5)] border-2 border-red-500 text-white rounded-[20px] font-mono text-sm cursor-pointer pointer-events-auto animate-in zoom-in duration-100 relative"
              style={{
                minWidth: "200px",
                maxWidth: "320px",
                padding: "16px",
              }}
            >
              <div className="font-bold text-red-300 mb-1 flex items-center justify-between">
                 <span>[!] ALERT</span>
              </div>
              {active_banter}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-t-[10px] border-t-red-500 border-r-[8px] border-r-transparent filter drop-shadow-sm pointer-events-none"></div>
            </div>
          </Html>
        )}

        {isPrismatic && (
          <Sparkles count={50} scale={2} size={3} speed={0.4} opacity={0.8} color="#d946ef" position={[0, 0.5, 0]} />
        )}

        {/* Body Core rendering based on characterId */}
        {characterId === "001" /* Mochii (Original) */ && (
          <mesh ref={bodyRef} castShadow receiveShadow position={[0, 0.5, 0]}>
            <capsuleGeometry args={[0.5, 0.4, 16, 32]} />
            <meshStandardMaterial
              color="#0ea5e9"
              roughness={0.3}
              metalness={0.1}
            />
            {/* Face Display */}
            <mesh position={[0, 0.2, 0.46]}>
              <planeGeometry args={[0.7, 0.5]} />
              <meshStandardMaterial color="#050505" />

              {/* Left Eye */}
              <group
                position={[-0.15, eyeY - 0.4, 0.01]}
                scale={[eyeScaleX.current, eyeScaleY.current, 1]}
                rotation={[0, 0, eyeRotZ.current]}
              >
                {useLinesForEyes ? (
                  <mesh rotation={[0, 0, Math.PI / 2]}>
                    <ringGeometry args={[0.04, 0.07, 16, 1, 0, Math.PI]} />
                    <meshBasicMaterial
                      color="#34d399"
                      side={THREE.DoubleSide}
                    />
                  </mesh>
                ) : (
                  <mesh>
                    <circleGeometry args={[0.07, 16]} />
                    <meshBasicMaterial color="#34d399" />
                  </mesh>
                )}
              </group>

              {/* Right Eye */}
              <group
                position={[0.15, eyeY - 0.4, 0.01]}
                scale={[eyeScaleX.current, eyeScaleY.current, 1]}
                rotation={[0, 0, -eyeRotZ.current]}
              >
                {useLinesForEyes ? (
                  <mesh rotation={[0, 0, Math.PI / 2]}>
                    <ringGeometry args={[0.04, 0.07, 16, 1, 0, Math.PI]} />
                    <meshBasicMaterial
                      color="#34d399"
                      side={THREE.DoubleSide}
                    />
                  </mesh>
                ) : (
                  <mesh>
                    <circleGeometry args={[0.07, 16]} />
                    <meshBasicMaterial color="#34d399" />
                  </mesh>
                )}
              </group>

              {/* Mouth */}
              <group position={[mouthX, mouthY - 0.4, 0.01]}>{renderMouth()}</group>
            </mesh>
          </mesh>
        )}

        {characterId === "002" /* Razorgater (Chrome) */ && (
          <mesh ref={bodyRef} castShadow receiveShadow position={[0, 0.5, 0]}>
            <capsuleGeometry args={[0.5, 0.6, 16, 32]} />
            <meshStandardMaterial
              color="#4e342e"
              roughness={0.8}
              metalness={0.2}
            />

            {/* Chrome Bottom Jaw */}
            <mesh position={[0, -0.4, 0.1]}>
              <boxGeometry args={[0.9, 0.4, 0.9]} />
              <meshStandardMaterial
                color="#eeeeee"
                roughness={0.1}
                metalness={1.0}
                envMapIntensity={2.0}
              />
            </mesh>

            {/* Chrome Dorsal Spines */}
            <group position={[0, 0.2, -0.45]}>
              <mesh rotation={[0.4, 0, 0]} position={[0, 0.4, 0]}>
                <coneGeometry args={[0.15, 0.4, 4]} />
                <meshStandardMaterial
                  color="#cccccc"
                  roughness={0.1}
                  metalness={1.0}
                />
              </mesh>
              <mesh rotation={[0.6, 0, 0]} position={[0, 0, 0.1]}>
                <coneGeometry args={[0.15, 0.4, 4]} />
                <meshStandardMaterial
                  color="#cccccc"
                  roughness={0.1}
                  metalness={1.0}
                />
              </mesh>
              <mesh rotation={[0.8, 0, 0]} position={[0, -0.4, 0.2]}>
                <coneGeometry args={[0.12, 0.3, 4]} />
                <meshStandardMaterial
                  color="#cccccc"
                  roughness={0.1}
                  metalness={1.0}
                />
              </mesh>
            </group>

            {/* Teeth on Chrome Jaw */}
            <group position={[0, -0.2, 0.45]}>
              <mesh position={[-0.2, 0.1, 0]}>
                <coneGeometry args={[0.05, 0.15, 4]} />
                <meshStandardMaterial
                  color="#ffffff"
                  roughness={0.1}
                  metalness={0.9}
                />
              </mesh>
              <mesh position={[0.2, 0.1, 0]}>
                <coneGeometry args={[0.05, 0.15, 4]} />
                <meshStandardMaterial
                  color="#ffffff"
                  roughness={0.1}
                  metalness={0.9}
                />
              </mesh>
            </group>

            {/* Face Display */}
            <mesh position={[0, 0.2, 0.46]}>
              <planeGeometry args={[0.7, 0.5]} />
              <meshStandardMaterial color="#050505" />

              <group
                position={[-0.15, eyeY - 0.2, 0.01]}
                scale={[eyeScaleX.current, eyeScaleY.current, 1]}
                rotation={[0, 0, eyeRotZ.current]}
              >
                {useLinesForEyes ? (
                  <mesh rotation={[0, 0, Math.PI / 2]}>
                    <ringGeometry args={[0.04, 0.07, 16, 1, 0, Math.PI]} />
                    <meshBasicMaterial
                      color="#fcd34d"
                      side={THREE.DoubleSide}
                    />
                  </mesh>
                ) : (
                  <mesh>
                    <circleGeometry args={[0.07, 16]} />
                    <meshBasicMaterial color="#fcd34d" />
                  </mesh>
                )}
              </group>

              <group
                position={[0.15, eyeY - 0.2, 0.01]}
                scale={[eyeScaleX.current, eyeScaleY.current, 1]}
                rotation={[0, 0, -eyeRotZ.current]}
              >
                {useLinesForEyes ? (
                  <mesh rotation={[0, 0, Math.PI / 2]}>
                    <ringGeometry args={[0.04, 0.07, 16, 1, 0, Math.PI]} />
                    <meshBasicMaterial
                      color="#fcd34d"
                      side={THREE.DoubleSide}
                    />
                  </mesh>
                ) : (
                  <mesh>
                    <circleGeometry args={[0.07, 16]} />
                    <meshBasicMaterial color="#fcd34d" />
                  </mesh>
                )}
              </group>

              <group position={[mouthX, mouthY - 0.2, 0.01]}>
                {renderMouth()}
              </group>
            </mesh>
          </mesh>
        )}

        {characterId === "003" /* Tyrage (Sand/Flesh) */ && (
          <mesh ref={bodyRef} castShadow receiveShadow position={[0, 1.2, 0]}>
            <capsuleGeometry args={[0.6, 0.5, 16, 32]} />
            <meshStandardMaterial
              color="#C2B280"
              roughness={0.9}
              metalness={0.0}
            />

            {/* Triceratops Helm (Bone Armor) */}
            <group position={[0, 0.45, 0.1]}>
              <mesh castShadow position={[0, 0, 0]}>
                <sphereGeometry
                  args={[0.5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]}
                />
                <meshStandardMaterial
                  color="#FFFFE0"
                  roughness={0.3}
                  metalness={0.1}
                  side={THREE.DoubleSide}
                />
              </mesh>
              <mesh position={[0, 0.3, -0.3]} rotation={[-0.5, 0, 0]}>
                <planeGeometry args={[1.2, 0.8]} />
                <meshStandardMaterial
                  color="#FFFFE0"
                  roughness={0.3}
                  metalness={0.1}
                  side={THREE.DoubleSide}
                />
              </mesh>

              {/* Tri-Horns */}
              <group>
                <mesh position={[-0.3, 0.2, 0.3]} rotation={[1, 0, -0.2]}>
                  <coneGeometry args={[0.08, 0.4, 8]} />
                  <meshStandardMaterial
                    color="#FFFFE0"
                    roughness={0.3}
                    metalness={0.1}
                  />
                </mesh>
                <mesh position={[0.3, 0.2, 0.3]} rotation={[1, 0, 0.2]}>
                  <coneGeometry args={[0.08, 0.4, 8]} />
                  <meshStandardMaterial
                    color="#FFFFE0"
                    roughness={0.3}
                    metalness={0.1}
                  />
                </mesh>
                <mesh position={[0, -0.1, 0.5]} rotation={[1.5, 0, 0]}>
                  <coneGeometry args={[0.06, 0.2, 8]} />
                  <meshStandardMaterial
                    color="#FFFFE0"
                    roughness={0.3}
                    metalness={0.1}
                  />
                </mesh>
              </group>
            </group>

            {/* Stegosaurus Dorsal Spine Plates (Bone Armor) */}
            <group position={[0, 0.3, -0.5]}>
              {[0, 1, 2, 3].map((i) => (
                <mesh
                  key={i}
                  rotation={[0.4 + i * 0.2, 0, 0]}
                  position={[0, -i * 0.25, -i * 0.1]}
                >
                  <coneGeometry args={[0.2 - i * 0.02, 0.5 - i * 0.05, 4]} />
                  <meshStandardMaterial
                    color="#FFFFE0"
                    roughness={0.3}
                    metalness={0.1}
                  />
                </mesh>
              ))}
            </group>

            {/* T-Rex Tail (Sand/Flesh) & Ankylosaurus Club (Bone) */}
            <group position={[0, -0.2, -0.6]} rotation={[-0.3, 0, 0]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.3, 0.1, 0.8, 16]} />
                <meshStandardMaterial color="#C2B280" roughness={0.9} />
              </mesh>
              {/* Club */}
              <mesh position={[0, -0.4, 0]}>
                <sphereGeometry args={[0.25, 8, 8]} />
                <meshStandardMaterial color="#FFFFE0" roughness={0.3} />
              </mesh>
              {/* Tail Spikes */}
              <mesh position={[-0.2, -0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
                <coneGeometry args={[0.1, 0.3, 4]} />
                <meshStandardMaterial color="#FFFFE0" roughness={0.3} />
              </mesh>
              <mesh position={[0.2, -0.4, 0]} rotation={[0, 0, -Math.PI / 2]}>
                <coneGeometry args={[0.1, 0.3, 4]} />
                <meshStandardMaterial color="#FFFFE0" roughness={0.3} />
              </mesh>
            </group>

            {/* Face Display (Embedded in T-Rex face) */}
            <mesh position={[0, 0.2, 0.58]}>
              <planeGeometry args={[0.6, 0.4]} />
              <meshStandardMaterial color="#0a0a0a" />

              {/* Left Eye */}
              <group
                position={[-0.15, eyeY - 0.2, 0.01]}
                scale={[eyeScaleX.current, eyeScaleY.current, 1]}
                rotation={[0, 0, eyeRotZ.current]}
              >
                {useLinesForEyes ? (
                  <mesh rotation={[0, 0, Math.PI / 2]}>
                    <ringGeometry args={[0.04, 0.07, 16, 1, 0, Math.PI]} />
                    <meshBasicMaterial
                      color="#fcd34d"
                      side={THREE.DoubleSide}
                    />
                  </mesh>
                ) : (
                  <mesh>
                    <circleGeometry args={[0.07, 16]} />
                    <meshBasicMaterial color="#fcd34d" />
                  </mesh>
                )}
              </group>
              {/* Right Eye */}
              <group
                position={[0.15, eyeY - 0.2, 0.01]}
                scale={[eyeScaleX.current, eyeScaleY.current, 1]}
                rotation={[0, 0, -eyeRotZ.current]}
              >
                {useLinesForEyes ? (
                  <mesh rotation={[0, 0, Math.PI / 2]}>
                    <ringGeometry args={[0.04, 0.07, 16, 1, 0, Math.PI]} />
                    <meshBasicMaterial
                      color="#fcd34d"
                      side={THREE.DoubleSide}
                    />
                  </mesh>
                ) : (
                  <mesh>
                    <circleGeometry args={[0.07, 16]} />
                    <meshBasicMaterial color="#fcd34d" />
                  </mesh>
                )}
              </group>

              {/* Mouth */}
              <group position={[0, -0.1, 0.01]}>{renderMouth()}</group>
            </mesh>

            {/* Left Leg */}
            <group position={[-0.6, -1.0, 0]}>
              <mesh castShadow position={[0, 0.3, 0]} rotation={[0.2, 0, 0]}>
                <capsuleGeometry args={[0.4, 0.6, 4, 16]} />
                <meshStandardMaterial color="#C2B280" roughness={0.9} />
              </mesh>
              <mesh castShadow position={[0, -0.3, -0.2]} rotation={[-0.2, 0, 0]}>
                <cylinderGeometry args={[0.2, 0.15, 0.7]} />
                <meshStandardMaterial color="#C2B280" roughness={0.9} />
              </mesh>
              <mesh castShadow position={[0, -0.7, 0.1]}>
                <boxGeometry args={[0.5, 0.2, 0.6]} />
                <meshStandardMaterial color="#C2B280" roughness={0.9} />
              </mesh>
              {/* Left Claws */}
              <mesh castShadow position={[-0.15, -0.7, 0.4]} rotation={[-1.5, 0, 0]}>
                <coneGeometry args={[0.05, 0.2, 8]} />
                <meshStandardMaterial color="#FFFFE0" roughness={0.3} />
              </mesh>
              <mesh castShadow position={[0, -0.7, 0.45]} rotation={[-1.5, 0, 0]}>
                <coneGeometry args={[0.05, 0.2, 8]} />
                <meshStandardMaterial color="#FFFFE0" roughness={0.3} />
              </mesh>
              <mesh castShadow position={[0.15, -0.7, 0.4]} rotation={[-1.5, 0, 0]}>
                <coneGeometry args={[0.05, 0.2, 8]} />
                <meshStandardMaterial color="#FFFFE0" roughness={0.3} />
              </mesh>
            </group>

            {/* Right Leg */}
            <group position={[0.6, -1.0, 0]}>
              <mesh castShadow position={[0, 0.3, 0]} rotation={[0.2, 0, 0]}>
                <capsuleGeometry args={[0.4, 0.6, 4, 16]} />
                <meshStandardMaterial color="#C2B280" roughness={0.9} />
              </mesh>
              <mesh castShadow position={[0, -0.3, -0.2]} rotation={[-0.2, 0, 0]}>
                <cylinderGeometry args={[0.2, 0.15, 0.7]} />
                <meshStandardMaterial color="#C2B280" roughness={0.9} />
              </mesh>
              <mesh castShadow position={[0, -0.7, 0.1]}>
                <boxGeometry args={[0.5, 0.2, 0.6]} />
                <meshStandardMaterial color="#C2B280" roughness={0.9} />
              </mesh>
              {/* Right Claws */}
              <mesh castShadow position={[-0.15, -0.7, 0.4]} rotation={[-1.5, 0, 0]}>
                <coneGeometry args={[0.05, 0.2, 8]} />
                <meshStandardMaterial color="#FFFFE0" roughness={0.3} />
              </mesh>
              <mesh castShadow position={[0, -0.7, 0.45]} rotation={[-1.5, 0, 0]}>
                <coneGeometry args={[0.05, 0.2, 8]} />
                <meshStandardMaterial color="#FFFFE0" roughness={0.3} />
              </mesh>
              <mesh castShadow position={[0.15, -0.7, 0.4]} rotation={[-1.5, 0, 0]}>
                <coneGeometry args={[0.05, 0.2, 8]} />
                <meshStandardMaterial color="#FFFFE0" roughness={0.3} />
              </mesh>
            </group>
          </mesh>
        )}

        {/* Arms Base based on characterId */}
        {characterId === "001" /* Mochii */ && (
          <>
            <group ref={leftArmRef} position={[-0.45, 0.4, 0]}>
              <mesh castShadow position={[0, -0.25, 0]}>
                <capsuleGeometry args={[0.15, 0.4, 8, 16]} />
                <meshStandardMaterial
                  color="#0ea5e9"
                  roughness={0.3}
                  metalness={0.1}
                />
              </mesh>
            </group>
            <group ref={rightArmRef} position={[0.45, 0.4, 0]}>
              <mesh castShadow position={[0, -0.25, 0]}>
                <capsuleGeometry args={[0.15, 0.4, 8, 16]} />
                <meshStandardMaterial
                  color="#0ea5e9"
                  roughness={0.3}
                  metalness={0.1}
                />
              </mesh>
            </group>
          </>
        )}

        {characterId === "002" /* Razorgater */ && (
          <>
            <group ref={leftArmRef} position={[-0.55, 0.5, 0]}>
              <mesh castShadow position={[0, -0.25, 0]}>
                <boxGeometry args={[0.2, 0.5, 0.25]} />
                <meshStandardMaterial color="#4e342e" roughness={0.8} />
              </mesh>
              <mesh position={[0, -0.5, 0.05]}>
                <coneGeometry args={[0.08, 0.2, 4]} />
                <meshStandardMaterial
                  color="#ffffff"
                  roughness={0.1}
                  metalness={0.9}
                />
              </mesh>
            </group>
            <group ref={rightArmRef} position={[0.55, 0.5, 0]}>
              <mesh castShadow position={[0, -0.25, 0]}>
                <boxGeometry args={[0.2, 0.5, 0.25]} />
                <meshStandardMaterial color="#4e342e" roughness={0.8} />
              </mesh>
              <mesh position={[0, -0.5, 0.05]}>
                <coneGeometry args={[0.08, 0.2, 4]} />
                <meshStandardMaterial
                  color="#ffffff"
                  roughness={0.1}
                  metalness={0.9}
                />
              </mesh>
            </group>
          </>
        )}

        {characterId === "003" /* Tyrage short arms */ && (
          <>
            <group ref={leftArmRef} position={[-0.55, 0.6, 0.4]}>
              <mesh castShadow position={[0, -0.1, 0]}>
                <boxGeometry args={[0.15, 0.25, 0.15]} />
                <meshStandardMaterial color="#C2B280" roughness={0.9} />
              </mesh>
              <mesh position={[0, -0.25, 0.05]}>
                <boxGeometry args={[0.12, 0.05, 0.2]} />
                <meshStandardMaterial color="#FFFFE0" roughness={0.3} />
              </mesh>
            </group>

            <group ref={rightArmRef} position={[0.55, 0.6, 0.4]}>
              <mesh castShadow position={[0, -0.1, 0]}>
                <boxGeometry args={[0.15, 0.25, 0.15]} />
                <meshStandardMaterial color="#C2B280" roughness={0.9} />
              </mesh>
              <mesh position={[0, -0.25, 0.05]}>
                <boxGeometry args={[0.12, 0.05, 0.2]} />
                <meshStandardMaterial color="#FFFFE0" roughness={0.3} />
              </mesh>
            </group>
          </>
        )}

        {parseInt(characterId) >= 32 && (
          <UniversalModelLoader 
             assetId={`MOCHII_${characterId}`}
             keyword={entityObj?.name || "Creature"}
             nameFallback={entityObj?.name || "Unknown Entity"}
             colorHex={isPrismatic ? "#FFD700" : (entityObj?.type?.includes("Flame") ? "#FF4500" : entityObj?.type?.includes("Aqua") ? "#00BFFF" : "#71717A")}
          />
        )}

        {/* Global Hit Flash Overlay */}
        {isHit && (
           <mesh position={[0, 0.5, 0]}>
              <sphereGeometry args={[0.8, 16, 16]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
           </mesh>
        )}
      </group>
    </>
  );
}
