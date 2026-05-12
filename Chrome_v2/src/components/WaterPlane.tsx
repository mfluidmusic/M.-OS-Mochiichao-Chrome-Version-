import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const vertexShader = `
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 pos = position;
    // Simple wave equations
    pos.z += sin(pos.x * 2.0 + uTime) * 0.1;
    pos.z += cos(pos.y * 1.5 + uTime * 0.8) * 0.1;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    vec3 color1 = vec3(0.0, 0.4, 0.8);
    vec3 color2 = vec3(0.0, 0.6, 0.9);
    float mixValue = (sin(vUv.x * 10.0 + uTime) + cos(vUv.y * 10.0 + uTime)) * 0.5 + 0.5;
    vec3 finalColor = mix(color1, color2, mixValue);
    gl_FragColor = vec4(finalColor, 0.8);
  }
`;

export function WaterPlane({ position = [0, 0, 0], scale = [50, 50] }: { position?: [number, number, number], scale?: [number, number] }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh position={new THREE.Vector3(...position)} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[scale[0], scale[1], 32, 32]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{ uTime: { value: 0 } }}
        transparent
      />
    </mesh>
  );
}
