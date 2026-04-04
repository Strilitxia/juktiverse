import { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sphere, Stars, Trail, Html, Icosahedron, Box } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore, Planet, Debris } from '../store';

// Player Controller
function Player() {
  const { camera, gl } = useThree();
  const { status, setPlayerPosition, planets, setStatus, setCurrentPlanet, visitPlanet, setNearestPlanetId, debris, triggerCollision } = useGameStore();
  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());
  const speed = 0.5;
  const keys = useRef<{ [key: string]: boolean }>({});
  const [nearestPlanet, setNearestPlanet] = useState<Planet | null>(null);
  const lastCollisionTime = useRef(0);

  // Touch controls state
  const isDragging = useRef(false);
  const previousTouch = useRef({ x: 0, y: 0 });

  // Initialize camera position from saved state
  useEffect(() => {
    const savedPos = useGameStore.getState().playerPosition;
    if (savedPos && !savedPos.some(isNaN) && (savedPos[0] !== 0 || savedPos[1] !== 0 || savedPos[2] !== 0)) {
      camera.position.set(...savedPos);
    }
  }, [camera]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keys.current[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Mobile touch camera controls
  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (e.targetTouches.length > 0) {
        isDragging.current = true;
        previousTouch.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (isDragging.current && e.targetTouches.length > 0 && status === 'playing') {
        const touch = e.targetTouches[0];
        const deltaX = touch.clientX - previousTouch.current.x;
        const deltaY = touch.clientY - previousTouch.current.y;
        
        if (!isNaN(deltaX) && !isNaN(deltaY)) {
          camera.rotation.order = 'YXZ';
          camera.rotation.y -= deltaX * 0.005;
          camera.rotation.x -= deltaY * 0.005;
          
          // Clamp pitch
          camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
        }
        
        previousTouch.current = { x: touch.clientX, y: touch.clientY };
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (e.targetTouches.length === 0) {
        isDragging.current = false;
      }
    };

    const domElement = gl.domElement;
    domElement.addEventListener('touchstart', onTouchStart, { passive: true });
    domElement.addEventListener('touchmove', onTouchMove, { passive: true });
    domElement.addEventListener('touchend', onTouchEnd);
    
    return () => {
      domElement.removeEventListener('touchstart', onTouchStart);
      domElement.removeEventListener('touchmove', onTouchMove);
      domElement.removeEventListener('touchend', onTouchEnd);
    };
  }, [camera, gl, status]);

  useEffect(() => {
    const handleInteract = (e: KeyboardEvent) => {
      if (e.code === 'KeyE' && nearestPlanet && status === 'playing') {
        handleVisitPlanet(nearestPlanet);
      }
    };
    window.addEventListener('keydown', handleInteract);
    return () => window.removeEventListener('keydown', handleInteract);
  }, [nearestPlanet, status]);

  const handleVisitPlanet = (planet: Planet) => {
    setCurrentPlanet(planet);
    visitPlanet(planet.id);
    
    if (planet.type === 'x-planet') {
      setStatus('won');
    } else if (planet.type === 'star') {
      setStatus('whiteout');
      setTimeout(() => {
        setStatus('visiting');
      }, 5000);
    } else if (planet.type === 'blackhole') {
      setStatus('blackhole-warning');
      setTimeout(() => {
        setStatus('visiting');
      }, 12000);
    } else {
      setStatus('visiting');
    }
  };

  useFrame((state, delta) => {
    if (status !== 'playing' && status !== 'slowmo' && status !== 'blackhole-warning') return;

    const timeScale = (status === 'slowmo' || status === 'blackhole-warning') ? 0.1 : 1;
    const currentSpeed = speed * timeScale;

    direction.current.set(0, 0, 0);

    if (keys.current['KeyW']) direction.current.z -= 1;
    if (keys.current['KeyS']) direction.current.z += 1;
    if (keys.current['KeyA']) direction.current.x -= 1;
    if (keys.current['KeyD']) direction.current.x += 1;
    if (keys.current['Space']) direction.current.y += 1;
    if (keys.current['ShiftLeft'] || keys.current['ShiftRight']) direction.current.y -= 1;

    direction.current.normalize();
    
    // Apply full camera rotation to movement direction (allows flying where you look)
    direction.current.applyQuaternion(camera.quaternion);

    velocity.current.lerp(direction.current.multiplyScalar(currentSpeed), 0.1);
    camera.position.add(velocity.current);

    // Update store position periodically
    if (Math.random() < 0.1) {
      if (!isNaN(camera.position.x) && !isNaN(camera.position.y) && !isNaN(camera.position.z)) {
        setPlayerPosition([camera.position.x, camera.position.y, camera.position.z]);
      }
    }

    // Check proximity and view angle to planets
    let closest: Planet | null = null;
    let minDistanceSq = Infinity;
    
    const cameraDir = new THREE.Vector3();
    camera.getWorldDirection(cameraDir);
    
    for (const planet of planets) {
      const dx = camera.position.x - planet.position[0];
      const dy = camera.position.y - planet.position[1];
      const dz = camera.position.z - planet.position[2];
      const distSq = dx*dx + dy*dy + dz*dz;
      
      const threshold = planet.size + 20;
      if (distSq < threshold * threshold) {
        const planetPos = new THREE.Vector3(...planet.position);
        const dirToPlanet = planetPos.sub(camera.position).normalize();
        const dotProduct = cameraDir.dot(dirToPlanet);
        
        // dotProduct > 0.75 means looking roughly towards it
        if (dotProduct > 0.75 && distSq < minDistanceSq) {
          minDistanceSq = distSq;
          closest = planet;
        }
      }
    }

    if (closest?.id !== nearestPlanet?.id) {
      setNearestPlanet(closest);
      setNearestPlanetId(closest?.id || null);
    }

    // Check debris collision
    for (const d of debris) {
      const dx = camera.position.x - d.position[0];
      const dy = camera.position.y - d.position[1];
      const dz = camera.position.z - d.position[2];
      const distSq = dx*dx + dy*dy + dz*dz;
      const minDist = d.size + 1.5;
      
      if (distSq < minDist * minDist && state.clock.elapsedTime - lastCollisionTime.current > 0.5) {
        lastCollisionTime.current = state.clock.elapsedTime;
        const knockback = new THREE.Vector3(dx, dy, dz).normalize().multiplyScalar(2);
        velocity.current.copy(knockback);
        camera.position.add(knockback);
        triggerCollision();
      }
    }
  });

  return null;
}

