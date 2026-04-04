import { useGameStore, Planet } from '../store';
import { motion, AnimatePresence } from 'motion/react';
import { Map as MapIcon, Compass, Star, Info, X, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

function BlackHoleSound() {
  useEffect(() => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    audio.loop = true;
    audio.volume = 0.5;
    audio.play().catch(e => console.log('Audio play blocked:', e));
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);
  return null;
}

function BGMPlayer() {
  const { status } = useGameStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) {
      // TODO: Replace 'placeholder-bgm.mp3' with your actual background music URL
      audioRef.current = new Audio('placeholder-bgm.mp3');
      audioRef.current.loop = true;
      audioRef.current.volume = 0.2;
    }
  }, []);

  useEffect(() => {
    if (status !== 'intro' && audioRef.current) {
      audioRef.current.play().catch(e => console.log('BGM placeholder audio play failed:', e));
    }
  }, [status]);

  return null;
}

function WhiteoutEffect() {
  const { status } = useGameStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (status === 'whiteout') {
      // High-pitched sci-fi scanner/ringing sound for the bright star
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Whiteout audio play failed:', e));
      audioRef.current = audio;
    } else if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [status]);

  return null;
}

function CollisionEffect() {
  const { collisionTimestamp } = useGameStore();
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (collisionTimestamp > 0) {
      setIsActive(true);
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2771/2771-preview.mp3');
      audio.volume = 0.6;
      audio.play().catch(e => console.log('Audio play blocked:', e));

      const timer = setTimeout(() => setIsActive(false), 500);
      return () => clearTimeout(timer);
    }
  }, [collisionTimestamp]);

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 bg-red-600/30 pointer-events-none z-50 mix-blend-overlay"
        />
      )}
    </AnimatePresence>
  );
}

