import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from 'recharts';
import './Transition.css';

const RealisticStar = ({ brightness, phase }) => {
  const meshRef = useRef(null);
  const coronaRef = useRef(null);
  const glowRef = useRef(null);
  const flareRef = useRef(null);
  const sunspotGroupRef = useRef(null);
  
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    
    if (meshRef.current) {
      const pulse = 1 + Math.sin(time * 0.5) * 0.008 + Math.sin(time * 1.3) * 0.004;
      const scale = pulse * (0.98 + brightness * 0.02);
      meshRef.current.scale.set(scale, scale, scale);
      meshRef.current.rotation.y += 0.0003;
      
      const turbulence = Math.sin(time * 2) * 0.002;
      meshRef.current.material.emissiveIntensity = 1.2 + turbulence;
    }
    
    if (coronaRef.current) {
      coronaRef.current.rotation.y += 0.0005;
      coronaRef.current.rotation.x = Math.sin(time * 0.3) * 0.02;
      coronaRef.current.material.opacity = 0.2 + Math.sin(time * 1.5) * 0.05;
    }
    
    if (glowRef.current) {
      const glowScale = 1.4 + Math.sin(time * 0.8) * 0.1;
      glowRef.current.scale.set(glowScale, glowScale, glowScale);
      glowRef.current.material.opacity = 0.4 * brightness;
    }
    
    if (flareRef.current) {
      const flareIntensity = Math.random() > 0.995 ? 1 : 0;
      flareRef.current.material.opacity = flareIntensity * 0.5;
      flareRef.current.rotation.z += 0.001;
    }

    if (sunspotGroupRef.current) {
      sunspotGroupRef.current.rotation.y += 0.0002;
    }
  });
  
  const starSize = phase === 7 ? 1.8 : 2.2;
  
  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[starSize, 128, 128]} />
        <meshStandardMaterial 
          color="#EAFE07"
          emissive="#E43700"
          emissiveIntensity={1.2}
          metalness={0.1}
          roughness={0.3}
        />
      </mesh>
      
      <group ref={sunspotGroupRef}>
        {[...Array(8)].map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          const radius = starSize * 0.98;
          const x = Math.cos(angle) * radius * 0.6;
          const z = Math.sin(angle) * radius * 0.6;
          return (
            <mesh key={i} position={[x, Math.sin(angle * 3) * 0.3, z]}>
              <sphereGeometry args={[0.08, 16, 16]} />
              <meshBasicMaterial 
                color="#8E1100"
                transparent
                opacity={0.6}
              />
            </mesh>
          );
        })}
      </group>
      
      <mesh>
        <sphereGeometry args={[starSize * 1.02, 64, 64]} />
        <meshBasicMaterial 
          color="#EAFE07"
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      <mesh ref={coronaRef}>
        <sphereGeometry args={[starSize * 1.15, 48, 48]} />
        <meshBasicMaterial 
          color="#E43700"
          transparent
          opacity={0.2}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </mesh>
      
      <mesh ref={glowRef}>
        <sphereGeometry args={[starSize * 1.5, 32, 32]} />
        <meshBasicMaterial 
          color="#EAFE07"
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </mesh>
      
      <mesh ref={flareRef}>
        <sphereGeometry args={[starSize * 1.7, 16, 16]} />
        <meshBasicMaterial 
          color="#E43700"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      <pointLight 
        intensity={brightness * 4} 
        distance={100} 
        color="#EAFE07"
        castShadow
      />
      <pointLight 
        intensity={brightness * 2} 
        distance={60} 
        color="#E43700"
        position={[0, 0, 0]}
      />
    </group>
  );
};

