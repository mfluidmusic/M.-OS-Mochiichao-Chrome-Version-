import { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Mochiichao } from "./Mochiichao";
import { useGameStore } from "../useGameStore";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

interface EvolutionCutsceneProps {
  characterId: string;
  nextCharacterId: string;
  type: string;
  onComplete: () => void;
}

export function EvolutionCutscene({ characterId, nextCharacterId, type, onComplete }: EvolutionCutsceneProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const DURATION = 5; // seconds
  const [time, setTime] = useState(0);

  const colors: Record<string, string> = {
    Flame: "#ff4400",
    Aqua: "#00aaff",
    Flora: "#00ff44",
    Cosmic: "#aa00ff",
    Cyber: "#00ffff",
    Chrome: "#cccccc"
  };
  const colorHex = colors[type] || "#ffffff";

  // Voxel data
  const COUNT = 1000;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const particles = useMemo(() => {
    const data = [];
    for (let i = 0; i < COUNT; i++) {
       // Start arranged roughly as original silhouette (sphere for now)
       const r = Math.random() * 0.8;
       const theta = Math.random() * 2 * Math.PI;
       const phi = Math.acos((Math.random() * 2) - 1);
       const x = r * Math.sin(phi) * Math.cos(theta);
       const y = r * Math.sin(phi) * Math.sin(theta) + 0.5;
       const z = r * Math.cos(phi);
       
       data.push({
          startX: x, startY: y, startZ: z,
          speed: Math.random() * 2 + 1,
          angle: Math.random() * Math.PI * 2,
          radiusStart: Math.random() * 0.5,
          yOffset: Math.random() * 2
       });
    }
    return data;
  }, []);

  useFrame((state, delta) => {
    setTime(t => t + delta);
    const t = time;

    if (meshRef.current) {
      for (let i = 0; i < COUNT; i++) {
        const p = particles[i];
        
        // Swirl outward, then snap inward
        let currentRadius = p.radiusStart;
        let pY = p.startY;
        
        if (t < 3) {
           // Swirl outward
           currentRadius += t * p.speed * 0.5;
           pY += Math.sin(t * p.speed) * 0.5;
        } else if (t < 4.5) {
           // Snap inward intensely
           const snapProgress = (t - 3) / 1.5;
           currentRadius = THREE.MathUtils.lerp(currentRadius + 3 * p.speed * 0.5, 0.1, snapProgress * snapProgress); // accelerate in
        } else {
           // Boom! Hide particles
           dummy.scale.set(0, 0, 0);
           dummy.updateMatrix();
           meshRef.current.setMatrixAt(i, dummy.matrix);
           continue;
        }

        const angle = p.angle + t * 5;
        dummy.position.set(Math.cos(angle) * currentRadius, pY, Math.sin(angle) * currentRadius);
        dummy.rotation.set(t, p.speed * t, t);
        dummy.scale.setScalar(0.05 + Math.random() * 0.05); // slightly flicker size
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
    }

    if (t > DURATION) {
       onComplete();
    }
  });

  return (
    <group>
      {/* Voxel Tornado */}
      {time < 4.5 && (
        <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={colorHex} emissive={colorHex} emissiveIntensity={time < 3 ? 2 : 10} />
        </instancedMesh>
      )}

      {/* Flashing Shockwave */}
      {time >= 4.5 && time < 4.8 && (
        <mesh position={[0, 1, 0]}>
           <sphereGeometry args={[10, 32, 32]} />
           <meshBasicMaterial color="#ffffff" transparent opacity={1 - ((time - 4.5) / 0.3)} />
        </mesh>
      )}

      {/* Show the original model at start, then the evolved one at end */}
      {time < 1.5 && (
         <Mochiichao emotion="SURPRISE" started={true} isIdle={false} characterId={characterId} />
      )}
      {time >= 4.5 && (
         <Mochiichao emotion="EXCITED" started={true} isIdle={false} characterId={nextCharacterId} />
      )}
    </group>
  );
}
