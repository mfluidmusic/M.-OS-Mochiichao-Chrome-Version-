import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, PerspectiveCamera, OrbitControls, Box, Detailed, Stars, Sky, Line } from '@react-three/drei';
import { Mochiichao } from './Mochiichao';
import { UniversalModelLoader } from './UniversalModelLoader';
import { EvolutionCutscene } from './EvolutionCutscene';
import { WaterPlane } from './WaterPlane';
import { MochiiPlex, Cantina, FloraDojo, ShamanSanctuary } from './Interiors';
import { ModularNPC } from './ModularNPC';
import { CaptureCrux } from './CaptureCrux';
import { Suspense, useEffect, useState, useMemo, useRef } from 'react';
import { EffectComposer, DepthOfField, Bloom, Pixelation } from '@react-three/postprocessing';
import { EnvironmentObjects } from './EnvironmentObjects';
import { Physics, RigidBody, useRapier, RapierRigidBody } from '@react-three/rapier';
import { createNoise2D } from 'simplex-noise';
import * as THREE from 'three';
import { DynamicComponentRegistry } from '../dynamic_components';
import { useGameStore } from '../useGameStore';

const SkyboxConstellations = () => {
   const alignment = useGameStore(s => s.world.astrological_alignment);
   const [points, setPoints] = useState<THREE.Vector3[]>([]);

   useEffect(() => {
      // Generate some simple constellation points based on seed (alignment name)
      const rng = (seed: string) => {
         let hash = 0;
         for (let i = 0; i < seed.length; i++) {
            hash = seed.charCodeAt(i) + ((hash << 5) - hash);
         }
         return () => {
            hash ^= hash << 13;
            hash ^= hash >> 17;
            hash ^= hash << 5;
            return (hash < 0 ? ~hash + 1 : hash) / 2147483647;
         };
      };
      
      const random = rng(alignment);
      const newPoints = [];
      const numStars = 5 + Math.floor(random() * 5);
      
      let currentPos = new THREE.Vector3(
         (random() - 0.5) * 80,
         30 + random() * 40,
         (random() - 0.5) * 80
      );
      
      for (let i = 0; i < numStars; i++) {
         newPoints.push(currentPos.clone());
         currentPos.add(new THREE.Vector3(
            (random() - 0.5) * 20,
            (random() - 0.5) * 20,
            (random() - 0.5) * 20
         ));
      }
      setPoints(newPoints);
   }, [alignment]);

   return (
      <group>
         {points.length > 0 && <Line points={points} color="white" lineWidth={1} opacity={0.3} transparent />}
         {points.map((p, i) => (
            <mesh key={i} position={p}>
               <sphereGeometry args={[0.5, 8, 8]} />
               <meshBasicMaterial color="#ffffff" />
            </mesh>
         ))}
      </group>
   );
};

