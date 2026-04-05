import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Vector3 } from 'three';

export type PlanetType = 'normal' | 'star' | 'blackhole' | 'x-planet';

export interface Debris {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  size: number;
  type: 'asteroid' | 'wreckage';
}

export interface Planet {
  id: string;
  name: string;
  type: PlanetType;
  visualType?: PlanetType;
  position: [number, number, number];
  size: number;
  color: string;
  info: string;
  stats: {
    mass: string;
    temperature: string;
    atmosphere: string;
  };
  discovered?: boolean;
}

interface GameState {
  status: 'intro' | 'playing' | 'visiting' | 'won' | 'whiteout' | 'slowmo' | 'blackhole-warning';
  planets: Planet[];
  visitedPlanets: string[];
  currentPlanet: Planet | null;
  playerPosition: [number, number, number];
  exploredRadius: number;
  lastNewDiscovery: string | null;
  nearestPlanetId: string | null;
  debris: Debris[];
  collisionTimestamp: number;
  
  setStatus: (status: GameState['status']) => void;
  addPlanet: (planet: Planet) => void;
  visitPlanet: (planetId: string) => void;
  setCurrentPlanet: (planet: Planet | null) => void;
  setPlayerPosition: (pos: [number, number, number]) => void;
  setExploredRadius: (radius: number) => void;
  setLastNewDiscovery: (planetId: string | null) => void;
  setNearestPlanetId: (id: string | null) => void;
  triggerCollision: () => void;
}

