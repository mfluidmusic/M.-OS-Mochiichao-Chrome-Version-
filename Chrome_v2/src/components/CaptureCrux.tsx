import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { motion } from 'framer-motion-3d';

export function CaptureCrux({ isThrowing, initialPosition, targetPosition, onHit }: { isThrowing: boolean, initialPosition: [number,number,number], targetPosition: [number,number,number], onHit?: () => void }) {
  const cruxRef = useRef<THREE.Group>(null);
  
  // Merkaba is two traversing tetrahedrons.
  const geo1 = useMemo(() => new THREE.TetrahedronGeometry(0.3), []);
  const geo2 = useMemo(() => {
    const g = new THREE.TetrahedronGeometry(0.3);
    g.rotateX(Math.PI);
    g.rotateY(Math.PI/4);
    return g;
  }, []);

  const material = useMemo(() => new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.8 }), []);
  
  const edges1 = useMemo(() => new THREE.EdgesGeometry(geo1), [geo1]);
  const edges2 = useMemo(() => new THREE.EdgesGeometry(geo2), [geo2]);

  useFrame((state, delta) => {
    if (cruxRef.current) {
      if (!isThrowing && cruxRef.current.position.y === -50) {
        cruxRef.current.position.set(...initialPosition);
      }

      cruxRef.current.rotation.x += delta * 5;
      cruxRef.current.rotation.y += delta * 6;
      
      if (isThrowing) {
        const tPos = new THREE.Vector3(...targetPosition);
        cruxRef.current.position.lerp(tPos, delta * 4);
        if (cruxRef.current.position.distanceTo(tPos) < 0.2) {
           if (onHit) onHit();
        }
      } else {
        cruxRef.current.position.set(0, -50, 0); // Hide
      }
    }
  });

  return (
    <group ref={cruxRef} position={[0, -50, 0]}> {/* hidden default */}
      <lineSegments geometry={edges1} material={material} />
      <lineSegments geometry={edges2} material={material} />
    </group>
  );
}
