import React from 'react';
import * as THREE from 'three';
import { SKELETON_SOCKETS } from '../lib/AssetManager';

export function ProceduralMochiichao({ entity, fallbackSeed, colorHex }: { entity?: any, fallbackSeed?: string, colorHex: string }) {
  // Extract or generate deterministic stats
  const typeStr = entity?.type || "Unknown";
  const def = entity?.battle_stats?.max_hp || 50; 
  const atk = entity?.battle_stats?.atk || 50;
  const spe = entity?.battle_stats?.spd || 50;
  
  const seedNum = parseInt(fallbackSeed || "0") || 0;

  // Determine base shape by DEF vs SPE 
  let BodyGeom = <capsuleGeometry args={[0.4, 0.5, 4, 16]} />;
  let bodyType = "biped_upright";
  
  if (def > spe * 1.2) {
      BodyGeom = <boxGeometry args={[0.8, 0.8, 0.8]} />;
      bodyType = "quadruped_heavy";
  } else if (spe > def * 1.2) {
      BodyGeom = <sphereGeometry args={[0.4, 32, 16]} />;
      bodyType = "biped_upright";
  } else {
      BodyGeom = <cylinderGeometry args={[0.4, 0.4, 0.8, 16]} />;
      bodyType = "snake_coil";
  }

  // Determine appendages by TYPE
  const renderAppendage = (socketPos: [number, number, number]) => {
     let geom = null;
     if (typeStr.includes("Flame")) geom = <coneGeometry args={[0.2, 0.6, 16]} />;
     else if (typeStr.includes("Flora") || typeStr.includes("Grass")) geom = <torusGeometry args={[0.2, 0.1, 8, 16]} />;
     else if (typeStr.includes("Umbral") || typeStr.includes("Void")) geom = <octahedronGeometry args={[0.3]} />;
     else if (typeStr.includes("Metal") || typeStr.includes("Chrome")) geom = <boxGeometry args={[0.3, 0.3, 0.3]} />;
     else if (typeStr.includes("Aqua") || typeStr.includes("Water")) geom = <sphereGeometry args={[0.2]} />;
     else geom = <dodecahedronGeometry args={[0.25]} />; // default

     return (
       <mesh position={socketPos}>
         {geom}
         <meshStandardMaterial color={colorHex || "#888888"} roughness={0.7} metalness={0.2} />
       </mesh>
     );
  };

  const sockets = SKELETON_SOCKETS[bodyType] || SKELETON_SOCKETS['amorphous_blob'];

  // Overall scale based on ATK + HP
  const totalPower = def + atk;
  const scale = Math.max(0.7, Math.min(2.0, totalPower / 100));

  return (
    <group position={[0, 0.5, 0]} scale={[scale, scale, scale]}>
       {/* Body Base */}
       <mesh>
         {BodyGeom}
         <meshStandardMaterial color={colorHex || "#888888"} roughness={0.7} metalness={0.2} />
       </mesh>

       {/* Sockets - Render Appendages based on Type */}
       {sockets.headSocket && renderAppendage(sockets.headSocket)}
       {sockets.frontLeftLegSocket && renderAppendage(sockets.frontLeftLegSocket)}
       {sockets.frontRightLegSocket && renderAppendage(sockets.frontRightLegSocket)}
       {sockets.backSocket && renderAppendage(sockets.backSocket)}
    </group>
  );
}