const initialPlanets: Planet[] = [
  {
    id: 'p1',
    name: 'Genesis Prime',
    type: 'star',
    visualType: 'star',
    position: [0, 0, 0],
    size: 14,
    color: '#fbbf24',
    info: 'The anchor of the sector. A stable yellow star that serves as the primary navigation point.',
    stats: { mass: '1.0 Suns', temperature: '5,800 K', atmosphere: 'Hydrogen Plasma' }
  },
  {
    id: 'p2',
    name: 'Siren’s Call',
    type: 'blackhole',
    visualType: 'normal',
    position: [60, -40, 80],
    size: 5,
    color: '#64748b',
    info: 'A deadly deception. It uses gravitational lensing to project the image of a rocky, habitable moon.',
    stats: { mass: '12 Suns', temperature: '0 K', atmosphere: 'None' }
  },
  {
    id: 'p3',
    name: 'Neon Giant',
    type: 'normal',
    visualType: 'star',
    position: [-90, 30, 120],
    size: 10,
    color: '#f472b6',
    info: 'A gas giant with an atmosphere so chemically volatile it glows with pink bioluminescence.',
    stats: { mass: '3 Jupiters', temperature: '900 K', atmosphere: 'Neon/Hydrogen' }
  },
  {
    id: 'p4',
    name: 'The Great Void',
    type: 'blackhole',
    visualType: 'blackhole',
    position: [140, 10, -50],
    size: 12,
    color: '#000000',
    info: 'An honest singularity. Its massive event horizon is clearly visible against the starfield.',
    stats: { mass: '500 Suns', temperature: '0.0001 K', atmosphere: 'None' }
  },
  {
    id: 'p5',
    name: 'Iron Star',
    type: 'star',
    visualType: 'normal',
    position: [-180, -60, -90],
    size: 4,
    color: '#94a3b8',
    info: 'A hyper-dense dwarf star that has cooled significantly, appearing like a dull grey planet.',
    stats: { mass: '0.8 Suns', temperature: '2,100 K', atmosphere: 'Metallic Vapor' }
  },
  {
    id: 'p6',
    name: 'Vantablack',
    type: 'normal',
    visualType: 'blackhole',
    position: [220, 50, 40],
    size: 7,
    color: '#020617',
    info: 'A carbon-rich planet that absorbs 99% of light. It looks like a hole in space but has a solid surface.',
    stats: { mass: '4 Earths', temperature: '120 K', atmosphere: 'Methane Soot' }
  },
  {
    id: 'p7',
    name: 'Lazarus',
    type: 'blackhole',
    visualType: 'star',
    position: [-30, 80, -180],
    size: 9,
    color: '#fef08a',
    info: 'A black hole consuming a nearby nebula. The friction creates a brilliant, star-like glow.',
    stats: { mass: '45 Suns', temperature: '1.2M K', atmosphere: 'Accretion Disk' }
  },
  {
    id: 'p8',
    name: 'Ghost Sun',
    type: 'star',
    visualType: 'blackhole',
    position: [110, -90, -230],
    size: 6,
    color: '#1e293b',
    info: 'A star emitting light in a spectrum invisible to the eye, appearing as a dark, warping void.',
    stats: { mass: '1.2 Suns', temperature: '4,000 K', atmosphere: 'Dark Plasma' }
  },
  {
    id: 'p9',
    name: 'Terra Nova',
    type: 'normal',
    visualType: 'normal',
    position: [-240, 20, 10],
    size: 3.5,
    color: '#22c55e',
    info: 'A lush terrestrial world. A perfect rest stop for travelers crossing the outer rim.',
    stats: { mass: '1.1 Earths', temperature: '290 K', atmosphere: 'Oxygen/Nitrogen' }
  },
  {
    id: 'p10',
    name: 'Solara II',
    type: 'star',
    visualType: 'star',
    position: [30, 150, 210],
    size: 13,
    color: '#ffffff',
    info: 'A blindingly bright white giant. It acts as a lighthouse for this corner of the sector.',
    stats: { mass: '3.5 Suns', temperature: '9,500 K', atmosphere: 'Helium' }
  },
  {
    id: 'p11',
    name: 'The Mimic',
    type: 'normal',
    visualType: 'blackhole',
    position: [190, -20, 150],
    size: 5,
    color: '#0f172a',
    info: 'A gas giant with a high concentration of dark matter dust, mimicking a singularity.',
    stats: { mass: '5 Jupiters', temperature: '80 K', atmosphere: 'Exotic Dust' }
  },
  {
    id: 'p12',
    name: 'Hellfire',
    type: 'normal',
    visualType: 'star',
    position: [-130, -110, 60],
    size: 4.5,
    color: '#ef4444',
    info: 'Tidally locked to a nearby star, its molten surface glows with the intensity of a sun.',
    stats: { mass: '2.5 Earths', temperature: '1,800 K', atmosphere: 'Silicate Vapor' }
  },
  {
    id: 'p13',
    name: 'Abyssal Maw',
    type: 'blackhole',
    visualType: 'normal',
    position: [-50, -150, -60],
    size: 10,
    color: '#7913ED',
    info: 'A supermassive black hole. The gravity is so strong that travel time near it slows down.',
    stats: { mass: '1000 Suns', temperature: '0 K', atmosphere: 'None' }
  },
  {
    id: 'p14',
    name: 'Aero',
    type: 'normal',
    visualType: 'normal',
    position: [80, 40, -140],
    size: 3,
    color: '#38bdf8',
    info: 'A serene gas planet with floating islands. Easy to approach and rich in fuel.',
    stats: { mass: '0.6 Jupiters', temperature: '220 K', atmosphere: 'Hydrogen/Helium' }
  },
  {
    id: 'p15',
    name: 'Cinder Dwarf',
    type: 'star',
    visualType: 'normal',
    position: [240, 110, -20],
    size: 2.5,
    color: '#71717a',
    info: 'A burnt-out star core. It looks like a rocky asteroid but has immense gravitational pull.',
    stats: { mass: '0.9 Suns', temperature: '3,000 K', atmosphere: 'None' }
  },
  {
    id: 'p16',
    name: 'Obsidian Point',
    type: 'blackhole',
    visualType: 'normal',
    position: [-200, 180, -110],
    size: 6,
    color: '#334155',
    info: 'A "Cold" black hole that has captured enough debris to form a fake planetary shell.',
    stats: { mass: '8 Suns', temperature: '5 K', atmosphere: 'Debris Field' }
  },
  {
    id: 'p17',
    name: 'Supernova Remnant',
    type: 'blackhole',
    visualType: 'star',
    position: [-10, -220, 190],
    size: 12,
    color: '#818cf8',
    info: 'The core is a singularity, but the exploding shell still glows with star-like brilliance.',
    stats: { mass: '25 Suns', temperature: '5M K', atmosphere: 'Plasma Cloud' }
  },
  {
    id: 'p18',
    name: 'Dark Sun',
    type: 'x-planet',
    visualType: 'blackhole',
    position: [160, 230, 240],
    size: 8,
    color: '#000000',
    info: 'A star whose light is being sucked back in by its own gravity, looking like a void.',
    stats: { mass: '3.2 Suns', temperature: '12,000 K', atmosphere: 'Hydrogen' }
  },
  {
    id: 'p19',
    name: 'Golden Rock',
    type: 'normal',
    visualType: 'normal',
    position: [-150, 45, 230],
    size: 4,
    color: '#fbbf24',
    info: 'An asteroid-rich planet. Its metallic surface reflects light perfectly.',
    stats: { mass: '0.4 Earths', temperature: '300 K', atmosphere: 'Thin Argon' }
  },
  {
    id: 'p20',
    name: 'The Eye',
    type: 'blackhole',
    visualType: 'blackhole',
    position: [0, 0, -250],
    size: 8,
    color: '#000000',
    info: 'The furthest point in the sector. A massive singularity that seems to watch the galaxy.',
    stats: { mass: '5000 Suns', temperature: '0.00001 K', atmosphere: 'None' }
  },{
    id: 'p21',
    name: 'Chronos',
    type: 'x-planet',
    visualType: 'normal',
    position: [196, 312, -88],
    size: 8,
    color: '#13BFED',
    info: 'A star whose light is being sucked back in by its own gravity, looking like a void.',
    stats: { mass: '3.2 Suns', temperature: '12,000 K', atmosphere: 'Hydrogen' }
  }
];