const DetailedPlanet = ({ color, radius, orbitRadius, speed, onTransit, planetType = 'rocky', atmosphereColor, hasRings = false }) => {
  const meshRef = useRef(null);
  const atmosphereRef = useRef(null);
  const cloudsRef = useRef(null);
  const ringsRef = useRef(null);
  
  useFrame(({ clock }) => {
    if (meshRef.current) {
      const t = clock.getElapsedTime() * speed;
      const x = Math.cos(t) * orbitRadius;
      const z = Math.sin(t) * orbitRadius;
      const y = Math.sin(t * 0.1) * 0.1;
      
      meshRef.current.position.set(x, y, z);
      meshRef.current.rotation.y += 0.005;
      
      if (atmosphereRef.current) {
        atmosphereRef.current.position.set(x, y, z);
        atmosphereRef.current.rotation.y -= 0.002;
      }
      
      if (cloudsRef.current) {
        cloudsRef.current.position.set(x, y, z);
        cloudsRef.current.rotation.y += 0.003;
      }

      if (ringsRef.current) {
        ringsRef.current.position.set(x, y, z);
        ringsRef.current.rotation.x = Math.PI / 2.5;
        ringsRef.current.rotation.z += 0.0001;
      }
      
      if (onTransit) {
        const isTransiting = z < 0.5 && z > -0.5 && Math.abs(x) < 2.5;
        onTransit(isTransiting, x, z);
      }
    }
  });
  
  return (
    <group>
      <mesh ref={meshRef} castShadow receiveShadow>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshStandardMaterial 
          color={color}
          metalness={planetType === 'gas' ? 0.1 : 0.4}
          roughness={planetType === 'gas' ? 0.6 : 0.8}
        />
      </mesh>
      
      {planetType === 'rocky' && (
        <mesh ref={cloudsRef}>
          <sphereGeometry args={[radius * 1.01, 48, 48]} />
          <meshBasicMaterial 
            color="#FFFFFF"
            transparent
            opacity={0.2}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}
      
      {atmosphereColor && (
        <mesh ref={atmosphereRef}>
          <sphereGeometry args={[radius * 1.15, 48, 48]} />
          <meshBasicMaterial 
            color={atmosphereColor}
            transparent
            opacity={0.2}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {hasRings && (
        <mesh ref={ringsRef}>
          <ringGeometry args={[radius * 1.3, radius * 2, 64]} />
          <meshBasicMaterial 
            color="#004246"
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
};

const EnhancedOrbitLine = ({ radius, color = "#0960E1", opacity = 0.3 }) => {
  const points = [];
  const segments = 256;
  
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    points.push(new THREE.Vector3(
      Math.cos(angle) * radius, 
      0, 
      Math.sin(angle) * radius
    ));
  }
  
  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial 
        color={color} 
        opacity={opacity} 
        transparent 
        linewidth={1}
        blending={THREE.AdditiveBlending}
      />
    </line>
  );
};

const SpaceDust = () => {
  const particlesRef = useRef();
  const particleCount = 300;
  
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 60;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 60;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
    
    const colorChoice = Math.random();
    if (colorChoice < 0.33) {
      colors[i * 3] = 0.09; colors[i * 3 + 1] = 0.38; colors[i * 3 + 2] = 0.88;
    } else if (colorChoice < 0.66) {
      colors[i * 3] = 0.92; colors[i * 3 + 1] = 1; colors[i * 3 + 2] = 0.03;
    } else {
      colors[i * 3] = 1; colors[i * 3 + 1] = 1; colors[i * 3 + 2] = 1;
    }
  }
  
  useFrame(() => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += 0.0001;
      particlesRef.current.rotation.x += 0.00005;
    }
  });
  
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial 
        size={0.08} 
        vertexColors
        transparent 
        opacity={0.8} 
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

const CameraController = ({ targetPosition }) => {
  const { camera } = useThree();
  const currentPos = useRef(camera.position.clone());

  useFrame(() => {
    currentPos.current.lerp(new THREE.Vector3(...targetPosition), 0.05);
    camera.position.copy(currentPos.current);
    camera.lookAt(0, 0, 0);
  });

  return null;
};

const TransitScene = ({ phase, onBrightnessChange, onPlanetPosition }) => {
  const [brightness, setBrightness] = useState(1.0);
  const [transitDepth, setTransitDepth] = useState(0);
  
  const handleTransit = (isTransiting, x, z) => {
    if (isTransiting) {
      const distanceFromCenter = Math.sqrt(x * x + z * z);
      const maxDistance = 2.5;
      const depth = 1 - (distanceFromCenter / maxDistance) * 0.04;
      setBrightness(depth);
      setTransitDepth((1 - depth) * 100);
    } else {
      setBrightness(1.0);
      setTransitDepth(0);
    }
    onBrightnessChange(brightness);
    onPlanetPosition(x, z, transitDepth);
  };
  
  return (
    <>
      <ambientLight intensity={0.03} />
      <Stars 
        radius={200} 
        depth={100} 
        count={10000} 
        factor={5} 
        saturation={0} 
        fade 
        speed={0.1}
      />
      
      {phase >= 1 && (
        <>
          <SpaceDust />
          <Sparkles count={100} scale={50} size={2} speed={0.2} color="#0960E1" />
        </>
      )}
      
      {phase >= 3 && (
        <>
          <RealisticStar brightness={brightness} phase={phase} />
          
          {phase >= 4 && phase < 7 && (
            <>
              <EnhancedOrbitLine radius={7} color="#0960E1" opacity={0.25} />
              <DetailedPlanet 
                color="#07173F"
                radius={0.7}
                orbitRadius={7}
                speed={0.3}
                onTransit={handleTransit}
                phase={phase}
                planetType="gas"
                atmosphereColor="#0960E1"
                hasRings={true}
              />
            </>
          )}
        </>
      )}
      
      {phase === 7 && (
        <>
          <RealisticStar brightness={1} phase={phase} />
          <EnhancedOrbitLine radius={4.5} color="#2E96F5" opacity={0.3} />
          <EnhancedOrbitLine radius={7.5} color="#0960E1" opacity={0.25} />
          <EnhancedOrbitLine radius={11} color="#004246" opacity={0.2} />
          <EnhancedOrbitLine radius={14.5} color="#E43700" opacity={0.15} />
          <EnhancedOrbitLine radius={18} color="#EAFE07" opacity={0.1} />
          
          <DetailedPlanet 
            color="#E43700" 
            radius={0.35} 
            orbitRadius={4.5} 
            speed={0.7} 
            planetType="rocky" 
            atmosphereColor="#EAFE07"
          />
          <DetailedPlanet 
            color="#07173F" 
            radius={0.75} 
            orbitRadius={7.5} 
            speed={0.3} 
            planetType="gas" 
            atmosphereColor="#0960E1"
            hasRings={true}
          />
          <DetailedPlanet 
            color="#004246" 
            radius={0.55} 
            orbitRadius={11} 
            speed={0.18} 
            planetType="gas" 
            atmosphereColor="#2E96F5"
            hasRings={true}
          />
          <DetailedPlanet 
            color="#2E96F5" 
            radius={0.45} 
            orbitRadius={14.5} 
            speed={0.12} 
            planetType="rocky" 
            atmosphereColor="#0960E1"
          />
          <DetailedPlanet 
            color="#EAFE07" 
            radius={0.38} 
            orbitRadius={18} 
            speed={0.08} 
            planetType="rocky"
          />
        </>
      )}

      {phase === 8 && (
        <>
          <RealisticStar brightness={1} phase={7} />
          <EnhancedOrbitLine radius={6} color="#2E96F5" opacity={0.3} />
          <EnhancedOrbitLine radius={10} color="#0960E1" opacity={0.25} />
          <EnhancedOrbitLine radius={15} color="#E43700" opacity={0.2} />
          
          <DetailedPlanet 
            color="#2E96F5" 
            radius={0.4} 
            orbitRadius={6} 
            speed={0.5} 
            planetType="rocky" 
            atmosphereColor="#0960E1"
          />
          <DetailedPlanet 
            color="#07173F" 
            radius={0.8} 
            orbitRadius={10} 
            speed={0.25} 
            planetType="gas" 
            atmosphereColor="#0960E1"
            hasRings={true}
          />
          <DetailedPlanet 
            color="#E43700" 
            radius={0.3} 
            orbitRadius={15} 
            speed={0.15} 
            planetType="rocky"
          />
        </>
      )}
    </>
  );
};

const Transition = ({ isOpen, onClose }) => {
  const [phase, setPhase] = useState(0);
  const [brightness, setBrightness] = useState(1.0);
  const [lightCurveData, setLightCurveData] = useState([]);
  const [planetPosition, setPlanetPosition] = useState({ x: 7, z: 0, depth: 0 });
  const [cameraPos, setCameraPos] = useState([0, 8, 20]);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [showFinalAnimation, setShowFinalAnimation] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  useEffect(() => {
    if (!isOpen) {
      setPhase(0);
      setBrightness(1.0);
      setLightCurveData([]);
      setAnalysisProgress(0);
      setShowFinalAnimation(false);
      setIsTransitioning(false);
      return;
    }
    
    const timeline = [
      { delay: 0, phase: 0 },
      { delay: 3500, phase: 1 },
      { delay: 7000, phase: 2 },
      { delay: 10500, phase: 3 },
      { delay: 14000, phase: 4 },
      { delay: 17500, phase: 5 },
      { delay: 24000, phase: 6 },
      { delay: 29000, phase: 7 },
      { delay: 33000, phase: 8 },
    ];
    
    const timeouts = timeline.map(({ delay, phase }) => 
      setTimeout(() => {
        setIsTransitioning(true);
        setTimeout(() => {
          setPhase(phase);
          setIsTransitioning(false);
          if (phase === 8) {
            setShowFinalAnimation(true);
          }
        }, 600);
      }, delay)
    );
    
    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [isOpen]);
  
  useEffect(() => {
    if (phase !== 6) return;
    
    const interval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 50);
    
    return () => clearInterval(interval);
  }, [phase]);
  
  useEffect(() => {
    const cameraPositions = {
      0: [0, 8, 20],
      1: [0, 6, 18],
      2: [0, 5, 15],
      3: [0, 5, 15],
      4: [5, 4, 12],
      5: [0, 8, 18],
      6: [0, 10, 22],
      7: [0, 15, 35],
      8: [0, 20, 40],
    };
    
    setCameraPos(cameraPositions[phase] || [0, 8, 20]);
  }, [phase]);
  
  useEffect(() => {
    if (phase === 5 && brightness < 1) {
      setLightCurveData(prev => {
        const newData = [...prev, { 
          time: prev.length, 
          brightness: brightness * 100,
          expected: 100
        }];
        return newData.slice(-100);
      });
    }
  }, [brightness, phase]);
  
 const getPhaseContent = () => {
  switch(phase) {
    case 0:
      return {
        text: "How do we detect exoplanets using the transit method?",
        className: "phase-0"
      };
    case 1:
      return {
        text: "First, we observe distant stars for long periods...",
        className: "phase-1"
      };
    case 2:
      return {
        text: "Carefully measuring the amount of light they emit",
        className: "phase-2"
      };
    case 3:
      return {
        text: "Imagine a star shining constantly in space",
        className: "phase-3"
      };
    case 4:
      return {
        text: "But when a planet orbits around it...",
        className: "phase-4"
      };
    case 5:
      return {
        text: "The planet blocks part of the light emitted by the star",
        className: "phase-5",
        showChart: true
      };
    case 6:
      return {
        text: "Then, after analyzing data such as brightness and darkness patterns",
        className: "phase-6",
        showAnalysis: true
      };
    case 7:
      return {
        text: "If the right conditions are met...",
        className: "phase-7"
      };
    case 8:
      return {
        text: "",
        className: "phase-8 final",
        showFinal: true
      };
    default:
      return { text: "", className: "" };
  }
};

  
  const phaseContent = getPhaseContent();
  
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay">
      <div className={`modal-content ${isTransitioning ? 'transitioning' : ''}`}>
        <button className="close-button" onClick={onClose}>✕</button>
        
        <div className="animation-container">
          <Canvas 
            camera={{ position: cameraPos, fov: 45 }}
            gl={{ antialias: true, alpha: true }}
          >
            <color attach="background" args={['#000000']} />
            <CameraController targetPosition={cameraPos} />
            <TransitScene 
              phase={phase} 
              onBrightnessChange={setBrightness}
              onPlanetPosition={(x, z, depth) => setPlanetPosition({ x, z, depth })}
            />
          </Canvas>
          
          {!phaseContent.showFinal && (
            <div className={`floating-text ${phaseContent.className} ${isTransitioning ? 'fade-out' : 'fade-in'}`}>
              {phaseContent.text}
            </div>
          )}
          
          {phaseContent.showFinal && showFinalAnimation && (
            <div className="final-animation fade-in">
              <div className="final-title">
                We have detected a new exoplanet!
              </div>
            </div>
          )}

          
          {phaseContent.showChart && lightCurveData.length > 0 && (
            <div className={`chart-container ${isTransitioning ? 'fade-out' : 'slide-in-right'}`}>
              <div className="chart-header">
                <h3>Light Curve</h3>
                <div className="brightness-indicator">
                  Brightness: {(brightness * 100).toFixed(2)}%
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={lightCurveData}>
                  <defs>
                    <linearGradient id="colorBrightness" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EAFE07" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#E43700" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0960E1" opacity={0.2} />
                  <XAxis dataKey="time" stroke="#666" hide />
                  <YAxis domain={[95, 101]} stroke="#0960E1" />
                  <ReferenceLine y={100} stroke="#EAFE07" strokeDasharray="5 5" />
                  <Area 
                    type="monotone" 
                    dataKey="brightness" 
                    stroke="#EAFE07" 
                    fillOpacity={1}
                    fill="url(#colorBrightness)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
              {planetPosition.depth > 0 && (
                <div className="transit-info">
                  Transit depth: {planetPosition.depth.toFixed(2)}%
                </div>
              )}
            </div>
          )}
          
          {phaseContent.showAnalysis && (
            <div className={`analysis-panel ${isTransitioning ? 'fade-out' : 'zoom-in'}`}>
              <h3>Analyzing Transit Data</h3>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${analysisProgress}%` }}
                />
                <span className="progress-text">{analysisProgress}%</span>
              </div>
              
              {analysisProgress > 30 && (
                <div className="data-item fade-in">
                  <span className="icon">📐</span>
                  <span>Calculating planet size...</span>
                  {analysisProgress > 40 && <span className="check">✓</span>}
                </div>
              )}
              
              {analysisProgress > 60 && (
                <div className="data-item fade-in">
                  <span className="icon">🌍</span>
                  <span>Determining orbital period...</span>
                  {analysisProgress > 70 && <span className="check">✓</span>}
                </div>
              )}

              {analysisProgress > 85 && (
                <div className="data-item fade-in">
                  <span className="icon">🔬</span>
                  <span>Verifying signal...</span>
                  {analysisProgress === 100 && <span className="check">✓</span>}
                </div>
              )}

              {analysisProgress === 100 && (
                <div className="result fade-in">
                  <strong>Exoplanet Confirmed!</strong>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Transition;