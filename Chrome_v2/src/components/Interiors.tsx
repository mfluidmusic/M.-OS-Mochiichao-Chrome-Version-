import { Environment, Sparkles } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import { ModularNPC } from "./ModularNPC";
import * as THREE from 'three';

export function MochiiPlex({ onReturn, onHeal, onPC }: { onReturn: () => void, onHeal: () => void, onPC: () => void }) {
  return (
    <group>
      <Environment preset="studio" />
      <ambientLight intensity={0.8} />
      
      {/* Floor */}
      <RigidBody type="fixed">
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#e0f2fe" roughness={0.1} metalness={0.8} />
        </mesh>
      </RigidBody>

      {/* Walls */}
      <RigidBody type="fixed">
          <mesh position={[0, 2, -10]}>
              <boxGeometry args={[20, 6, 1]} />
              <meshStandardMaterial color="#f0f9ff" roughness={0.4} />
          </mesh>
      </RigidBody>

      {/* Healing Station */}
      <mesh position={[0, 1, -5]} onClick={(e) => { e.stopPropagation(); onHeal(); }}>
        <cylinderGeometry args={[2, 2, 0.5, 32]} />
        <meshStandardMaterial color="#0ea5e9" emissive="#0284c7" emissiveIntensity={0.5} />
        <pointLight position={[0, 2, 0]} color="#38bdf8" intensity={2} />
      </mesh>

      {/* PC Terminal */}
      <mesh position={[5, 1, -8]} onClick={(e) => { e.stopPropagation(); onPC(); }}>
          <boxGeometry args={[1, 2, 1]} />
          <meshStandardMaterial color="#333" />
          <mesh position={[0, 0.8, 0.6]}>
              <planeGeometry args={[0.8, 0.6]} />
              <meshBasicMaterial color="#22d3ee" />
          </mesh>
      </mesh>

      {/* Exit Door */}
      <mesh position={[0, 1.5, 9]} onClick={(e) => { e.stopPropagation(); onReturn(); }}>
          <boxGeometry args={[2, 3, 0.2]} />
          <meshStandardMaterial color="#fca5a5" />
      </mesh>
      
      <ModularNPC position={[-4, 0.5, -4]} archetype="TipGiver" name="Nurse Joy Equivalent" onInteract={() => {}} />
    </group>
  );
}

export function Cantina({ onReturn, onMeetNPC }: { onReturn: () => void, onMeetNPC?: (npc: any) => void }) {
  return (
    <group>
      <ambientLight intensity={0.2} color="#fef08a" />
      
      <RigidBody type="fixed">
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#422006" roughness={0.9} />
        </mesh>
      </RigidBody>

      {/* Bar */}
      <RigidBody type="fixed">
          <mesh position={[0, 1, -6]}>
              <boxGeometry args={[10, 2, 2]} />
              <meshStandardMaterial color="#78350f" />
          </mesh>
      </RigidBody>
      
      <pointLight position={[0, 3, -6]} color="#fbbf24" intensity={1} distance={10} />
      
      <ModularNPC position={[0, 0.5, -4]} archetype="Esoteric" name="Info Broker" onInteract={() => onMeetNPC?.({ name: "Info Broker", role: "Rumor Merchant" })} />
      <ModularNPC position={[4, 0.5, 2]} archetype="Funny" name="Drunk Patron" onInteract={() => {}} />
      <ModularNPC position={[-3, 0.5, 4]} archetype="Silent" name="Mysterious Stranger" onInteract={() => onMeetNPC?.({ name: "Mysterious Stranger", role: "Watcher" })} />

      {/* Exit Door */}
      <mesh position={[0, 1.5, 9]} onClick={(e) => { e.stopPropagation(); onReturn(); }}>
          <boxGeometry args={[2, 3, 0.2]} />
          <meshStandardMaterial color="#fca5a5" />
      </mesh>
    </group>
  );
}