const WeatherParticles = ({ type }: { type: 'rain' | 'snow' | 'sandstorm' }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = type === 'sandstorm' ? 2000 : 1000;
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
        temp.push({
            x: (Math.random() - 0.5) * 60,
            y: Math.random() * 20,
            z: (Math.random() - 0.5) * 60,
            speed: type === 'sandstorm' ? 0.3 + Math.random() * 0.5 : Math.random() * 0.2 + 0.1,
            phase: Math.random() * Math.PI * 2
        });
    }
    return temp;
  }, [count, type]);

  useFrame(() => {
    if (!meshRef.current) return;
    particles.forEach((particle, i) => {
       if (type === 'rain') {
           particle.y -= particle.speed * 2;
           if (particle.y < 0) particle.y = 20;
       } else if (type === 'snow') {
           particle.y -= particle.speed * 0.5;
           particle.x += Math.sin(particle.phase + particle.y) * 0.02;
           if (particle.y < 0) particle.y = 20;
       } else if (type === 'sandstorm') {
           particle.x += particle.speed;
           particle.z += particle.speed * 0.2;
           if (particle.x > 30) particle.x = -30;
           if (particle.z > 30) particle.z = -30;
       }
       
       dummy.position.set(particle.x, particle.y, particle.z);
       dummy.updateMatrix();
       meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (type === 'rain') {
      return (
          <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
              <cylinderGeometry args={[0.02, 0.02, 0.5]} />
              <meshBasicMaterial color="#3b82f6" transparent opacity={0.6} />
          </instancedMesh>
      );
  } else if (type === 'sandstorm') {
      return (
          <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
              <sphereGeometry args={[0.1]} />
              <meshBasicMaterial color="#b45309" transparent opacity={0.3} />
          </instancedMesh>
      );
  } else {
      return (
          <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
              <sphereGeometry args={[0.05]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
          </instancedMesh>
      );
  }
};


interface SceneProps {
  emotion: string;
  started: boolean;
  isIdle: boolean;
  latestMessage?: string;
  cameraMode?: 'follow' | 'stationary' | 'free';
  biome?: 'void' | 'ancient_cave' | 'desert' | 'rainforest' | 'neon_city' | 'junkyard' | 'castagnoli_exterior' | 'castagnoli_safari';
  seed?: string;
  isUpgrading?: boolean;
  characterId?: string;
  isBattling?: boolean;
  wildCharacterId?: string;
  wildIsPrismatic?: boolean;
  isPrismatic?: boolean;
  captureThrowing?: boolean;
  activeInterior?: "MochiiPlex" | "Cantina" | "FloraDojo" | "ShamanSanctuary" | null;
  onInteriorExit?: () => void;
  onHeal?: () => void;
  onPC?: () => void;
  onInteriorEnter?: (interior: "MochiiPlex" | "Cantina" | "FloraDojo" | "ShamanSanctuary") => void;
  onChallenge?: (masterName: string) => void;
  onCaptureHit?: () => void;
  onMeetNPC?: (npc: any) => void;
  evolutionData?: { id: string, next: string, type: string } | null;
  onEvolutionComplete?: () => void;
}

const ProceduralCity = ({ seed, onInteriorEnter }: { seed: string, onInteriorEnter?: (interior: "Cantina"|"MochiiPlex")=>void }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = 400;

  useEffect(() => {
    if (!meshRef.current) return;
    const noise2D = createNoise2D();
    const dummy = new THREE.Object3D();
    
    // Quick seeded random based on string sum
    const seedNum = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    let i = 0;
    for (let x = 0; x < 20; x++) {
      for (let z = 0; z < 20; z++) {
        const wx = (x - 10) * 3;
        const wz = (z - 10) * 3;
        // Don't spawn instances near our custom buildings
        if (Math.abs(wx - 5) < 3 && Math.abs(wz - (-10)) < 3) continue;
        if (Math.abs(wx - (-8)) < 4 && Math.abs(wz - (-5)) < 4) continue;

        const n = noise2D((wx + seedNum) * 0.05, (wz + seedNum) * 0.05);
        if (n > 0.2) {
          const height = Math.max(0.5, n * 12);
          dummy.position.set(wx, height / 2 - 0.5, wz);
          dummy.scale.set(2, height, 2);
          dummy.updateMatrix();
          meshRef.current.setMatrixAt(i, dummy.matrix);
          i++;
        }
      }
    }
    meshRef.current.count = i;
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [seed]);

  return (
    <group>
      <RigidBody type="fixed" colliders="hull">
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow receiveShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#1a1a24" roughness={0.2} metalness={0.8} />
        </instancedMesh>
        <mesh receiveShadow position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[60, 60]} />
          <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.6} />
        </mesh>
      </RigidBody>

      {/* Cantina Entrance */}
      <RigidBody type="fixed">
        <UniversalModelLoader assetId="BUILDING_CANTINA" keyword="Cyberpunk bar" position={[5, 1, -10]} scale={[2, 2, 2]} colorHex="#78350f" nameFallback="Cantina (Asset DB)" />
        <mesh position={[5, 1, -8.4]} onClick={(e) => { e.stopPropagation(); onInteriorEnter?.("Cantina"); }}>
          <planeGeometry args={[1.5, 2]} />
          <meshStandardMaterial color="#fcd34d" emissive="#f59e0b" emissiveIntensity={0.5} />
        </mesh>
      </RigidBody>

      {/* MochiiPlex Entrance */}
      <RigidBody type="fixed">
        <UniversalModelLoader assetId="BUILDING_MOCHIIPLEX" keyword="Sci-Fi Hospital" position={[-8, 1.5, -5]} scale={[3, 3, 3]} colorHex="#0ea5e9" nameFallback="MochiiPlex (Asset DB)" />
        <mesh position={[-8, 1, -1.9]} onClick={(e) => { e.stopPropagation(); onInteriorEnter?.("MochiiPlex"); }}>
          <planeGeometry args={[2, 2]} />
          <meshStandardMaterial color="#e0f2fe" emissive="#38bdf8" emissiveIntensity={1} />
        </mesh>
      </RigidBody>
    </group>
  );
};

const ProceduralJunkyard = ({ seed }: { seed: string }) => {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(60, 60, 128, 128);
    geo.rotateX(-Math.PI / 2);
    const noise2D = createNoise2D();
    const seedOffset = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) * 10;
    const positions = geo.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 2];
      let y = noise2D((x + seedOffset) * 0.3, (z + seedOffset) * 0.3) * 1.5;
      y += noise2D((x - seedOffset) * 0.8, (z + seedOffset) * 0.8) * 0.5;
      const distFromCenter = Math.sqrt(x*x + z*z);
      if (distFromCenter < 3) y *= distFromCenter / 3;
      positions[i + 1] = Math.abs(y);
    }
    geo.computeVertexNormals();
    return geo;
  }, [seed]);

  return (
    <RigidBody type="fixed" colliders="trimesh" friction={2.0}>
      <mesh geometry={geometry} receiveShadow position={[0, -0.5, 0]}>
        <meshStandardMaterial color="#68341b" roughness={0.8} metalness={0.6} wireframe={false} flatShading />
      </mesh>
    </RigidBody>
  );
};

