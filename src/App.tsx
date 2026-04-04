import { Canvas } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import { Scene } from './components/Scene';
import { UI } from './components/UI';
import { useGameStore } from './store';
import { useEffect, useState } from 'react';

export default function App() {
  const { status } = useGameStore();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="w-full h-screen bg-black overflow-hidden relative">
      <UI />
      
      <Canvas camera={{ position: [0, 0, 0], fov: 60 }}>
        <Scene />
        {(status === 'playing' || status === 'slowmo') && !isMobile && (
          <PointerLockControls />
        )}
      </Canvas>
    </div>
  );
}