const initialDebris: Debris[] = Array.from({ length: 250 }).map((_, i) => {
  let pos: [number, number, number] = [0,0,0];
  do {
    pos = [
      (Math.random() - 0.5) * 800,
      (Math.random() - 0.5) * 300,
      (Math.random() - 0.5) * 800
    ];
  } while (Math.abs(pos[0]) < 30 && Math.abs(pos[1]) < 30 && Math.abs(pos[2]) < 30);
  
  return {
    id: `debris-${i}`,
    position: pos,
    rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
    size: Math.random() * 4 + 1,
    type: Math.random() > 0.85 ? 'wreckage' : 'asteroid'
  };
});

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      status: 'intro',
      planets: initialPlanets,
      visitedPlanets: [],
      currentPlanet: null,
      playerPosition: [0, 0, 0],
      exploredRadius: 50,
      lastNewDiscovery: null,
      nearestPlanetId: null,
      debris: initialDebris,
      collisionTimestamp: 0,

      setStatus: (status) => set({ status }),
      addPlanet: (planet) => set((state) => ({ planets: [...state.planets, planet] })),
      visitPlanet: (planetId) => set((state) => {
        const isNew = !state.visitedPlanets.includes(planetId);
        return { 
          visitedPlanets: isNew ? [...state.visitedPlanets, planetId] : state.visitedPlanets,
          planets: state.planets.map(p => p.id === planetId ? { ...p, discovered: true } : p),
          lastNewDiscovery: isNew ? planetId : state.lastNewDiscovery
        };
      }),
      setCurrentPlanet: (planet) => set({ currentPlanet: planet }),
      setPlayerPosition: (pos) => set({ playerPosition: pos }),
      setExploredRadius: (radius) => set({ exploredRadius: radius }),
      setLastNewDiscovery: (planetId) => set({ lastNewDiscovery: planetId }),
      setNearestPlanetId: (id) => set({ nearestPlanetId: id }),
      triggerCollision: () => set({ collisionTimestamp: Date.now() }),
    }),
    {
      name: 'juktiverse-save',
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (version === 0 || version === 1 || !version) {
          // Drop planets and debris from old saves so they load from initial state
          return {
            visitedPlanets: persistedState.visitedPlanets || [],
            playerPosition: persistedState.playerPosition || [0, 0, 0],
            exploredRadius: persistedState.exploredRadius || 50,
          };
        }
        return persistedState;
      },
      partialize: (state) => ({
        visitedPlanets: state.visitedPlanets,
        playerPosition: state.playerPosition,
        exploredRadius: state.exploredRadius,
      }),
    }
  )
);