// Instanced Debris Component for Performance
function InstancedDebris() {
  const { debris, status } = useGameStore();
  const asteroidRef = useRef<THREE.InstancedMesh>(null);
  const wreckageRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const asteroids = useMemo(() => debris.filter(d => d.type === 'asteroid'), [debris]);
  const wreckages = useMemo(() => debris.filter(d => d.type === 'wreckage'), [debris]);

  useFrame((state) => {
    const timeScale = (status === 'slowmo' || status === 'blackhole-warning') ? 0.1 : 1;
    const time = state.clock.elapsedTime;

    if (asteroidRef.current) {
      asteroids.forEach((d, i) => {
        dummy.position.set(...d.position);
        dummy.rotation.set(
          d.rotation[0] + time * 0.2 * timeScale,
          d.rotation[1] + time * 0.3 * timeScale,
          d.rotation[2]
        );
        dummy.scale.setScalar(d.size);
        dummy.updateMatrix();
        asteroidRef.current!.setMatrixAt(i, dummy.matrix);
      });
      asteroidRef.current.instanceMatrix.needsUpdate = true;
    }

    if (wreckageRef.current) {
      wreckages.forEach((d, i) => {
        dummy.position.set(...d.position);
        dummy.rotation.set(
          d.rotation[0] + time * 0.2 * timeScale,
          d.rotation[1] + time * 0.3 * timeScale,
          d.rotation[2]
        );
        dummy.scale.set(d.size, d.size * 0.5, d.size * 2);
        dummy.updateMatrix();
        wreckageRef.current!.setMatrixAt(i, dummy.matrix);
      });
      wreckageRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      {asteroids.length > 0 && (
        <instancedMesh ref={asteroidRef} args={[undefined, undefined, asteroids.length]}>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#554433" roughness={0.9} />
        </instancedMesh>
      )}
      {wreckages.length > 0 && (
        <instancedMesh ref={wreckageRef} args={[undefined, undefined, wreckages.length]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#666677" roughness={0.8} metalness={0.6} />
        </instancedMesh>
      )}
    </>
  );
}

// Planet Component
function PlanetMesh({ planet }: { planet: Planet }) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const diskRef1 = useRef<THREE.Mesh>(null);
  const diskRef2 = useRef<THREE.Mesh>(null);
  const htmlRef = useRef<HTMLDivElement>(null);
  const { status, lastNewDiscovery } = useGameStore();
  const isNewlyDiscovered = lastNewDiscovery === planet.id;
  
  const planetPos = useMemo(() => new THREE.Vector3(...planet.position), [planet.position]);
  const displayType = planet.visualType || planet.type;
  
  useFrame((state) => {
    const distSq = state.camera.position.distanceToSquared(planetPos);
    
    if (htmlRef.current) {
      htmlRef.current.style.opacity = distSq < 90000 ? '1' : '0'; // ~300 units
      htmlRef.current.style.pointerEvents = distSq < 90000 ? 'auto' : 'none';
    }

    if (meshRef.current) {
      const timeScale = (status === 'slowmo' || status === 'blackhole-warning') ? 0.1 : 1;
      meshRef.current.rotation.y += 0.005 * timeScale;
      
      if (displayType === 'blackhole' && (status === 'slowmo' || status === 'blackhole-warning')) {
        // Expand black hole effect
        const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
        meshRef.current.scale.setScalar(scale);
      }
    }

    if (glowRef.current && isNewlyDiscovered) {
      const s = 1.2 + Math.sin(state.clock.elapsedTime * 8) * 0.1;
      glowRef.current.scale.setScalar(s);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = 0.4 + Math.sin(state.clock.elapsedTime * 8) * 0.2;
    }

    if (displayType === 'blackhole') {
      const timeScale = (status === 'slowmo' || status === 'blackhole-warning') ? 0.1 : 1;
      if (diskRef1.current) diskRef1.current.rotation.z -= 0.01 * timeScale;
      if (diskRef2.current) diskRef2.current.rotation.z -= 0.015 * timeScale;
    }
  });

  const material = useMemo(() => {
    if (displayType === 'star') {
      return new THREE.MeshBasicMaterial({ color: planet.color });
    }
    if (displayType === 'blackhole') {
      return new THREE.MeshStandardMaterial({ 
        color: '#000000',
        roughness: 1,
        metalness: 0,
        emissive: '#111111',
        emissiveIntensity: 0.2
      });
    }
    return new THREE.MeshStandardMaterial({ 
      color: planet.color,
      roughness: 0.7,
      metalness: 0.2,
    });
  }, [planet, displayType]);

  return (
    <group ref={groupRef} position={planet.position}>
      <Sphere ref={meshRef} args={[planet.size, 64, 64]}>
        <primitive object={material} attach="material" />
      </Sphere>
      
      {/* Discovery Pulse Glow */}
      {isNewlyDiscovered && (
        <Sphere ref={glowRef} args={[planet.size * 1.5, 32, 32]}>
          <meshBasicMaterial color={planet.color} transparent opacity={0.4} side={THREE.BackSide} />
        </Sphere>
      )}

      {/* Atmosphere glow for normal planets and stars */}
      {(displayType === 'normal' || displayType === 'star' || displayType === 'x-planet') && (
        <Sphere args={[planet.size * 1.1, 32, 32]}>
          <meshBasicMaterial 
            color={planet.color} 
            transparent 
            opacity={displayType === 'star' ? 0.4 : 0.15} 
            side={THREE.BackSide} 
          />
        </Sphere>
      )}

      {/* Accretion disk for black hole */}
      {displayType === 'blackhole' && (
        <group rotation={[Math.PI / 2.2, 0, 0]}>
          {/* Outer faint disk */}
          <mesh ref={diskRef1}>
            <ringGeometry args={[planet.size * 1.5, planet.size * 3.5, 64]} />
            <meshBasicMaterial color="#ff4400" transparent opacity={0.3} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
          </mesh>
          {/* Inner bright disk */}
          <mesh ref={diskRef2}>
            <ringGeometry args={[planet.size * 1.2, planet.size * 2.2, 64]} />
            <meshBasicMaterial color="#ffaa00" transparent opacity={0.6} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
          </mesh>
          {/* Photon ring (glow around the event horizon) */}
          <mesh rotation={[-Math.PI / 2.2, 0, 0]}>
            <sphereGeometry args={[planet.size * 1.05, 32, 32]} />
            <meshBasicMaterial color="#ff4400" transparent opacity={0.8} side={THREE.BackSide} blending={THREE.AdditiveBlending} />
          </mesh>
        </group>
      )}
      
      {/* Planet Label */}
      <Html distanceFactor={100} position={[0, planet.size + 2, 0]} center>
        <div ref={htmlRef} className="text-white/50 text-xs font-mono tracking-widest uppercase whitespace-nowrap pointer-events-none transition-opacity duration-300">
          {planet.name}
        </div>
      </Html>
    </group>
  );
}

// Dynamic Space Particles
function SpaceParticles() {
  const { status, playerPosition } = useGameStore();
  const particlesRef = useRef<THREE.Points>(null);
  
  const particleCount = 2000;
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 400;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 400;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 400;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (particlesRef.current) {
      const timeScale = (status === 'slowmo' || status === 'blackhole-warning') ? 0.1 : 1;
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.02 * timeScale;
      particlesRef.current.rotation.x = state.clock.elapsedTime * 0.01 * timeScale;
      
      // Move particles relative to player to create infinite space illusion
      if (status === 'playing' || status === 'slowmo' || status === 'blackhole-warning') {
        particlesRef.current.position.set(
          playerPosition[0] * 0.5,
          playerPosition[1] * 0.5,
          playerPosition[2] * 0.5
        );
      }
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
      </bufferGeometry>
      <pointsMaterial
        size={0.5}
        color="#ffffff"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

export function Scene() {
  const { planets, debris } = useGameStore();

  return (
    <>
      <color attach="background" args={['#050505']} />
      <ambientLight intensity={0.2} />
      <directionalLight position={[10, 20, 10]} intensity={1.5} color="#ffffff" />
      
      {/* Star light source */}
      {planets.filter(p => (p.visualType || p.type) === 'star').map(star => (
        <pointLight key={`light-${star.id}`} position={star.position} intensity={2} color={star.color} distance={200} />
      ))}

      <SpaceParticles />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      {planets.map((planet) => (
        <PlanetMesh key={planet.id} planet={planet} />
      ))}

      <InstancedDebris />

      <Player />
    </>
  );
}