export function FloraDojo({ onReturn, onChallenge, onMeetNPC }: { onReturn: () => void, onChallenge: (n: string) => void, onMeetNPC?: (npc: any) => void }) {
  return (
    <group>
      <ambientLight intensity={0.5} color="#dcfce7" />
      <Environment preset="forest" />
      
      <RigidBody type="fixed">
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[30, 40]} />
          <meshStandardMaterial color="#14532d" roughness={0.8} />
        </mesh>
      </RigidBody>

      <Sparkles count={100} scale={20} size={5} speed={0.4} color="#86efac" />

      {/* Acolytes */}
      <ModularNPC position={[-3, 0.5, 5]} archetype="Normal" name="Acolyte Ren" onInteract={() => onMeetNPC?.({ name: "Acolyte Ren", role: "Flora Dojo Student" })} />
      <ModularNPC position={[3, 0.5, -2]} archetype="Normal" name="Acolyte Lin" onInteract={() => onMeetNPC?.({ name: "Acolyte Lin", role: "Flora Dojo Defender" })} />
      
      {/* Flora Master */}
      <ModularNPC 
         position={[0, 0.5, -15]} 
         archetype="Elite" 
         name="Flora Master Lin" 
         onInteract={() => { onChallenge("Flora Master Lin"); onMeetNPC?.({ name: "Flora Master Lin", role: "Dojo Leader" }); }} 
      />

      {/* Exit Door */}
      <mesh position={[0, 1.5, 19]} onClick={(e) => { e.stopPropagation(); onReturn(); }}>
          <boxGeometry args={[4, 4, 0.2]} />
          <meshStandardMaterial color="#fca5a5" />
      </mesh>
    </group>
  );
}

export function ShamanSanctuary({ onReturn, onChallenge, onMeetNPC }: { onReturn: () => void, onChallenge: (n: string) => void, onMeetNPC?: (npc: any) => void }) {
  return (
    <group>
      <ambientLight intensity={0.3} color="#fca5a5" />
      <Environment preset="sunset" />
      
      {/* Mystical Sand/Ash Floor */}
      <RigidBody type="fixed">
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[30, 40]} />
          <meshStandardMaterial color="#78350f" roughness={1.0} />
        </mesh>
      </RigidBody>

      {/* Floating Orbs / Occult Energy */}
      <Sparkles count={50} scale={20} size={15} speed={0.2} color="#f87171" />
      <Sparkles count={30} scale={15} size={8} speed={0.1} color="#c084fc" />

      {/* Ritual Candles / Occult stuff */}
      {[[-5, 0, -5], [5, 0, -5], [-3, 0, -10], [3, 0, -10]].map((pos, i) => (
         <group key={i} position={new THREE.Vector3(...pos)}>
            <mesh position={[0, 1, 0]}><cylinderGeometry args={[0.2, 0.2, 2]}/><meshStandardMaterial color="#fef08a"/></mesh>
            <pointLight position={[0, 2.5, 0]} color="#fb923c" intensity={1} distance={5} />
         </group>
      ))}

      {/* Shamans */}
       <ModularNPC position={[2, 0.5, 0]} archetype="Esoteric" name="Occultist Rae" onInteract={() => onMeetNPC?.({ name: "Occultist Rae", role: "Numerologist" })} />
       <ModularNPC position={[-2, 0.5, 2]} archetype="Silent" name="Mystic Zinn" onInteract={() => onMeetNPC?.({ name: "Mystic Zinn", role: "Astrologer" })} />

      {/* Master Shaman */}
      <ModularNPC 
         position={[0, 0.5, -15]} 
         archetype="Elite" 
         name="Shaman Master Dhir" 
         onInteract={() => { onChallenge("Shaman Master Dhir"); onMeetNPC?.({ name: "Shaman Master Dhir", role: "MochiiMaster" }); }} 
      />

      {/* Exit Door */}
      <mesh position={[0, 1.5, 19]} onClick={(e) => { e.stopPropagation(); onReturn(); }}>
          <boxGeometry args={[4, 4, 0.2]} />
          <meshStandardMaterial color="#cbd5e1" />
      </mesh>
    </group>
  );
}