const ProceduralCave = ({ seed }: { seed: string }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const mushroomRef = useRef<THREE.InstancedMesh>(null);
  const [rockBroken, setRockBroken] = useState(false);
  
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(60, 60, 64, 64);
    geo.rotateX(-Math.PI / 2);
    const noise2D = createNoise2D();
    const pos = geo.attributes.position.array;
    const seedOffset = seed.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

    for (let i = 0; i < pos.length; i += 3) {
      const x = pos[i];
      const z = pos[i + 2];
      const n = noise2D((x + seedOffset) * 0.05, (z + seedOffset) * 0.05);
      pos[i + 1] = Math.abs(n * 4); // Cavern floor hills
      
      // Edge walls
      const dist = Math.sqrt(x*x + z*z);
      if (dist > 25) {
        pos[i + 1] += (dist - 25) * 2;
      }
    }
    geo.computeVertexNormals();
    return geo;
  }, [seed]);

  useEffect(() => {
    if (!mushroomRef.current) return;
    const noise2D = createNoise2D();
    const dummy = new THREE.Object3D();
    const seedOffset = seed.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    
    let count = 0;
    for (let i = 0; i < 50; i++) {
        const x = (Math.random() - 0.5) * 40;
        const z = (Math.random() - 0.5) * 40;
        const n = noise2D((x + seedOffset) * 0.1, (z + seedOffset) * 0.1);
        if (n > 0.3) {
            dummy.position.set(x, n * 2, z);
            dummy.scale.setScalar(0.2 + Math.random() * 0.3);
            dummy.updateMatrix();
            mushroomRef.current.setMatrixAt(count++, dummy.matrix);
        }
    }
    mushroomRef.current.count = count;
    mushroomRef.current.instanceMatrix.needsUpdate = true;
  }, [seed]);

  return (
    <group>
      <RigidBody type="fixed" colliders="trimesh">
        <mesh geometry={geometry} receiveShadow position={[0, -0.5, 0]}>
          <meshStandardMaterial color="#2d2d2d" roughness={0.9} metalness={0.1} />
        </mesh>
      </RigidBody>

      {!rockBroken && (
        <RigidBody type="fixed">
          <mesh position={[5, 1, 5]} onClick={() => setRockBroken(true)}>
             <boxGeometry args={[3, 3, 3]} />
             <meshStandardMaterial color="#475569" roughness={0.9} />
          </mesh>
        </RigidBody>
      )}

      {rockBroken && (
         <group position={[5, 0.5, 5]}>
             <mesh position={[-1, 0, 0]} rotation={[0, 0.2, 0.5]}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#475569" /></mesh>
             <mesh position={[1, 0, 0.5]} rotation={[0.4, 0.1, 0]}><boxGeometry args={[1.5, 1, 1]} /><meshStandardMaterial color="#475569" /></mesh>
             <mesh position={[0, 0, -1]} rotation={[0, 0, 0.2]}><boxGeometry args={[1, 1, 1.2]} /><meshStandardMaterial color="#475569" /></mesh>
         </group>
      )}

      <instancedMesh ref={mushroomRef} args={[undefined, undefined, 50]} position={[0, -0.4, 0]}>
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshStandardMaterial color="#00f2ff" emissive="#00f2ff" emissiveIntensity={2} />
      </instancedMesh>
      {/* Cave Light Slit */}
      <spotLight position={[0, 20, 0]} angle={0.2} penumbra={1} intensity={10} color="#ffedd5" castShadow />
    </group>
  );
};

