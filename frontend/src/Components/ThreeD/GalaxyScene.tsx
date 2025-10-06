import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ExoplanetsProps {
  countRed: number;
  countGreen: number;
  countYellow: number;
}

const Exoplanets: React.FC<ExoplanetsProps> = ({ countRed, countGreen, countYellow }) => {
  const group = useRef<THREE.Group>(null!);

  const planets = useMemo(() => {
    const colors = [
      ...Array(countRed).fill('red'),
      ...Array(countGreen).fill('green'),
      ...Array(countYellow).fill('yellow'),
    ];
    return colors.map(color => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 50
      ),
      color,
    }));
  }, [countRed, countGreen, countYellow]);

  useFrame(() => {
    if (group.current) {
      group.current.rotation.y += 0.0015;
    }
  });

  return (
    <group ref={group}>
      {planets.map((planet, i) => (
        <mesh key={i} position={planet.position}>
          <sphereGeometry args={[0.8, 32, 32]} />
          <meshStandardMaterial color={planet.color} emissive={planet.color} />
        </mesh>
      ))}
    </group>
  );
};

const Galaxy: React.FC = () => {
  const points = useMemo(() => {
    const positions: number[] = [];
    for (let i = 0; i < 2000; i++) {
      const r = 40 * Math.sqrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const y = (Math.random() - 0.5) * 10;
      positions.push(r * Math.cos(theta), y, r * Math.sin(theta));
    }
    return new Float32Array(positions);
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length / 3}
          array={points}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.1} color="white" />
    </points>
  );
};

interface GalaxySceneProps {
  totalPlanets: number;
}

const GalaxyScene: React.FC<GalaxySceneProps> = ({ totalPlanets }) => {
  // Split the total into 3 colors (approximately 33% each)
  const countRed = Math.floor(totalPlanets / 3);
  const countGreen = Math.floor(totalPlanets / 3);
  const countYellow = totalPlanets - countRed - countGreen; 

  return (
    <Canvas camera={{ position: [0, 0, 70], fov: 60 }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[20, 20, 20]} />
      <Galaxy />
      <Exoplanets countRed={countRed} countGreen={countGreen} countYellow={countYellow} />
    </Canvas>
  );
};

export default GalaxyScene;