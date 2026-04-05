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
    id: 'p2',
    name: 'Elysium',
    type: 'normal',
    visualType: 'normal',
    position: [240, -20, 210],
    size: 3,
    color: '#10b981',
    info: 'A lush terrestrial paradise with sprawling jungles and vast, oxygen-rich oceans.',
    stats: { mass: '0.9 Earths', temperature: '290 K', atmosphere: 'Nitrogen/Oxygen' }
  },
  {
    id: 'p3',
    name: 'The Maw',
    type: 'blackhole',
    visualType: 'blackhole',
    position: [-230, -50, -180],
    size: 8,
    color: '#000000',
    info: 'A supermassive singularity warping the very fabric of space-time around it.',
    stats: { mass: '500 Suns', temperature: '0.000001 K', atmosphere: 'None' }
  },
  {
    id: 'p4',
    name: 'Phosphor',
    type: 'normal',
    visualType: 'star',
    position: [110, 110, -240],
    size: 6,
    color: '#f472b6',
    info: 'A gas giant so chemically reactive its upper atmosphere glows with the intensity of a sun.',
    stats: { mass: '2 Jupiters', temperature: '1,200 K', atmosphere: 'Metallic Hydrogen' }
  },
  {
    id: 'p5',
    name: 'Ironheart',
    type: 'star',
    visualType: 'normal',
    position: [-160, 40, 220],
    size: 4,
    color: '#94a3b8',
    info: 'A "Cold Star" or Iron Star; though it looks like a dead moon, its core fusion is incredibly dense.',
    stats: { mass: '80 Jupiters', temperature: '2,500 K', atmosphere: 'Vaporized Iron' }
  },
  {
    id: 'p6',
    name: 'Vortex',
    type: 'blackhole',
    visualType: 'star',
    position: [200, -10, 50],
    size: 10,
    color: '#ffffff',
    info: 'A dangerous trap. It emits a brilliant white light like a main-sequence star to lure in matter.',
    stats: { mass: '50 Suns', temperature: '10M K (Accretion)', atmosphere: 'None' }
  },
  {
    id: 'p7',
    name: 'Mirage',
    type: 'blackhole',
    visualType: 'normal',
    position: [-210, 80, 110],
    size: 5,
    color: '#3b82f6',
    info: 'A gravitational trap! What appeared to be a serene blue planet was actually a disguised black hole.',
    stats: { mass: '20 Suns', temperature: '0 K', atmosphere: 'None' }
  },
  {
    id: 'p8',
    name: 'Cinder',
    type: 'normal',
    visualType: 'normal',
    position: [40, 90, -150],
    size: 2,
    color: '#ef4444',
    info: 'A tidally locked rock planet where one side is eternally melting under the gaze of its parent star.',
    stats: { mass: '0.4 Earths', temperature: '1,500 K', atmosphere: 'Thin Sodium' }
  },
  {
    id: 'p9',
    name: 'Nova-9',
    type: 'star',
    visualType: 'star',
    position: [-245, -150, -40],
    size: 20,
    color: '#6366f1',
    info: 'A massive Blue Giant on the verge of a supernova event.',
    stats: { mass: '40 Suns', temperature: '30,000 K', atmosphere: 'Ionized Helium' }
  },
  {
    id: 'p10',
    name: 'Obsidian',
    type: 'blackhole',
    visualType: 'blackhole',
    position: [70, -120, -110],
    size: 4,
    color: '#1e1b4b',
    info: 'A "Naked Singularity" with no visible accretion disk, nearly invisible against the void.',
    stats: { mass: '10 Suns', temperature: '0 K', atmosphere: 'None' }
  },
  {
    id: 'p11',
    name: 'Glacia',
    type: 'normal',
    visualType: 'normal',
    position: [180, 40, -190],
    size: 3.5,
    color: '#bae6fd',
    info: 'A frozen world covered in kilometers of nitrogen ice and methane lakes.',
    stats: { mass: '1.5 Earths', temperature: '40 K', atmosphere: 'Methane/Nitrogen' }
  },
  {
    id: 'p12',
    name: 'Lumen',
    type: 'star',
    visualType: 'blackhole',
    position: [-30, -30, 240],
    size: 7,
    color: '#4ade80',
    info: 'A strange green star shrouded in a thick shell of dark dust, mimicking a black hole signature.',
    stats: { mass: '0.8 Suns', temperature: '4,000 K', atmosphere: 'Chlorophyll-rich dust' }
  },
  {
    id: 'p13',
    name: 'Aether',
    type: 'normal',
    visualType: 'normal',
    position: [140, -60, 120],
    size: 5.5,
    color: '#a78bfa',
    info: 'A gas giant known for its violet lightning storms and floating crystal islands.',
    stats: { mass: '0.5 Jupiters', temperature: '150 K', atmosphere: 'Ammonia/Noble Gases' }
  },
  {
    id: 'p14',
    name: 'Pyre',
    type: 'star',
    visualType: 'star',
    position: [-130, 20, -220],
    size: 12,
    color: '#f97316',
    info: 'An Orange K-type star, remarkably stable and surrounded by a vast asteroid belt.',
    stats: { mass: '0.7 Suns', temperature: '4,500 K', atmosphere: 'Hydrogen' }
  },
  {
    id: 'p15',
    name: 'Null',
    type: 'blackhole',
    visualType: 'normal',
    position: [250, 200, 250],
    size: 2,
    color: '#27272a',
    info: 'A small, "rogue" black hole drifting through deep space, disguised as a dark asteroid.',
    stats: { mass: '5 Suns', temperature: '0 K', atmosphere: 'None' }
  },
  {
    id: 'p16',
    name: 'Chronos',
    type: 'normal',
    visualType: 'blackhole',
    position: [-80, 180, -90],
    size: 9,
    color: '#0f172a',
    info: 'A planet made of dark matter remnants; it absorbs light so perfectly it looks like a hole in space.',
    stats: { mass: '12 Jupiters', temperature: '10 K', atmosphere: 'Exotic Matter' }
  },
  {
    id: 'p17',
    name: 'Solara',
    type: 'star',
    visualType: 'star',
    position: [210, -110, -20],
    size: 14,
    color: '#ffffff',
    info: 'A blindingly bright A-type star, visible from across the entire galaxy.',
    stats: { mass: '2.5 Suns', temperature: '9,000 K', atmosphere: 'Hydrogen/Oxygen' }
  },
  {
    id: 'p18',
    name: 'Oasis',
    type: 'normal',
    visualType: 'normal',
    position: [-110, -80, 10],
    size: 4,
    color: '#22d3ee',
    info: 'An ocean world with no landmasses, home to massive bioluminescent aquatic life.',
    stats: { mass: '1.1 Earths', temperature: '285 K', atmosphere: 'Oxygen/Water Vapor' }
  },
  {
    id: 'p19',
    name: 'Goliath',
    type: 'normal',
    visualType: 'star',
    position: [50, 150, 190],
    size: 11,
    color: '#fdba74',
    info: 'A super-Jupiter that is almost large enough to ignite fusion, giving off a dim orange glow.',
    stats: { mass: '13 Jupiters', temperature: '900 K', atmosphere: 'Metallic Hydrogen' }
  },
  {
    id: 'p20',
    name: 'Abyss',
    type: 'blackhole',
    visualType: 'blackhole',
    position: [-220, 0, -250],
    size: 6,
    color: '#000000',
    info: 'The final frontier. A spinning Kerr black hole that allows for theoretical time dilation.',
    stats: { mass: '100 Suns', temperature: '0.00001 K', atmosphere: 'Event Horizon' }
  },
  {
    id: 'p21',
    name: 'Zenith',
    type: 'star',
    visualType: 'star',
    position: [-190, 30, 150],
    size: 13,
    color: '#e2e8f0',
    info: 'A dense White Dwarf, the remnants of a sun that has shed its outer layers.',
    stats: { mass: '1.1 Suns', temperature: '25,000 K', atmosphere: 'Thin Hydrogen' }
  },
  {
    id: 'p22',
    name: 'Verdant',
    type: 'normal',
    visualType: 'normal',
    position: [120, -140, 230],
    size: 4.2,
    color: '#65a30d',
    info: 'A biological marvel where the flora has developed the ability to walk and hunt.',
    stats: { mass: '1.2 Earths', temperature: '295 K', atmosphere: 'Oxygen/Nitrogen/CO2' }
  },
  {
    id: 'p23',
    name: 'Echo',
    type: 'blackhole',
    visualType: 'blackhole',
    position: [-10, 210, -210],
    size: 7,
    color: '#000000',
    info: 'Known for its gravitational lensing that reflects light from the other side of the galaxy.',
    stats: { mass: '15 Suns', temperature: '0.00005 K', atmosphere: 'None' }
  },
  {
    id: 'p24',
    name: 'Phantom',
    type: 'normal',
    visualType: 'blackhole',
    position: [245, 45, -130],
    size: 8.5,
    color: '#020617',
    info: 'A gas giant rich in carbon soot so thick it reflects zero light, appearing as a hole in space.',
    stats: { mass: '4 Jupiters', temperature: '450 K', atmosphere: 'Methane/Carbon Dust' }
  },
  {
    id: 'p25',
    name: 'Helios Prime',
    type: 'star',
    visualType: 'star',
    position: [-250, -50, 60],
    size: 25,
    color: '#dc2626',
    info: 'A massive Red Supergiant. If placed in our solar system, it would reach past Jupiter.',
    stats: { mass: '18 Suns', temperature: '3,500 K', atmosphere: 'Convective Plasma' }
  },
  {
    id: 'p26',
    name: 'Spark',
    type: 'normal',
    visualType: 'star',
    position: [80, 190, 80],
    size: 5,
    color: '#7dd3fc',
    info: 'An "Electric World" where constant hyper-velocity lightning makes it glow like a star.',
    stats: { mass: '2.5 Earths', temperature: '600 K', atmosphere: 'Ionized Argon' }
  },
  {
    id: 'p27',
    name: 'Voidwalker',
    type: 'blackhole',
    visualType: 'normal',
    position: [-60, -160, 180],
    size: 3,
    color: '#475569',
    info: 'Looks like a desolate grey moon, but its "surface" is an event horizon covered in space dust.',
    stats: { mass: '12 Suns', temperature: '0 K', atmosphere: 'None' }
  },
  {
    id: 'p28',
    name: 'Rust',
    type: 'normal',
    visualType: 'normal',
    position: [190, -20, 160],
    size: 2.8,
    color: '#b45309',
    info: 'A desert planet where it rains liquid iron during the high-temperature summers.',
    stats: { mass: '0.7 Earths', temperature: '800 K', atmosphere: 'Metallic Vapor' }
  },
  {
    id: 'p29',
    name: 'Pulsar-X',
    type: 'star',
    visualType: 'blackhole',
    position: [10, 10, -250],
    size: 6,
    color: '#334155',
    info: 'A neutron star spinning so fast its light is redshifted into invisibility, mimicking a black hole.',
    stats: { mass: '2 Suns', temperature: '1M K', atmosphere: 'Neutron Degeneracy' }
  },
  {
    id: 'p30',
    name: 'Glint',
    type: 'star',
    visualType: 'normal',
    position: [-150, 230, -120],
    size: 4.5,
    color: '#cbd5e1',
    info: 'A crystallized Carbon Star; essentially a sun-sized diamond that emits a soft, cold light.',
    stats: { mass: '0.9 Suns', temperature: '3,200 K', atmosphere: 'Crystal Lattice' }
  },
  {
    id: 'p31',
    name: 'Kraken',
    type: 'normal',
    visualType: 'normal',
    position: [230, -100, -80],
    size: 6.8,
    color: '#1e3a8a',
    info: 'A high-gravity water world with oceans thousands of kilometers deep.',
    stats: { mass: '5 Earths', temperature: '275 K', atmosphere: 'High-Pressure Oxygen' }
  },
  {
    id: 'p32',
    name: 'Titanis',
    type: 'star',
    visualType: 'star',
    position: [20, -250, 240],
    size: 30,
    color: '#38bdf8',
    info: 'A Blue Hypergiant, burning fuel so fast its lifespan is only a few million years.',
    stats: { mass: '60 Suns', temperature: '35,000 K', atmosphere: 'Helium/Hydrogen' }
  },
  {
    id: 'p33',
    name: 'Eventide',
    type: 'x-planet',
    visualType: 'blackhole',
    position: [-240, 180, -20],
    size: 11,
    color: '#000000',
    info: 'A dormant Quasar. It is currently quiet, but would incinerate the sector if it began feeding.',
    stats: { mass: '1,000 Suns', temperature: '0.0000001 K', atmosphere: 'None' }
  },
  {
    id: 'p34',
    name: 'Mirage II',
    type: 'blackhole',
    visualType: 'star',
    position: [160, 140, 30],
    size: 9,
    color: '#fde047',
    info: 'A singularity whose intense accretion disk is perfectly spheresized, mimicking a yellow sun.',
    stats: { mass: '45 Suns', temperature: '5M K (Disk)', atmosphere: 'None' }
  },
  {
    id: 'p35',
    name: 'Carbona',
    type: 'normal',
    visualType: 'normal',
    position: [-90, -220, -160],
    size: 3.2,
    color: '#111827',
    info: 'A planet made primarily of graphite and diamond. The sky is black even during the day.',
    stats: { mass: '2 Earths', temperature: '420 K', atmosphere: 'Carbon Monoxide' }
  },
  {
    id: 'p36',
    name: 'Neon',
    type: 'normal',
    visualType: 'star',
    position: [250, 40, 140],
    size: 12,
    color: '#f43f5e',
    info: 'A gas giant whose atmosphere is excited by a nearby pulsar, making it glow bright crimson.',
    stats: { mass: '0.8 Jupiters', temperature: '200 K', atmosphere: 'Neon/Helium' }
  },
  {
    id: 'p37',
    name: 'Shadow',
    type: 'blackhole',
    visualType: 'normal',
    position: [-40, 60, 250],
    size: 10,
    color: '#312e81',
    info: 'A massive black hole that has captured enough gas to look like a dark purple gas giant.',
    stats: { mass: '120 Suns', temperature: '5 K', atmosphere: 'Stolen Gas Veil' }
  },
  {
    id: 'p38',
    name: 'Flare',
    type: 'star',
    visualType: 'star',
    position: [150, -230, -140],
    size: 8,
    color: '#fb923c',
    info: 'A volatile Red Dwarf that emits massive solar flares every few hours.',
    stats: { mass: '0.3 Suns', temperature: '3,800 K', atmosphere: 'Hydrogen Plasma' }
  },
  {
    id: 'p39',
    name: 'Aurora',
    type: 'normal',
    visualType: 'normal',
    position: [-180, -40, -110],
    size: 5.5,
    color: '#c084fc',
    info: 'The magnetic field is so strong that the entire planet is covered in permanent, shimmering auroras.',
    stats: { mass: '1.8 Earths', temperature: '260 K', atmosphere: 'Nitrogen/Argon' }
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
