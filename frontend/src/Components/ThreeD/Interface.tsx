import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useState, useMemo } from 'react';
import ExoplanetFilters from './ExoplanetFilters';

const Exoplanet = ({ position, color }: { position: [number, number, number]; color: string }) => {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.4, 16, 16]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
    </mesh>
  );
};

const Galaxy = () => {
  const planets = useMemo(() => {
    const colors = ['#ff4d4d', '#00ff7f', '#ffff66'];
    const list = [];
    for (let i = 0; i < 1000; i++) {
      const radius = 100 * Math.random();
      const angle1 = Math.random() * Math.PI * 2;
      const angle2 = Math.random() * Math.PI;
      const x = radius * Math.sin(angle2) * Math.cos(angle1);
      const y = radius * Math.sin(angle2) * Math.sin(angle1);
      const z = radius * Math.cos(angle2);
      const color = colors[Math.floor(Math.random() * colors.length)];
      list.push({ position: [x, y, z] as [number, number, number], color });
    }
    return list;
  }, []);

  return (
    <>
      {planets.map((p, i) => (
        <Exoplanet key={i} position={p.position} color={p.color} />
      ))}
    </>
  );
};

const Interfaz = () => {
  const [showMap, setShowMap] = useState(false);

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative', background: 'black' }}>
      {!showMap ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            color: 'white',
            background: 'radial-gradient(circle, #000010, #000)',
          }}
        >
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Mapa Galáctico de Exoplanetas</h1>
          <button
            onClick={() => setShowMap(true)}
            style={{
              padding: '12px 24px',
              fontSize: '1.1rem',
              borderRadius: '12px',
              border: 'none',
              background: '#0ff',
              cursor: 'pointer',
              boxShadow: '0 0 15px #0ff',
              color: '#000',
              transition: '0.3s',
            }}
          >
            Ver mapa
          </button>
        </div>
      ) : (
        <>
          {/* ✅ Aquí va el panel lateral de filtros */}
          <ExoplanetFilters onChange={(filters) => console.log(filters)} />

          {/* ✅ Y aquí el canvas 3D */}
          <Canvas
            camera={{ position: [0, 0, 120], fov: 60 }}
            style={{
              width: '100%',
              height: '100vh',
              position: 'absolute',
              top: 0,
              left: 0,
              background: 'black',
            }}
          >
            {/* Luces y fondo */}
            <ambientLight intensity={0.5} />
            <pointLight position={[50, 50, 50]} intensity={1.2} />
            <Stars radius={300} depth={100} count={5000} factor={4} saturation={0} fade />

            {/* Galaxia */}
            <Galaxy />

            {/* Controles de usuario */}
            <OrbitControls
              enableZoom
              enablePan
              enableRotate
              zoomSpeed={0.5}
              rotateSpeed={0.6}
              maxDistance={250}
              minDistance={10}
            />
          </Canvas>
        </>
      )}
    </div>
  );
};

export default Interfaz;