function DiscoveryNotification() {
  const { lastNewDiscovery, setLastNewDiscovery, planets } = useGameStore();
  const [planet, setPlanet] = useState<Planet | null>(null);

  useEffect(() => {
    if (lastNewDiscovery) {
      const p = planets.find(p => p.id === lastNewDiscovery);
      if (p) {
        setPlanet(p);
        
        // Play discovery sound
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.volume = 0.5;
        audio.play().catch(e => console.log('Audio play blocked:', e));

        const timer = setTimeout(() => {
          setLastNewDiscovery(null);
          setPlanet(null);
        }, 4000);
        return () => clearTimeout(timer);
      }
    }
  }, [lastNewDiscovery, planets, setLastNewDiscovery]);

  return (
    <AnimatePresence>
      {planet && (
        <motion.div
          initial={{ opacity: 0, x: 100, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.8 }}
          className="absolute top-24 right-6 pointer-events-auto bg-black/80 backdrop-blur-xl border border-orange-500/50 p-4 rounded-2xl flex items-center gap-4 shadow-[0_0_30px_rgba(234,88,12,0.3)] z-40"
        >
          <div 
            className="w-12 h-12 rounded-full shadow-inner"
            style={{ 
              background: `radial-gradient(circle at 30% 30%, ${planet.color}, #000)`,
              boxShadow: `0 0 15px ${planet.color}80`
            }}
          />
          <div>
            <div className="text-[10px] text-orange-500 font-bold uppercase tracking-widest mb-0.5">New Discovery</div>
            <div className="text-lg font-bold tracking-tight">{planet.name}</div>
          </div>
          <motion.div 
            className="absolute inset-0 rounded-2xl border-2 border-orange-500/20"
            animate={{ scale: [1, 1.05, 1], opacity: [0.2, 0.5, 0.2] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MiniMap({ onClick }: { onClick?: () => void }) {
  const { planets, playerPosition, visitedPlanets } = useGameStore();
  const mapScale = 0.2; // Scale down the 3D coordinates to map pixels
  const mapSize = 150; // Map size in pixels
  const center = mapSize / 2;

  return (
    <div 
      className={`relative bg-black/50 backdrop-blur-md border border-white/20 rounded-full overflow-hidden shadow-[0_0_15px_rgba(234,88,12,0.2)] ${onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
      style={{ width: mapSize, height: mapSize }}
      onClick={onClick}
    >
      {/* Player Blip */}
      <div 
        className="absolute w-2 h-2 bg-orange-500 rounded-full shadow-[0_0_5px_#f97316] z-10"
        style={{ 
          left: center - 4, 
          top: center - 4,
          transform: 'translate(-50%, -50%)'
        }}
      />
      
      {/* Planets */}
      {planets.map(planet => {
        // Calculate relative position
        const dx = (planet.position[0] - playerPosition[0]) * mapScale;
        const dz = (planet.position[2] - playerPosition[2]) * mapScale;
        
        // Only show if within map bounds or if discovered
        const distance = Math.sqrt(dx * dx + dz * dz);
        const isDiscovered = visitedPlanets.includes(planet.id) && planet.type !== 'x-planet' && planet.type !== 'star';
        
        if (distance > center && !isDiscovered) return null;

        // Clamp position to map edge if discovered but far away
        let x = center + dx;
        let y = center + dz;
        
        if (distance > center) {
          const angle = Math.atan2(dz, dx);
          x = center + Math.cos(angle) * (center - 4);
          y = center + Math.sin(angle) * (center - 4);
        }

        return (
          <div 
            key={planet.id}
            className={`absolute w-2 h-2 rounded-full ${isDiscovered ? 'bg-white' : 'bg-gray-500/50'}`}
            style={{ 
              left: x, 
              top: y,
              transform: 'translate(-50%, -50%)',
              backgroundColor: isDiscovered ? planet.color : 'rgba(156, 163, 175, 0.5)',
              boxShadow: isDiscovered ? `0 0 8px ${planet.color}` : 'none',
              border: isDiscovered ? 'none' : '1px solid rgba(255,255,255,0.2)'
            }}
            title={isDiscovered ? planet.name : 'Unknown'}
          />
        );
      })}
    </div>
  );
}

function FullMap({ onClose }: { onClose: () => void }) {
  const { planets, playerPosition, visitedPlanets } = useGameStore();
  
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const zoomFactor = 0.1;
    setZoom(z => Math.max(0.5, Math.min(10, z - Math.sign(e.deltaY) * zoomFactor)));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    setPan(p => ({ x: p.x + dx, y: p.y + dy }));
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };
  
  let minX = 0, maxX = 0, minZ = 0, maxZ = 0;
  planets.forEach(p => {
    minX = Math.min(minX, p.position[0]);
    maxX = Math.max(maxX, p.position[0]);
    minZ = Math.min(minZ, p.position[2]);
    maxZ = Math.max(maxZ, p.position[2]);
  });
  minX = Math.min(minX, playerPosition[0]);
  maxX = Math.max(maxX, playerPosition[0]);
  minZ = Math.min(minZ, playerPosition[2]);
  maxZ = Math.max(maxZ, playerPosition[2]);

  const padding = 100;
  minX -= padding; maxX += padding;
  minZ -= padding; maxZ += padding;
  
  const width = maxX - minX;
  const height = maxZ - minZ;
  const maxDim = Math.max(width, height);
  
  const cx = (minX + maxX) / 2;
  const cz = (minZ + maxZ) / 2;
  
  const mapMinX = cx - maxDim / 2;
  const mapMinZ = cz - maxDim / 2;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-4 md:p-8 pointer-events-auto"
    >
      <div className="w-full max-w-3xl flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-orange-500 tracking-widest uppercase">Stellar Map</h2>
        <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>
      
      <div 
        className="relative w-full max-w-3xl aspect-square bg-black/50 border border-white/20 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(234,88,12,0.1)] touch-none cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div 
          className="absolute inset-0 origin-center transition-transform duration-75 ease-out"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
        >
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '10% 10%' }} />
          
          {/* Player */}
          <div 
            className="absolute w-4 h-4 bg-orange-500 rounded-full shadow-[0_0_15px_#f97316] z-20"
            style={{ 
              left: `${((playerPosition[0] - mapMinX) / maxDim) * 100}%`, 
              top: `${((playerPosition[2] - mapMinZ) / maxDim) * 100}%`,
              transform: `translate(-50%, -50%) scale(${1 / zoom})`
            }}
          >
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 text-xs font-bold tracking-widest font-mono text-orange-400">YOU</div>
          </div>

          {/* Planets */}
          {planets.map(planet => {
            const isDiscovered = visitedPlanets.includes(planet.id) && planet.type !== 'x-planet' && planet.type !== 'star';
            const left = `${((planet.position[0] - mapMinX) / maxDim) * 100}%`;
            const top = `${((planet.position[2] - mapMinZ) / maxDim) * 100}%`;
            
            return (
              <div 
                key={planet.id}
                className={`absolute flex flex-col items-center justify-center z-10`}
                style={{ 
                  left, 
                  top,
                  transform: `translate(-50%, -50%) scale(${1 / zoom})`,
                }}
              >
                <div 
                  className={`w-6 h-6 rounded-full ${isDiscovered ? 'bg-white' : 'bg-gray-500/50'}`}
                  style={{
                    backgroundColor: isDiscovered ? planet.color : 'rgba(156, 163, 175, 0.3)',
                    boxShadow: isDiscovered ? `0 0 20px ${planet.color}` : 'none',
                    border: isDiscovered ? 'none' : '2px dashed rgba(255,255,255,0.4)'
                  }}
                />
                <div className={`mt-2 text-xs md:text-sm font-mono font-bold whitespace-nowrap px-2 py-1 rounded bg-black/50 backdrop-blur-sm ${isDiscovered ? 'text-white' : 'text-gray-400'}`}>
                  {isDiscovered ? planet.name : 'Unknown Signal'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Zoom Controls */}
      <div className="absolute bottom-16 right-4 md:bottom-8 md:right-8 flex flex-col gap-2 z-50">
        <button 
          onClick={() => setZoom(z => Math.min(10, z + 0.5))} 
          className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-xl backdrop-blur-md border border-white/20 transition-colors"
        >
          +
        </button>
        <button 
          onClick={() => setZoom(z => Math.max(0.5, z - 0.5))} 
          className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-xl backdrop-blur-md border border-white/20 transition-colors"
        >
          -
        </button>
        <button 
          onClick={() => { setZoom(1); setPan({x: 0, y: 0}); }} 
          className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-xs backdrop-blur-md border border-white/20 transition-colors"
        >
          RST
        </button>
      </div>
    </motion.div>
  );
}

export function UI() {
  const { status, setStatus, currentPlanet, visitedPlanets, planets, playerPosition, nearestPlanetId } = useGameStore();
  const [isMobile, setIsMobile] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (status === 'won') {
      const timer = setTimeout(() => {
        window.location.href = 'https://example.com/winning-page-placeholder';
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleStart = () => {
    setStatus('playing');
  };

  const handleCloseInfo = () => {
    if (currentPlanet?.type === 'x-planet') {
      window.location.href = 'https://example.com/winning-page-placeholder';
    } else {
      setStatus('playing');
    }
  };

  // Mobile movement simulation by dispatching keyboard events
  const simulateKey = (code: string, isDown: boolean) => {
    const event = new KeyboardEvent(isDown ? 'keydown' : 'keyup', { code });
    window.dispatchEvent(event);
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 font-sans text-white select-none">
      <BGMPlayer />
      <CollisionEffect />
      <WhiteoutEffect />
      <DiscoveryNotification />
      <AnimatePresence>
        {status === 'intro' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black flex flex-col items-center justify-center pointer-events-auto overflow-hidden"
          >
            {/* Optional Intro Video Background */}
            <video 
              autoPlay 
              loop 
              muted 
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-30"
              src="https://cdn.pixabay.com/video/2020/04/17/36423-411478147_large.mp4"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/80 to-black" />

            <div className="max-w-2xl text-center space-y-8 p-8 relative z-10">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-orange-500 drop-shadow-[0_0_15px_rgba(234,88,12,0.8)]">
                JUKTIVERSE
              </h1>
              <p className="text-lg md:text-xl text-gray-300">
                Explore the unknown. Discover strange new worlds. Find the legendary X-Planet.
              </p>
              <div className="space-y-4 text-left bg-white/5 p-6 rounded-xl border border-white/10 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-orange-400 flex items-center gap-2">
                  <Compass className="w-5 h-5" /> Navigation
                </h3>
                <ul className="text-gray-400 space-y-2 text-sm md:text-base">
                  <li>• Use <span className="text-white font-mono bg-white/10 px-2 py-1 rounded">W A S D</span> to move forward/backward/left/right.</li>
                  <li>• Use <span className="text-white font-mono bg-white/10 px-2 py-1 rounded">Space</span> / <span className="text-white font-mono bg-white/10 px-2 py-1 rounded">Shift</span> to move up/down.</li>
                  <li>• Use <span className="text-white font-mono bg-white/10 px-2 py-1 rounded">Mouse/Touch</span> to look around.</li>
                  <li>• Approach planets to investigate them.</li>
                  <li>• Beware of stellar phenomena.</li>
                </ul>
              </div>
              <button 
                onClick={handleStart}
                className="px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-full transition-colors text-lg tracking-wide shadow-[0_0_20px_rgba(234,88,12,0.4)] hover:shadow-[0_0_30px_rgba(234,88,12,0.6)]"
              >
                INITIATE LAUNCH
              </button>
            </div>
          </motion.div>
        )}

        {status === 'playing' && (
          <>
            {/* Top Bar & MiniMap */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-6 md:top-4 left-4 right-4 flex justify-between items-start pointer-events-auto"
            >
              <div className="bg-black/80 backdrop-blur-md border border-white/10 p-3 md:p-4 rounded-2xl flex items-center gap-3 md:gap-6 shadow-2xl max-w-[60%] md:max-w-none overflow-hidden">
                <div className="flex items-center gap-2 md:gap-3 shrink-0">
                  <MapIcon className="w-4 h-4 md:w-6 md:h-6 text-orange-500" />
                  <div>
                    <div className="text-[9px] md:text-xs text-gray-400 uppercase tracking-wider font-semibold">Explored</div>
                    <div className="text-xs md:text-lg font-mono">{visitedPlanets.length} / {planets.length}</div>
                  </div>
                </div>
                <div className="w-px h-6 md:h-8 bg-white/20 shrink-0"></div>
                <div className="flex items-center gap-2 md:gap-3 shrink-0">
                  <Compass className="w-4 h-4 md:w-6 md:h-6 text-orange-500" />
                  <div>
                    <div className="text-[9px] md:text-xs text-gray-400 uppercase tracking-wider font-semibold">Coords</div>
                    <div className="text-xs md:text-lg font-mono">
                      {Math.round(playerPosition[0])}, {Math.round(playerPosition[2])}
                    </div>
                  </div>
                </div>
              </div>

              <div className="scale-75 origin-top-right md:scale-100 shrink-0">
                <MiniMap onClick={() => setIsMapOpen(true)} />
              </div>
            </motion.div>

            {/* Mobile Controls */}
            {isMobile && (
              <>
                <div className="absolute bottom-16 left-4 sm:bottom-20 sm:left-8 pointer-events-auto flex flex-col items-center gap-2">
                  <button 
                    onPointerDown={() => simulateKey('KeyW', true)}
                    onPointerUp={() => simulateKey('KeyW', false)}
                    onPointerLeave={() => simulateKey('KeyW', false)}
                    className="w-12 h-12 sm:w-14 sm:h-14 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center active:bg-white/30 border border-white/20"
                  >
                    <ChevronUp className="w-8 h-8" />
                  </button>
                  <div className="flex gap-2">
                    <button 
                      onPointerDown={() => simulateKey('KeyA', true)}
                      onPointerUp={() => simulateKey('KeyA', false)}
                      onPointerLeave={() => simulateKey('KeyA', false)}
                      className="w-12 h-12 sm:w-14 sm:h-14 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center active:bg-white/30 border border-white/20"
                    >
                      <ChevronLeft className="w-8 h-8" />
                    </button>
                    <button 
                      onPointerDown={() => simulateKey('KeyS', true)}
                      onPointerUp={() => simulateKey('KeyS', false)}
                      onPointerLeave={() => simulateKey('KeyS', false)}
                      className="w-12 h-12 sm:w-14 sm:h-14 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center active:bg-white/30 border border-white/20"
                    >
                      <ChevronDown className="w-8 h-8" />
                    </button>
                    <button 
                      onPointerDown={() => simulateKey('KeyD', true)}
                      onPointerUp={() => simulateKey('KeyD', false)}
                      onPointerLeave={() => simulateKey('KeyD', false)}
                      className="w-12 h-12 sm:w-14 sm:h-14 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center active:bg-white/30 border border-white/20"
                    >
                      <ChevronRight className="w-8 h-8" />
                    </button>
                  </div>
                </div>
                
                {/* Mobile Up/Down Controls */}
                <div className="absolute bottom-16 right-4 sm:bottom-20 sm:right-8 pointer-events-auto flex flex-col items-center gap-2">
                  <button 
                    onPointerDown={() => simulateKey('Space', true)}
                    onPointerUp={() => simulateKey('Space', false)}
                    onPointerLeave={() => simulateKey('Space', false)}
                    className="w-14 h-14 sm:w-16 sm:h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center active:bg-white/30 border border-white/20"
                  >
                    <span className="font-bold text-lg">UP</span>
                  </button>
                  <button 
                    onPointerDown={() => simulateKey('ShiftLeft', true)}
                    onPointerUp={() => simulateKey('ShiftLeft', false)}
                    onPointerLeave={() => simulateKey('ShiftLeft', false)}
                    className="w-14 h-14 sm:w-16 sm:h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center active:bg-white/30 border border-white/20"
                  >
                    <span className="font-bold text-lg">DN</span>
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {status === 'whiteout' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 bg-white z-50 flex items-center justify-center p-8"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-center"
            >
              <h2 className="text-3xl md:text-5xl font-bold text-black mb-4 tracking-tight">
                The star is too bright
              </h2>
              <motion.p 
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="text-xl md:text-2xl text-orange-600 font-mono font-semibold uppercase tracking-widest"
              >
                TRYING to acquire planet info.
              </motion.p>
            </motion.div>
          </motion.div>
        )}

        {status === 'blackhole-warning' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-red-950/40 z-50 flex items-center justify-center p-8 backdrop-blur-md"
          >
            <BlackHoleSound />
            <div className="max-w-md w-full text-center space-y-6">
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                  rotate: [-5, 5, -5]
                }}
                transition={{ repeat: Infinity, duration: 0.5 }}
                className="flex justify-center"
              >
                <AlertTriangle className="w-24 h-24 text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]" />
              </motion.div>
              
              <div className="space-y-2">
                <h2 className="text-4xl font-black text-red-500 tracking-tighter uppercase italic">
                  ERROR!
                </h2>
                <p className="text-xl font-bold text-white tracking-tight leading-tight">
                  It's a hidden black hole. System is trying to get you out of it.
                </p>
              </div>

              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 12, ease: "linear" }}
                  className="bg-red-500 h-full"
                />
              </div>
              
              <p className="text-xs text-red-400 font-mono animate-pulse">
                CRITICAL GRAVITATIONAL ANOMALY DETECTED
              </p>
            </div>
          </motion.div>
        )}

        {status === 'visiting' && currentPlanet && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto p-4 z-50"
          >
            <div className="bg-zinc-950 border border-white/10 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl">
              <div className="h-32 relative flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-50" style={{ backgroundColor: currentPlanet.color }} />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent" />
                <div 
                  className="w-24 h-24 rounded-full shadow-[0_0_50px_rgba(0,0,0,0.5)] relative z-10"
                  style={{ 
                    background: `radial-gradient(circle at 30% 30%, ${currentPlanet.color}, #000)`,
                    boxShadow: `0 0 40px ${currentPlanet.color}40`
                  }}
                />
              </div>
              
              <div className="p-6 md:p-8 space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-orange-500 mb-1">
                    <Star className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">{currentPlanet.type}</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold">{currentPlanet.name}</h2>
                </div>

                <p className="text-gray-300 leading-relaxed text-sm md:text-base">
                  {currentPlanet.info}
                </p>

                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="bg-white/5 p-3 md:p-4 rounded-xl border border-white/5">
                    <div className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider mb-1">Mass</div>
                    <div className="font-mono text-xs md:text-sm">{currentPlanet.stats.mass}</div>
                  </div>
                  <div className="bg-white/5 p-3 md:p-4 rounded-xl border border-white/5">
                    <div className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider mb-1">Temp</div>
                    <div className="font-mono text-xs md:text-sm">{currentPlanet.stats.temperature}</div>
                  </div>
                  <div className="bg-white/5 p-3 md:p-4 rounded-xl border border-white/5 col-span-2">
                    <div className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider mb-1">Atmosphere</div>
                    <div className="font-mono text-xs md:text-sm">{currentPlanet.stats.atmosphere}</div>
                  </div>
                </div>

                <button 
                  onClick={handleCloseInfo}
                  className="w-full py-3 md:py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <X className="w-5 h-5" /> Close Data Log
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {status === 'won' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black flex flex-col items-center justify-center pointer-events-auto"
          >
            <div className="max-w-2xl text-center space-y-8 p-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
              >
                <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-purple-500 mb-4">MISSION ACCOMPLISHED</h1>
                <h2 className="text-2xl md:text-3xl text-white">You found the X-Planet!</h2>
              </motion.div>
              
              <p className="text-lg md:text-xl text-gray-400">
                You explored {visitedPlanets.length} celestial bodies on your journey.
                The secrets of the universe are now yours to uncover.
              </p>

              <p className="text-sm text-purple-400 animate-pulse mt-8">
                Redirecting to the winning page in a few seconds...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Full Map Overlay */}
      <AnimatePresence>
        {isMapOpen && <FullMap onClose={() => setIsMapOpen(false)} />}
      </AnimatePresence>

      {/* Interaction Prompt */}
      <AnimatePresence>
        {status === 'playing' && nearestPlanetId && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, x: '-50%', y: isMobile ? '-50%' : '0%' }}
            animate={{ opacity: 1, scale: 1, x: '-50%', y: isMobile ? '-50%' : '0%' }}
            exit={{ opacity: 0, scale: 0.8, x: '-50%', y: isMobile ? '-50%' : '0%' }}
            className={`absolute left-1/2 text-center z-40 ${isMobile ? 'top-1/2' : 'bottom-12'}`}
          >
            <div 
              className={`bg-black/90 backdrop-blur-xl border-2 border-orange-500/50 rounded-2xl flex flex-col items-center justify-center gap-4 shadow-[0_0_40px_rgba(234,88,12,0.4)] pointer-events-auto cursor-pointer hover:bg-black transition-all active:scale-95 ${isMobile ? 'p-8 w-[280px]' : 'px-6 py-3 rounded-full flex-row'}`}
              onClick={() => simulateKey('KeyE', true)}
            >
              <div className={`bg-orange-500/20 p-3 rounded-full ${!isMobile && 'p-1'}`}>
                <Info className={`${isMobile ? 'w-8 h-8' : 'w-5 h-5'} text-orange-500`} />
              </div>
              <div className="flex flex-col items-center">
                <span className={`${isMobile ? 'text-xl font-bold' : 'font-medium'} tracking-wide text-white`}>
                  {isMobile ? 'INVESTIGATE' : <>Press <span className="font-mono bg-white/20 px-2 py-0.5 rounded mx-1">E</span> to investigate</>}
                </span>
                {isMobile && <span className="text-xs text-orange-400 mt-1 uppercase tracking-widest font-bold">Tap to scan planet</span>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

