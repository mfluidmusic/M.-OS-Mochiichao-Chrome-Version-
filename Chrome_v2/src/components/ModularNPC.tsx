import { Html } from "@react-three/drei";
import { RigidBody, useRapier, RapierRigidBody } from "@react-three/rapier";
import { useState, useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useAudioManager } from "../hooks/useAudioManager";

interface NPCProps {
  position: [number, number, number];
  archetype: "Normal" | "TipGiver" | "Funny" | "Esoteric" | "Silent" | "Elite";
  onInteract: () => void;
  name?: string;
}

export function ModularNPC({ position, archetype, onInteract, name = "Wanderer" }: NPCProps) {
  const [bubble, setBubble] = useState<string | null>(null);
  const [spotted, setSpotted] = useState(false);
  const { rapier, world } = useRapier();
  const rbRef = useRef<RapierRigidBody>(null);
  const { camera } = useThree();
  const { playSfx } = useAudioManager();

  const isHostile = archetype === "Elite";

  useFrame((state, delta) => {
    if (!rbRef.current) return;
    
    // Raycaster logic
    if (isHostile && !spotted) {
       const pos = rbRef.current.translation();
       // Cast ray forward
       const ray = new rapier.Ray(
         { x: pos.x, y: pos.y + 0.5, z: pos.z },
         { x: 0, y: 0, z: 1 } // Assumes facing +Z
       );
       const hit = world.castRay(ray, 10, true);
       if (hit && hit.collider) {
         // Is it the player? The player is a dynamic rigid body.
         if (hit.collider.parent()?.bodyType() === rapier.RigidBodyType.Dynamic) {
            setSpotted(true);
            playSfx('surprise_ping');
            setTimeout(() => {
               setBubble("You there! Prepare for a battle!");
               setTimeout(() => {
                  onInteract();
               }, 2000);
            }, 1000);
         }
       }
    }

    if (spotted) {
       // Cinematic Camera Snap
       const targetPos = new THREE.Vector3(position[0], position[1] + 1, position[2] + 2);
       camera.position.lerp(targetPos, 0.1);
       camera.lookAt(position[0], position[1] + 0.7, position[2]);
    }
  });

  const handleInteraction = () => {
    if (spotted) return;
    if (archetype === "Silent") {
      setBubble("...");
    } else if (archetype === "TipGiver") {
      setBubble("Did you know Pyropaws hate water? Keep them dry!");
    } else if (archetype === "Funny") {
      setBubble("I dropped my Capture Crux in the sand. Now it's crunchy.");
    } else {
      setBubble("The winds are shifting... The mythics awaken.");
    }
    setTimeout(() => setBubble(null), 4000);
    onInteract();
  };

  return (
    <RigidBody ref={rbRef} type="fixed" colliders="hull" position={position}>
      <mesh onClick={handleInteraction} castShadow>
        <capsuleGeometry args={[0.3, 0.8, 8, 16]} />
        <meshStandardMaterial color={isHostile ? "#ef4444" : "#3b82f6"} />
        
        {/* Head */}
        <mesh position={[0, 0.7, 0]}>
            <sphereGeometry args={[0.25, 16, 16]} />
            <meshStandardMaterial color="#fcd34d" />
        </mesh>
      </mesh>
      
      {spotted && (
        <Html position={[0, 2.5, 0]} center>
          <div className="text-red-500 font-bold text-4xl animate-bounce shadow-red-500" style={{ textShadow: '0 0 10px red' }}>
            [ ! ]
          </div>
        </Html>
      )}

      {bubble && (
        <Html position={[0, 1.5, 0]} center zIndexRange={[100, 0]}>
          <div className="bg-black/80 border border-white/20 text-white p-2 rounded max-w-[200px] text-xs pointer-events-none">
            <span className="font-bold text-cyan-400 block mb-1">{name}</span>
            {bubble}
          </div>
        </Html>
      )}
    </RigidBody>
  );
}
