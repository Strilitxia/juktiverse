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
    name: 'Genesis',
    type: 'star',
    visualType: 'star',
    position: [0, 0, 0],
    size: 15,
    color: '#fcd34d',
    info: 'The Central Sun. It is exactly what it appears to be: a stable yellow dwarf.',
    stats: { mass: '1.0 Suns', temperature: '5,778 K', atmosphere: 'Hydrogen Plasma' }
  },
  {
    id: 'p2',
    name: 'Vesta',
    type: 'normal',
    visualType: 'normal',
    position: [40, 10, 30],
    size: 4,
    color: '#60a5fa',
    info: 'A standard terrestrial world. Water-rich and orbiting safely near the star.',
    stats: { mass: '1.1 Earths', temperature: '288 K', atmosphere: 'Nitrogen/Oxygen' }
  },
  {
    id: 'p3',
    name: 'Icarus',
    type: 'normal',
    visualType: 'star',
    position: [80, -5, 60],
    size: 6,
    color: '#fb923c',
    info: 'A gas giant so close to the sun that its friction-heated atmosphere glows like a small star.',
    stats: { mass: '0.8 Jupiters', temperature: '2,200 K', atmosphere: 'Sodium Vapor' }
  },
  {
    id: 'p4',
    name: 'Siren',
    type: 'blackhole',
    visualType: 'normal',
    position: [120, 20, 90],
    size: 5,
    color: '#94a3b8',
    info: 'A deadly trap. It projects a holographic field to look like a rocky moon to lure miners.',
    stats: { mass: '15 Suns', temperature: '0 K', atmosphere: 'None' }
  },
  {
    id: 'p5',
    name: 'The Void',
    type: 'blackhole',
    visualType: 'blackhole',
    position: [150, -30, 130],
    size: 10,
    color: '#000000',
    info: 'An honest singularity. Its massive gravity is visible via the warped light around it.',
    stats: { mass: '200 Suns', temperature: '0.0001 K', atmosphere: 'None' }
  },
  {
    id: 'p6',
    name: 'Eclipse',
    type: 'star',
    visualType: 'blackhole',
    position: [180, 5, 170],
    size: 8,
    color: '#1e293b',
    info: 'A "Iron Star" that has burned out. It is so dark and dense it looks like a black hole.',
    stats: { mass: '1.5 Suns', temperature: '1,200 K', atmosphere: 'Degenerate Matter' }
  },
  {
    id: 'p7',
    name: 'Mirror',
    type: 'normal',
    visualType: 'blackhole',
    position: [220, -15, 200],
    size: 7,
    color: '#0f172a',
    info: 'A planet made of dark obsidian. It reflects no light, appearing as a hole in the starfield.',
    stats: { mass: '3 Earths', temperature: '150 K', atmosphere: 'Frozen CO2' }
  },
  {
    id: 'p8',
    name: 'Lantern',
    type: 'blackhole',
    visualType: 'star',
    position: [250, 40, 230],
    size: 12,
    color: '#f8fafc',
    info: 'The accretion disk is so bright and perfectly circular it mimics a white supergiant star.',
    stats: { mass: '50 Suns', temperature: '1M K', atmosphere: 'Plasma Disk' }
  },
  {
    id: 'p9',
    name: 'Aurelius',
    type: 'star',
    visualType: 'normal',
    position: [200, -20, 250],
    size: 5,
    color: '#d1d5db',
    info: 'A tiny Neutron star. It is so small and dim it looks like a grey wandering planet.',
    stats: { mass: '1.4 Suns', temperature: '500,000 K', atmosphere: 'Neutrons' }
  },
  {
    id: 'p10',
    name: 'Veridia',
    type: 'normal',
    visualType: 'normal',
    position: [150, 10, 210],
    size: 3.5,
    color: '#22c55e',
    info: 'A lush jungle world. The first major outpost on the mid-sector trade route.',
    stats: { mass: '0.9 Earths', temperature: '295 K', atmosphere: 'Oxygen/Nitrogen' }
  },
  {
    id: 'p11',
    name: 'Neon-X',
    type: 'normal',
    visualType: 'star',
    position: [110, -40, 180],
    size: 9,
    color: '#ec4899',
    info: 'Atmospheric gases are constantly ignited by radiation, making it glow bright pink.',
    stats: { mass: '2 Jupiters', temperature: '800 K', atmosphere: 'Neon/Hydrogen' }
  },
  {
    id: 'p12',
    name: 'Grave',
    type: 'blackhole',
    visualType: 'normal',
    position: [70, 30, 150],
    size: 4,
    color: '#475569',
    info: 'A micro-black hole that has pulled in enough space dust to form a fake rocky "crust".',
    stats: { mass: '5 Suns', temperature: '2 K', atmosphere: 'Dust Veil' }
  },
  {
    id: 'p13',
    name: 'Wraith',
    type: 'blackhole',
    visualType: 'blackhole',
    position: [30, -10, 120],
    size: 8,
    color: '#000000',
    info: 'A spinning singularity. Travel is dangerous here due to extreme time dilation.',
    stats: { mass: '80 Suns', temperature: '0 K', atmosphere: 'None' }
  },
  {
    id: 'p14',
    name: 'Coldfire',
    type: 'star',
    visualType: 'blackhole',
    position: [-20, 50, 90],
    size: 6,
    color: '#312e81',
    info: 'A star that emits light in a spectrum invisible to the human eye, looking like a dark void.',
    stats: { mass: '0.5 Suns', temperature: '2,800 K', atmosphere: 'Ultraviolet Plasma' }
  },
  {
    id: 'p15',
    name: 'Obscura',
    type: 'normal',
    visualType: 'blackhole',
    position: [-60, -20, 60],
    size: 4,
    color: '#020617',
    info: 'A gas giant with a "Vantablack" atmosphere that absorbs 99.9% of light.',
    stats: { mass: '1.2 Jupiters', temperature: '200 K', atmosphere: 'Methane/Soot' }
  },
  {
    id: 'p16',
    name: 'Nova',
    type: 'blackhole',
    visualType: 'star',
    position: [-100, 15, 30],
    size: 14,
    color: '#6366f1',
    info: 'It feeds on a nearby nebula, creating a brilliant blue glow that looks like a giant star.',
    stats: { mass: '120 Suns', temperature: '2M K', atmosphere: 'Ionized Gas' }
  },
  {
    id: 'p17',
    name: 'Titan',
    type: 'star',
    visualType: 'normal',
    position: [-140, -30, 0],
    size: 11,
    color: '#9ca3af',
    info: 'A massive star nearing death. It has expanded and cooled so much it looks like a giant red planet.',
    stats: { mass: '15 Suns', temperature: '3,100 K', atmosphere: 'Helium' }
  },
  {
    id: 'p18',
    name: 'Haven',
    type: 'normal',
    visualType: 'normal',
    position: [-180, 40, -30],
    size: 3,
    color: '#fef08a',
    info: 'A desert planet with golden sands. Safe, warm, and easy to land on.',
    stats: { mass: '0.8 Earths', temperature: '310 K', atmosphere: 'Nitrogen' }
  },
  {
    id: 'p19',
    name: 'Flare',
    type: 'normal',
    visualType: 'star',
    position: [-220, -10, -60],
    size: 6,
    color: '#ef4444',
    info: 'Volcanic activity is so constant that the surface glows like a burning sun.',
    stats: { mass: '2 Earths', temperature: '1,200 K', atmosphere: 'Sulfur' }
  },
  {
    id: 'p20',
    name: 'Stalker',
    type: 'blackhole',
    visualType: 'normal',
    position: [-250, 0, -100],
    size: 4.5,
    color: '#1f2937',
    info: 'An invisible mass hidden behind a decoy planet shell. Very high gravity warning.',
    stats: { mass: '12 Suns', temperature: '0 K', atmosphere: 'None' }
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