const ProceduralDesert = ({ seed, onInteriorEnter }: { seed: string, onInteriorEnter?: (interior: "ShamanSanctuary")=>void }) => {
  const pillarRef = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(100, 100, 64, 64);
    geo.rotateX(-Math.PI / 2);
    const noise2D = createNoise2D();
    const pos = geo.attributes.position.array;
    const seedOffset = seed.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

    for (let i = 0; i < pos.length; i += 3) {
      const x = pos[i];
      const z = pos[i + 2];
      const n = noise2D((x + seedOffset) * 0.02, (z + seedOffset) * 0.02);
      pos[i + 1] = n * 3; // Rolling dunes
    }
    geo.computeVertexNormals();
    return geo;
  }, [seed]);

  useEffect(() => {
    if (!pillarRef.current) return;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 30; i++) {
        const x = (Math.random() - 0.5) * 60;
        const z = (Math.random() - 0.5) * 60;
        // Keep clear around the temple
        if (Math.abs(x - 10) < 5 && Math.abs(z - 10) < 5) continue;
        
        dummy.position.set(x, 2, z);
        dummy.scale.set(1 + Math.random(), 4 + Math.random() * 6, 1 + Math.random());
        dummy.updateMatrix();
        pillarRef.current.setMatrixAt(i, dummy.matrix);
    }
    pillarRef.current.instanceMatrix.needsUpdate = true;
  }, [seed]);

  return (
    <group>
      <RigidBody type="fixed" colliders="trimesh">
        <mesh geometry={geometry} receiveShadow position={[0, -1, 0]}>
          <meshStandardMaterial color="#8b4513" roughness={1} metalness={0} />
        </mesh>
      </RigidBody>
      <instancedMesh ref={pillarRef} args={[undefined, undefined, 30]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#5d4037" roughness={0.9} />
      </instancedMesh>
      
      {/* Shaman Sanctuary Entrance */}
      <RigidBody type="fixed">
        <mesh position={[10, 1, 10]}>
          <boxGeometry args={[5, 4, 5]} />
          <meshStandardMaterial color="#b45309" />
        </mesh>
        <mesh position={[10, 0.5, 7.4]} onClick={(e) => { e.stopPropagation(); onInteriorEnter?.("ShamanSanctuary"); }}>
          <planeGeometry args={[2, 3]} />
          <meshStandardMaterial color="#fb923c" emissive="#f59e0b" emissiveIntensity={0.5} />
        </mesh>
      </RigidBody>

      {/* Seamless Open Cave */}
      <group position={[-15, 0, -15]}>
         {/* Back Wall */}
         <RigidBody type="fixed">
            <mesh position={[0, 3, -5]}>
               <boxGeometry args={[12, 8, 2]} />
               <meshStandardMaterial color="#3e2723" roughness={1} />
            </mesh>
         </RigidBody>
         {/* Left Wall */}
         <RigidBody type="fixed">
            <mesh position={[-5, 3, 0]}>
               <boxGeometry args={[2, 8, 12]} />
               <meshStandardMaterial color="#3e2723" roughness={1} />
            </mesh>
         </RigidBody>
         {/* Right Wall */}
         <RigidBody type="fixed">
            <mesh position={[5, 3, 0]}>
               <boxGeometry args={[2, 8, 12]} />
               <meshStandardMaterial color="#3e2723" roughness={1} />
            </mesh>
         </RigidBody>
         {/* Roof */}
         <RigidBody type="fixed">
            <mesh position={[0, 6.5, 0]}>
               <boxGeometry args={[12, 1, 12]} />
               <meshStandardMaterial color="#3e2723" roughness={1} />
            </mesh>
         </RigidBody>
         {/* Inner Glow / Crystal */}
         <pointLight position={[0, 2, -2]} color="#00ffff" intensity={2} distance={10} />
         <mesh position={[0, 1, -3]}>
            <octahedronGeometry args={[1]} />
            <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={1} />
         </mesh>
      </group>
    </group>
  );
};

