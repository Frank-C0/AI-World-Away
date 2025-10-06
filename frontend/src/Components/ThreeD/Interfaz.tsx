import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { useState, useMemo } from 'react';
import ExoplanetData from './ExoplanetData'; 

const Exoplanet = ({ position, color }: { position: [number, number, number]; color: string }) => {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.4, 16, 16]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
    </mesh>
  );
};

interface GalaxyProps {
  totalPlanets: number;
}

const Galaxy = ({ totalPlanets }: GalaxyProps) => {
  const planets = useMemo(() => {
    const colors = ['#ff4d4d', '#00ff7f', '#ffff66'];
    const list = [];
    
    // Use totalPlanets after being filtered
    for (let i = 0; i < totalPlanets; i++) {
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
  }, [totalPlanets]); 

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
  const [totalPlanets, setTotalPlanets] = useState(0);

  const handleFilteredDataChange = (total: number) => {
    console.log("📊 Total filtered exoplanets:", total);
    console.log("🌌 Updating galaxy with", total, "planets");
    setTotalPlanets(total);
  };

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
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Galactic Map of Exoplanets</h1>
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
            View Map
          </button>
        </div>
      ) : (
        <>

          {/* ✅ Side panel with processed data */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '400px',
              height: '100vh',
              background: 'rgba(10, 10, 20, 0.95)',
              color: 'white',
              overflowY: 'auto',
              padding: '1rem',
              borderRight: '2px solid #0ff',
              zIndex: 10,
            }}
          >
            {/* 🔍 ExoplanetData notifies changes via callback */}
            <ExoplanetData onFilteredDataChange={handleFilteredDataChange} />
          </div>

          {/* 🌌 3D Canvas */}

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

            <ambientLight intensity={0.5} />
            <pointLight position={[50, 50, 50]} intensity={1.2} />
            <Stars radius={300} depth={100} count={5000} factor={4} saturation={0} fade />
            {/* Galaxy now receives totalPlanets and updates dynamically */}
            <Galaxy totalPlanets={totalPlanets} />
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