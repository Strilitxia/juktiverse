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
    name: 'Aethelgard',
    type: 'normal',
    position: [0, 0, -50],
    size: 5,
    color: '#ff8c00',
    info: 'A rocky world with vast orange deserts and deep canyons.',
    stats: { mass: '0.8 Earths', temperature: '45°C', atmosphere: 'Thin CO2' }
  },
  {
    id: 'p2',
    name: 'Sirius Prime',
    type: 'star',
    position: [100, 20, -150],
    size: 15,
    color: '#ffffff',
    info: 'A blindingly bright white dwarf star. Its intense radiation makes close approach dangerous.',
    stats: { mass: '1.2 Suns', temperature: '10,000 K', atmosphere: 'Hydrogen/Helium' }
  },
  {
    id: 'p3',
    name: 'Veridia',
    type: 'normal',
    position: [-80, -30, -100],
    size: 6,
    color: '#22c55e',
    info: 'Lush and overgrown, this planet is teeming with strange, bioluminescent flora.',
    stats: { mass: '1.1 Earths', temperature: '22°C', atmosphere: 'Nitrogen/Oxygen' }
  },
  {
    id: 'p4',
    name: 'Obsidian Abyss',
    type: 'blackhole',
    position: [50, 50, -250],
    size: 8,
    color: '#111111', // Looks like a dark planet initially
    info: 'Not a planet at all, but a dormant black hole. Time distorts heavily near its event horizon.',
    stats: { mass: '10 Suns', temperature: '0 K', atmosphere: 'None' }
  },
  {
    id: 'p5',
    name: 'X-Planet',
    type: 'x-planet',
    position: [-150, 40, -300],
    size: 7,
    color: '#a855f7',
    info: 'The legendary X-Planet. You have found the source of the ancient signal!',
    stats: { mass: 'Unknown', temperature: 'Unknown', atmosphere: 'Unknown' }
  },
  {
    id: 'p6',
    name: 'Crimson Tide',
    type: 'normal',
    position: [120, -60, -80],
    size: 4,
    color: '#ef4444',
    info: 'Covered entirely by a deep red ocean. Massive tidal waves constantly sweep its surface.',
    stats: { mass: '0.9 Earths', temperature: '15°C', atmosphere: 'Dense Nitrogen' }
  },
  {
    id: 'p7',
    name: 'Mirage',
    type: 'blackhole',
    visualType: 'normal',
    position: [-100, 80, 50],
    size: 5,
    color: '#3b82f6',
    info: 'A gravitational trap! What appeared to be a serene blue planet was actually a disguised black hole.',
    stats: { mass: '20 Suns', temperature: '0 K', atmosphere: 'None' }
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
      partialize: (state) => ({
        planets: state.planets,
        visitedPlanets: state.visitedPlanets,
        playerPosition: state.playerPosition,
        exploredRadius: state.exploredRadius,
        debris: state.debris,
      }),
    }
  )
);