const ProceduralRainforest = ({ seed, onInteriorEnter }: { seed: string, onInteriorEnter?: (interior: "FloraDojo")=>void }) => {
  const treeRef = useRef<THREE.InstancedMesh>(null);
  const foliageRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    if (!treeRef.current || !foliageRef.current) return;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 60; i++) {
        const x = (Math.random() - 0.5) * 60;
        const z = (Math.random() - 0.5) * 60;
        const height = 10 + Math.random() * 10;
        dummy.position.set(x, height/2 - 0.5, z);
        dummy.scale.set(0.8, height, 0.8);
        dummy.updateMatrix();
        treeRef.current.setMatrixAt(i, dummy.matrix);

        dummy.position.y += height/2;
        dummy.scale.set(4, 2, 4);
        dummy.updateMatrix();
        foliageRef.current.setMatrixAt(i, dummy.matrix);
    }
    treeRef.current.instanceMatrix.needsUpdate = true;
    foliageRef.current.instanceMatrix.needsUpdate = true;
  }, [seed]);

  return (
    <group>
      <RigidBody type="fixed">
        <mesh receiveShadow position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#064e3b" roughness={0.8} />
        </mesh>
      </RigidBody>
      
      {/* Flora Dojo Entrance */}
      <RigidBody type="fixed">
        <mesh position={[10, 2, -15]}>
          <boxGeometry args={[8, 4, 8]} />
          <meshStandardMaterial color="#022c22" />
        </mesh>
        <mesh position={[10, 1.5, -10.9]} onClick={(e) => { e.stopPropagation(); onInteriorEnter?.("FloraDojo"); }}>
          <planeGeometry args={[3, 3]} />
          <meshStandardMaterial color="#22c55e" emissive="#4ade80" emissiveIntensity={0.5} />
        </mesh>
        <pointLight position={[10, 3, -10]} color="#4ade80" intensity={2} />
      </RigidBody>

      {/* Water river */}
      <RigidBody type="fixed">
        <WaterPlane position={[0, -0.4, 0]} scale={[100, 10]} />
      </RigidBody>

      <instancedMesh ref={treeRef} args={[undefined, undefined, 60]} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 1]} />
        <meshStandardMaterial color="#2d1a12" />
      </instancedMesh>
      <instancedMesh ref={foliageRef} args={[undefined, undefined, 60]} castShadow>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial color="#10b981" emissive="#059669" emissiveIntensity={0.5} />
      </instancedMesh>
    </group>
  );
};

const TemporalLighting = ({ biome }: { biome: string }) => {
  const dirLight = useRef<THREE.DirectionalLight>(null);
  const ambientLight = useRef<THREE.AmbientLight>(null);
  
  // 1 game day = 2 minutes real time for demo purposes (usually 20 mins)
  const time = useRef(12 * 3600); // Start at noon (in seconds)
  
  useFrame((_, delta) => {
    // fast-forward time
    time.current += delta * 720; // 720x speed 
    if (time.current >= 24 * 3600) time.current = 0;
    
    const hour = time.current / 3600;
    const isDay = hour >= 6 && hour <= 18;
    
    if (dirLight.current) {
        // Orbit sun
        const angle = ((hour - 6) / 12) * Math.PI; // 0 to PI from 6 to 18
        if (isDay) {
            dirLight.current.position.set(Math.cos(angle) * 10, Math.sin(angle) * 10, 2);
            dirLight.current.intensity = biome === 'ancient_cave' ? 0.1 : biome === 'neon_city' ? 0.3 : Math.sin(angle) * 1.5;
            
            // Color lerp (morning/evening orange, noon white)
            const color = new THREE.Color();
            if (hour < 8 || hour > 16) color.setHex(0xffaa55);
            else color.setHex(0xffffff);
            dirLight.current.color.lerp(color, 0.1);
        } else {
            // Moonlight
            const nightAngle = ((hour < 6 ? hour + 18 : hour - 18) / 12) * Math.PI;
            dirLight.current.position.set(Math.cos(nightAngle) * 10, Math.sin(nightAngle) * 10, 2);
            dirLight.current.intensity = biome === 'ancient_cave' ? 0.05 : 0.2;
            dirLight.current.color.setHex(0x5555ff);
        }
    }
  });

  return (
    <>
      <ambientLight ref={ambientLight} intensity={biome === 'ancient_cave' ? 0.05 : biome === 'neon_city' ? 0.2 : biome === 'junkyard' ? 0.5 : 0.4} />
      <directionalLight 
        ref={dirLight}
        castShadow 
        shadow-mapSize={[2048, 2048]}
      >
        <orthographicCamera attach="shadow-camera" args={[-15, 15, 15, -15, 0.1, 50]} />
      </directionalLight>
    </>
  );
};

