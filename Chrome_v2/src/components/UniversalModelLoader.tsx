import React, { Suspense } from 'react';
import { useGLTF, Text } from '@react-three/drei';
import { useAssetLibrary } from '../useAssetLibrary';

interface ModelProps {
  assetId: string;
  keyword?: string;
  position?: [number, number, number];
  scale?: [number, number, number];
  nameFallback?: string;
  colorHex?: string;
}

// Separate component for the actual Drei useGLTF call so Suspense works correctly
function GLTFModel({ url, scale, position, colorHex }: { url: string, scale?: [number, number, number], position?: [number, number, number], colorHex?: string }) {
  const { scene } = useGLTF(url);
  // Optional: You could traverse the scene and apply colorHex
  return <primitive object={scene.clone()} position={position} scale={scale} />;
}

export function UniversalModelLoader({ assetId, keyword, position = [0, 0, 0], scale = [1, 1, 1], nameFallback = "Unknown Data", colorHex = "#00ffff" }: ModelProps) {
  const { modelUrl, loading } = useAssetLibrary(assetId, keyword);

  if (loading) {
    return (
      <group position={position} scale={scale}>
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={colorHex} wireframe opacity={0.5} transparent />
        </mesh>
        <Text position={[0, 1.2, 0]} fontSize={0.2} color={colorHex}>
          Loading...
        </Text>
      </group>
    );
  }

  if (modelUrl) {
    return (
      <Suspense fallback={
        <group position={position} scale={scale}>
          <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={colorHex} wireframe opacity={0.5} transparent />
          </mesh>
          <Text position={[0, 1.2, 0]} fontSize={0.2} color={colorHex}>
            Loading...
          </Text>
        </group>
      }>
        <GLTFModel url={modelUrl} position={position} scale={scale} colorHex={colorHex} />
      </Suspense>
    );
  }

  // Fallback if no URL is found or loading fails
  return (
    <group position={position} scale={scale}>
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={colorHex} wireframe emissive={colorHex} emissiveIntensity={0.5} opacity={0.8} transparent />
      </mesh>
      <Text position={[0, 1.2, 0]} fontSize={0.2} color={colorHex} anchorY="bottom">
        {nameFallback}
      </Text>
    </group>
  );
}
