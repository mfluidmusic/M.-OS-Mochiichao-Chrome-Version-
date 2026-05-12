import { useEffect, useState } from 'react';

interface EnvObject {
  id: string;
  type: string;
  color?: string;
  x?: number;
  y?: number;
  z?: number;
}

export function EnvironmentObjects() {
  const [objects, setObjects] = useState<EnvObject[]>([]);

  useEffect(() => {
    const fetchEnv = async () => {
      try {
        const res = await fetch('/api/environment');
        const data = await res.json();
        setObjects(data);
      } catch (err) {
        console.error("Failed to fetch environment", err);
      }
    };
    
    fetchEnv();

    // Poll for updates every 3 seconds to reflect ALIFE changes
    const interval = setInterval(fetchEnv, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <group>
      {objects.map((obj) => (
        <group 
          key={obj.id} 
          position={[obj.x || 0, obj.y || 0, obj.z || 0]}
        >
          {obj.type.toLowerCase().includes('desk') || obj.type.toLowerCase().includes('table') ? (
            <mesh castShadow receiveShadow position={[0, 0.4, 0]}>
              <boxGeometry args={[2, 0.8, 1]} />
              <meshStandardMaterial color={obj.color || '#8B4513'} />
            </mesh>
          ) : obj.type.toLowerCase().includes('computer') || obj.type.toLowerCase().includes('pc') ? (
            <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
              <boxGeometry args={[0.5, 0.4, 0.1]} />
              <meshStandardMaterial color={obj.color || '#333333'} />
            </mesh>
          ) : obj.type.toLowerCase().includes('plant') ? (
            <mesh castShadow receiveShadow position={[0, 0.4, 0]}>
              <cylinderGeometry args={[0.2, 0.2, 0.8]} />
              <meshStandardMaterial color="#22c55e" />
            </mesh>
          ) : (
            // Generic unknown object
            <mesh castShadow receiveShadow position={[0, 0.25, 0]}>
              <boxGeometry args={[0.5, 0.5, 0.5]} />
              <meshStandardMaterial color={obj.color || '#64748b'} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}