const SurfaceSnapper = ({ x = 0, z = 0, children }: { x?: number; z?: number; children: (y: number) => React.ReactNode }) => {
  const { rapier, world } = useRapier();
  const [snappedY, setSnappedY] = useState<number | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const ray = new rapier.Ray({ x, y: 50, z }, { x: 0, y: -1, z: 0 });
      const hit = world.castRay(ray, 100, true) as any;
      if (hit) {
        setSnappedY(50 - (hit.toi || hit.timeOfImpact));
      } else {
        setSnappedY(1);
      }
    }, 100);
    return () => clearTimeout(timeout);
  }, [x, z, world, rapier]);

  if (snappedY === null) return null;
  return <>{children(snappedY)}</>;
};

const CameraShakeRig = () => {
  const shakeRef = useRef(0);
  
  useEffect(() => {
    const onShake = () => {
      shakeRef.current += 1.0;
    };
    window.addEventListener("camera-shake", onShake);
    return () => window.removeEventListener("camera-shake", onShake);
  }, []);

  useFrame((state) => {
    if (shakeRef.current > 0) {
       state.camera.position.x += (Math.random() - 0.5) * shakeRef.current * 0.5;
       state.camera.position.y += (Math.random() - 0.5) * shakeRef.current * 0.5;
       shakeRef.current *= 0.85; // decay
       if (shakeRef.current < 0.01) {
          shakeRef.current = 0;
          // snap back loosely if needed, orbital controls might override this anyway
       }
    }
  });

  return null;
};

const WildCombatWrapper = ({ y, wildCharacterId, started, cameraMode, isUpgrading, wildIsPrismatic }: any) => {
  const rbRef = useRef<RapierRigidBody>(null);
  const [isHit, setIsHit] = useState(false);
  
  useEffect(() => {
    const handleHit = (e: any) => {
      if (rbRef.current) {
         // Screen Shake
         const damage = e.detail?.damage || 10;
         window.dispatchEvent(new CustomEvent("camera-shake", { detail: { intensity: damage * 0.1 } }));
         
         // Hit flash
         setIsHit(true);

         // Hit-Stop logic (150ms pause)
         // By using useGameStore, we could pause all entities. For now, freeze this rigid body briefly
         rbRef.current.sleep();
         
         setTimeout(() => {
            setIsHit(false);
            if (rbRef.current) {
               rbRef.current.wakeUp();
               // Apply knockback impulse
               rbRef.current.applyImpulse({ x: (Math.random() - 0.5) * 5, y: 5 + Math.random() * 5, z: -10 }, true);
            }
         }, 150);
      }
    };
    window.addEventListener("combat-hit", handleHit);
    return () => window.removeEventListener("combat-hit", handleHit);
  }, []);

  return (
    <RigidBody ref={rbRef} position={[0, y + 1, -3]} type="dynamic" mass={1} linearDamping={2} angularDamping={5} colliders="hull" enabledRotations={[false, false, false]}>
      <Mochiichao emotion="ANGRY" started={started} isIdle={true} cameraMode={cameraMode} isUpgrading={isUpgrading} characterId={wildCharacterId} isPrismatic={wildIsPrismatic} isHit={isHit} />
    </RigidBody>
  );
};

export function Scene({ 
  emotion, 
  started, 
  isIdle, 
  latestMessage, 
  cameraMode = 'follow', 
  biome = 'void', 
  seed = 'mochii', 
  isUpgrading = false, 
  characterId = "003",
  isBattling = false,
  wildCharacterId,
  wildIsPrismatic = false,
  isPrismatic = false,
  captureThrowing = false,
  activeInterior = null,
  onInteriorExit,
  onHeal,
  onPC,
  onInteriorEnter,
  onChallenge,
  onCaptureHit,
  onMeetNPC,
  evolutionData,
  onEvolutionComplete
}: SceneProps) {
  const [focusDistance, setFocusDistance] = useState(0); // Blurry at first
  const [wipeIntensity, setWipeIntensity] = useState(0);
  const wipeRef = useRef<any>(null);

  useEffect(() => {
     if (isBattling) {
        let i = 0;
        const iv = setInterval(() => {
           i += 0.1;
           setWipeIntensity(Math.min(i, 1));
           if (i >= 1) {
              clearInterval(iv);
              setTimeout(() => setWipeIntensity(0), 500); // fade out effect
           }
        }, 30);
     }
  }, [isBattling]);

  // "Wake up / Open eyes" blur effect
  useEffect(() => {
    if (started) {
      let val = 0;
      const interval = setInterval(() => {
        val += 0.05;
        if (val >= 1) {
          clearInterval(interval);
          setFocusDistance(1); // fully focused
        } else {
          // Animate focus distance to create an "eye opening / focusing" effect
          setFocusDistance(val);
        }
      }, 50);
      return () => clearInterval(interval);
    } else {
      setFocusDistance(0);
    }
  }, [started]);

  if (activeInterior) {
    return (
      <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 5, 10], fov: 50 }}>
        <CameraShakeRig />
        {activeInterior === "MochiiPlex" && <MochiiPlex onReturn={onInteriorExit!} onHeal={onHeal!} onPC={onPC!} />}
        {activeInterior === "Cantina" && <Cantina onReturn={onInteriorExit!} onMeetNPC={onMeetNPC} />}
        {activeInterior === "FloraDojo" && <FloraDojo onReturn={onInteriorExit!} onChallenge={onChallenge!} onMeetNPC={onMeetNPC} />}
        {activeInterior === "ShamanSanctuary" && <ShamanSanctuary onReturn={onInteriorExit!} onChallenge={onChallenge!} onMeetNPC={onMeetNPC} />}
        {/* Render player character inside */}
        <group position={[0, 0, 5]}>
           <Mochiichao emotion={emotion} started={started} isIdle={true} latestMessage={latestMessage} cameraMode="stationary" isUpgrading={isUpgrading} characterId={characterId} isPrismatic={isPrismatic} />
        </group>
        <OrbitControls makeDefault />
      </Canvas>
    );
  }

  const gravity = [0, -9.81, 0];
  const fogColor = 
    biome === 'ancient_cave' ? '#0a0a0a' : 
    biome === 'desert' ? '#451a03' : 
    biome === 'rainforest' ? '#022c22' : 
    biome === 'neon_city' ? '#180f2a' :
    biome === 'junkyard' ? '#3d2516' :
    '#0f172a';

  // Compute time of day based on real world current day
  const hour = new Date().getHours();
  const isNight = hour < 6 || hour > 19;
  const isDawnOrDusk = (hour >= 6 && hour <= 8) || (hour >= 17 && hour <= 19);

  return (
    <Canvas shadows>
      <color attach="background" args={[fogColor]} />
      
      {/* Sky and Astrological elements */}
      {biome !== 'ancient_cave' && biome !== 'void' && (
        <>
           <Sky 
              sunPosition={isNight ? [0, -1, 0] : isDawnOrDusk ? [10, 0.5, 0] : [10, 5, 0]} 
              turbidity={biome === 'desert' ? 10 : 0.1} 
              rayleigh={isDawnOrDusk ? 3 : 0.5} 
           />
           {isNight && (
              <>
                 <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                 <SkyboxConstellations />
              </>
           )}
        </>
      )}

      {biome !== 'void' && <fog attach="fog" args={[fogColor, 5, 40]} />}
      
      {/* Camera System */}
      <PerspectiveCamera makeDefault position={[0, 1.5, 4]} fov={50} />
      <CameraShakeRig />
      {cameraMode === 'free' && !isUpgrading && <OrbitControls makeDefault />}
      {cameraMode === 'stationary' && !isUpgrading && (
        <OrbitControls 
          makeDefault 
          minDistance={2} 
          maxDistance={7} 
          maxPolarAngle={Math.PI / 2} 
        />
      )}
      
      {/* Lighting */}
      <TemporalLighting biome={biome} />
      {biome === 'ancient_cave' && (
        <pointLight position={[0, 1, 0]} intensity={1.0} color="#00f2ff" distance={10} />
      )}
      {biome === 'rainforest' && (
        <pointLight position={[2, 4, 3]} intensity={2.0} color="#10b981" distance={20} />
      )}
      {biome === 'neon_city' && (
        <>
          <pointLight position={[0, 5, 0]} intensity={2.0} color="#06b6d4" distance={20} />
          <pointLight position={[5, 2, 5]} intensity={1.5} color="#d946ef" distance={15} />
        </>
      )}

      <Physics gravity={gravity as [number, number, number]} paused={isUpgrading}>
        <Suspense fallback={null}>
          
          {biome === 'void' && (
            <>
              <RigidBody type="fixed">
                <mesh receiveShadow position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <planeGeometry args={[20, 20]} />
                  <meshStandardMaterial color="#111827" />
                </mesh>
              </RigidBody>
              <gridHelper args={[20, 20, '#0ea5e9', '#1e293b']} position={[0, -0.49, 0]} />
            </>
          )}

          {biome === 'ancient_cave' && (
             <ProceduralCave seed={seed} />
          )}

          {biome === 'desert' && (
             <>
                 <ProceduralDesert seed={seed} />
                 {seed.length % 2 === 0 && <WeatherParticles type="sandstorm" />}
             </>
          )}

          {(biome === 'rainforest' || biome === 'castagnoli_exterior' || biome === 'castagnoli_safari') && (
             <>
                 <ProceduralRainforest seed={seed} onInteriorEnter={onInteriorEnter} />
                 {seed.length % 3 !== 0 && <WeatherParticles type="rain" />}
             </>
          )}

          {biome === 'neon_city' && (
             <ProceduralCity seed={seed} onInteriorEnter={onInteriorEnter} />
          )}

          {biome === 'junkyard' && (
             <ProceduralJunkyard seed={seed} />
          )}

          {/* Render dynamic environment objects spawned by ALIFE */}
          <EnvironmentObjects />

          {/* Render code blocks from LLM */}
          <DynamicComponentRegistry />

          {/* Character(s) */}
          {isBattling ? (
            <>
              {/* Player */}
              <SurfaceSnapper x={0} z={3}>
                {(y) => (
                  <RigidBody position={[0, y, 3]} type="fixed" colliders="hull" enabledRotations={[false, false, false]}>
                    <group rotation={[0, Math.PI, 0]}>
                      <Mochiichao emotion={emotion} started={started} isIdle={true} latestMessage={latestMessage} cameraMode={cameraMode} isUpgrading={isUpgrading} characterId={characterId} isPrismatic={isPrismatic} />
                    </group>
                  </RigidBody>
                )}
              </SurfaceSnapper>
              {/* Wild */}
              {wildCharacterId && (
                <SurfaceSnapper x={0} z={-3}>
                  {(y) => (
                    <WildCombatWrapper y={y} wildCharacterId={wildCharacterId} started={started} cameraMode={cameraMode} isUpgrading={isUpgrading} wildIsPrismatic={wildIsPrismatic} />
                  )}
                </SurfaceSnapper>
              )}
            </>
          ) : evolutionData ? (
            <SurfaceSnapper x={0} z={0}>
              {(y) => (
                <RigidBody position={[0, y, 0]} type="dynamic" colliders="hull" enabledRotations={[false, false, false]}>
                   <EvolutionCutscene 
                      characterId={evolutionData.id}
                      nextCharacterId={evolutionData.next}
                      type={evolutionData.type}
                      onComplete={onEvolutionComplete || (() => {})}
                   />
                </RigidBody>
              )}
            </SurfaceSnapper>
          ) : (
            <SurfaceSnapper x={0} z={0}>
              {(y) => (
                <RigidBody position={[0, y, 0]} type="dynamic" colliders="hull" enabledRotations={[false, false, false]}>
                  <Mochiichao emotion={emotion} started={started} isIdle={isIdle} latestMessage={latestMessage} cameraMode={cameraMode} isUpgrading={isUpgrading} characterId={characterId} isPrismatic={isPrismatic} />
                </RigidBody>
              )}
            </SurfaceSnapper>
          )}

          {/* Capture Crux Rendering */}
          <CaptureCrux 
            isThrowing={captureThrowing} 
            initialPosition={[0, 1, 2.5]} 
            targetPosition={[0, 1, -3]} 
            onHit={onCaptureHit} 
          />
          
          <Environment preset="city" />

          {/* Postprocessing for Wake Up Blur */}
          <EffectComposer>
            <DepthOfField 
              focusDistance={started ? focusDistance * 0.05 : 0} 
              focalLength={0.02} 
              bokehScale={started ? (1 - focusDistance) * 10 : 15} 
              height={480} 
            />
            {wipeIntensity > 0 && wipeIntensity < 1 && (
               <>
                  <Bloom intensity={wipeIntensity * 10} luminanceThreshold={0.1} />
                  <Pixelation granularity={wipeIntensity * 30} />
               </>
            )}
            {wipeIntensity >= 1 && (
               <Bloom intensity={5} luminanceThreshold={0.2} />
            )}
          </EffectComposer>
        </Suspense>
      </Physics>
    </Canvas>
  );
}
