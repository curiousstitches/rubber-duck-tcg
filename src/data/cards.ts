import type { CardData, CardVariant, Rarity, DuckType } from '@/types/game'

export const RARITY_COLORS: Record<Rarity, string> = {
  common: 'bg-green-500/20 border-green-500',
  rare: 'bg-blue-500/20 border-blue-500',
  epic: 'bg-purple-500/20 border-purple-500',
  legendary: 'bg-yellow-500/20 border-yellow-500',
  mythic: 'bg-pink-500/20 border-pink-500'
}

export const RARITY_WEIGHTS: Record<Rarity, number> = {
  common: 60,
  rare: 25,
  epic: 10,
  legendary: 4,
  mythic: 1
}

export const DUCK_TYPES: DuckType[] = [
  { id: 'mallard', name: 'Mallard', description: 'The classic duck with versatile swimming skills', baseImage: '/cards/ducks/mallard_normal.png', evolutionImages: ['/cards/ducks/mallard_evolved.png'], habitat: 'Ponds and lakes', ability: 'Swift Swim' },
  { id: 'pintail', name: 'Pintail', description: 'Graceful with a distinctive tail feather', baseImage: '/cards/ducks/pintail_normal.png', evolutionImages: ['/cards/ducks/pintail_evolved.png'], habitat: 'Open waters', ability: 'Long Stride' },
  { id: 'teal', name: 'Teal', description: 'Small but mighty, quick to react', baseImage: '/cards/ducks/teal_normal.png', evolutionImages: ['/cards/ducks/teal_evolved.png'], habitat: 'marshes', ability: 'Quick Reflexes' },
  { id: 'canvasback', name: 'Canvasback', description: 'Sturdy diver with deep diving capability', baseImage: '/cards/ducks/canvasback_normal.png', evolutionImages: ['/cards/ducks/canvasback_evolved.png'], habitat: 'Deeper lakes', ability: 'Deep Dive' },
  { id: 'bufflehead', name: 'Bufflehead', description: 'Compact diver, excellent underwater speed', baseImage: '/cards/ducks/bufflehead_normal.png', evolutionImages: ['/cards/ducks/bufflehead_evolved.png'], habitat: 'Clear lakes', ability: 'Bubble Boost' },
  { id: 'woodduck', name: 'Wood Duck', description: 'Colorful and camouflaged', baseImage: '/cards/ducks/woodduck_normal.png', evolutionImages: ['/cards/ducks/woodduck_evolved.png'], habitat: 'Wooded swamps', ability: 'Camouflage' },
  { id: 'mandarin', name: 'Mandarin', description: 'Ornate with dazzling colors', baseImage: '/cards/ducks/mandarin_normal.png', evolutionImages: ['/cards/ducks/mandarin_evolved.png'], habitat: 'Urban parks', ability: 'Dazzle' },
  { id: 'eagle', name: 'Eagle Duck', description: 'Powerful flyer with sharp vision', baseImage: '/cards/ducks/eagle_normal.png', evolutionImages: ['/cards/ducks/eagle_evolved.png'], habitat: 'Mountain lakes', ability: 'Eagle Eye' },
  { id: 'rubber', name: 'Rubber Duck', description: 'The original TCG hero, bouncy resilience', baseImage: '/cards/ducks/rubber_normal.png', evolutionImages: ['/cards/ducks/rubber_evolved.png'], habitat: 'Bathtubs', ability: 'Bounce Back' },
  { id: 'glow', name: 'Glow Duck', description: 'Luminescent with night vision', baseImage: '/cards/ducks/glow_normal.png', evolutionImages: ['/cards/ducks/glow_evolved.png'], habitat: 'Caves', ability: 'Night Vision' },
  { id: 'storm', name: 'Storm Duck', description: 'Commands the weather with thunder', baseImage: '/cards/ducks/storm_normal.png', evolutionImages: ['/cards/ducks/storm_evolved.png'], habitat: 'Coastal areas', ability: 'Lightning Charge' },
  { id: 'ice', name: 'Ice Duck', description: 'Frozen in beauty and power', baseImage: '/cards/ducks/ice_normal.png', evolutionImages: ['/cards/ducks/ice_evolved.png'], habitat: 'Arctic ponds', ability: 'Frostbite' },
  { id: 'fire', name: 'Fire Duck', description: 'Burns bright with fiery passion', baseImage: '/cards/ducks/fire_normal.png', evolutionImages: ['/cards/ducks/fire_evolved.png'], habitat: 'Volcanic hot springs', ability: 'Inferno' },
  { id: 'earth', name: 'Earth Duck', description: 'Rooted in strength and stability', baseImage: '/cards/ducks/earth_normal.png', evolutionImages: ['/cards/ducks/earth_evolved.png'], habitat: 'Forests', ability: 'Stone Wall' },
  { id: 'wind', name: 'Wind Duck', description: 'Soars with the currents', baseImage: '/cards/ducks/wind_normal.png', evolutionImages: ['/cards/ducks/wind_evolved.png'], habitat: 'High altitudes', ability: 'Gale Force' },
  { id: 'rain', name: 'Rain Duck', description: 'Summons gentle rains', baseImage: '/cards/ducks/rain_normal.png', evolutionImages: ['/cards/ducks/rain_evolved.png'], habitat: 'Tropical islands', ability: 'Healing Rain' },
  { id: 'shadow', name: 'Shadow Duck', description: 'Moves unseen through darkness', baseImage: '/cards/ducks/shadow_normal.png', evolutionImages: ['/cards/ducks/shadow_evolved.png'], habitat: 'Caves at night', ability: 'Darkness Veil' },
  { id: 'light', name: 'Light Duck', description: 'Radiates pure illumination', baseImage: '/cards/ducks/light_normal.png', evolutionImages: ['/cards/ducks/light_evolved.png'], habitat: 'Sunny meadows', ability: 'Radiance' },
  { id: 'crystal', name: 'Crystal Duck', description: 'Hard as gem with refracted light', baseImage: '/cards/ducks/crystal_normal.png', evolutionImages: ['/cards/ducks/crystal_evolved.png'], habitat: 'Crystal caves', ability: 'Prismatic Shield' },
  { id: 'metal', name: 'Metal Duck', description: 'Armored with metallic strength', baseImage: '/cards/ducks/metal_normal.png', evolutionImages: ['/cards/ducks/metal_evolved.png'], habitat: 'Industrial areas', ability: 'Magnetic Pull' },
  { id: 'ghost', name: 'Ghost Duck', description: 'Ethereal and intangible', baseImage: '/cards/ducks/ghost_normal.png', evolutionImages: ['/cards/ducks/ghost_evolved.png'], habitat: 'Haunted swamps', ability: 'Phasing' },
  { id: 'dragon', name: 'Dragon Duck', description: 'Ancient power with draconic heritage', baseImage: '/cards/ducks/dragon_normal.png', evolutionImages: ['/cards/ducks/dragon_evolved.png'], habitat: 'Dragon peaks', ability: 'Dragon Breath' },
  { id: 'phantom', name: 'Phantom Duck', description: 'Spectral form from another realm', baseImage: '/cards/ducks/phantom_normal.png', evolutionImages: ['/cards/ducks/phantom_evolved.png'], habitat: 'Ethereal planes', ability: 'Phase Shift' },
  { id: 'neon', name: 'Neon Duck', description: 'Glows with electric energy', baseImage: '/cards/ducks/neon_normal.png', evolutionImages: ['/cards/ducks/neon_evolved.png'], habitat: 'Cyber cities', ability: 'Electric Shock' },
  { id: 'bio', name: 'Bio Duck', description: 'Evolved with genetic enhancements', baseImage: '/cards/ducks/bio_normal.png', evolutionImages: ['/cards/ducks/bio_evolved.png'], habitat: 'Research labs', ability: 'Adaptive Evolution' },
  { id: 'cyber', name: 'Cyber Duck', description: 'Digital consciousness in organic form', baseImage: '/cards/ducks/cyber_normal.png', evolutionImages: ['/cards/ducks/cyber_evolved.png'], habitat: 'Virtual realms', ability: 'Data Stream' },
  { id: 'quantum', name: 'Quantum Duck', description: 'Exists in multiple states simultaneously', baseImage: '/cards/ducks/quantum_normal.png', evolutionImages: ['/cards/ducks/quantum_evolved.png'], habitat: 'Quantum field', ability: 'Superposition' },
  { id: 'nebula', name: 'Nebula Duck', description: 'Cosmic being from star-forming clouds', baseImage: '/cards/ducks/nebula_normal.png', evolutionImages: ['/cards/ducks/nebula_evolved.png'], habitat: 'Deep space', ability: 'Cosmic Dust' },
  { id: 'stellar', name: 'Stellar Duck', description: 'Born from the stars themselves', baseImage: '/cards/ducks/stellar_normal.png', evolutionImages: ['/cards/ducks/stellar_evolved.png'], habitat: 'Space station', ability: 'Star Power' },
  { id: 'omega', name: 'Omega Duck', description: 'The end of all evolution', baseImage: '/cards/ducks/omega_normal.png', evolutionImages: ['/cards/ducks/omega_evolved.png'], habitat: 'Void', ability: 'Omega Decay' },
  { id: 'alpha', name: 'Alpha Duck', description: 'The beginning of all ducks', baseImage: '/cards/ducks/alpha_normal.png', evolutionImages: ['/cards/ducks/alpha_evolved.png'], habitat: 'Primordial pond', ability: 'Genesis' },
  { id: 'chaos', name: 'Chaos Duck', description: 'Embodiment of unpredictable forces', baseImage: '/cards/ducks/chaos_normal.png', evolutionImages: ['/cards/ducks/chaos_evolved.png'], habitat: 'Random dimension', ability: 'Chaos Bolt' },
  { id: 'order', name: 'Order Duck', description: 'Master of perfect patterns', baseImage: '/cards/ducks/order_normal.png', evolutionImages: ['/cards/ducks/order_evolved.png'], habitat: 'Structured realm', ability: 'Perfect Form' },
  { id: 'prism', name: 'Prism Duck', description: 'Splits light into infinite possibilities', baseImage: '/cards/ducks/prism_normal.png', evolutionImages: ['/cards/ducks/prism_evolved.png'], habitat: 'Crystal palace', ability: 'Spectrum Shift' },
  { id: 'echo', name: 'Echo Duck', description: 'Repeated sound waves amplify power', baseImage: '/cards/ducks/echo_normal.png', evolutionImages: ['/cards/ducks/echo_evolved.png'], habitat: 'Canyons', ability: 'Resonance' },
  { id: 'flare', name: 'Flare Duck', description: 'Explosive bursts of energy', baseImage: '/cards/ducks/flare_normal.png', evolutionImages: ['/cards/ducks/flare_evolved.png'], habitat: 'Asteroid fields', ability: 'Solar Flare' },
  { id: 'tide', name: 'Tide Duck', description: 'Controls ocean currents', baseImage: '/cards/ducks/tide_normal.png', evolutionImages: ['/cards/ducks/tide_evolved.png'], habitat: 'Deep ocean', ability: 'Tsunami Wave' },
  { id: 'breeze', name: 'Breeze Duck', description: 'Gentle winds carry it anywhere', baseImage: '/cards/ducks/breeze_normal.png', evolutionImages: ['/cards/ducks/breeze_evolved.png'], habitat: 'Open skies', ability: 'Whirlwind' },
  { id: 'thorn', name: 'Thorn Duck', description: 'Defensive spines protect it', baseImage: '/cards/ducks/thorn_normal.png', evolutionImages: ['/cards/ducks/thorn_evolved.png'], habitat: 'Thickets', ability: 'Barbed Armor' },
  { id: 'frost', name: 'Frost Duck', description: 'Freezes everything in its path', baseImage: '/cards/ducks/frost_normal.png', evolutionImages: ['/cards/ducks/frost_evolved.png'], habitat: 'Ice caves', ability: 'Blizzard' },
  { id: 'quake', name: 'Quake Duck', description: 'Shakes the ground with each step', baseImage: '/cards/ducks/quake_normal.png', evolutionImages: ['/cards/ducks/quake_evolved.png'], habitat: 'Fault lines', ability: 'Seismic Shockwave' },
  { id: 'vortex', name: 'Vortex Duck', description: 'Creates powerful whirlpools', baseImage: '/cards/ducks/vortex_normal.png', evolutionImages: ['/cards/ducks/vortex_evolved.png'], habitat: 'Deep lakes', ability: 'Cyclone' },
  { id: 'nova', name: 'Nova Duck', description: 'Explodes in brilliant light', baseImage: '/cards/ducks/nova_normal.png', evolutionImages: ['/cards/ducks/nova_evolved.png'], habitat: 'Nebulae', ability: 'Supernova Blast' },
  { id: 'eclipse', name: 'Eclipse Duck', description: 'Darkness devours the light', baseImage: '/cards/ducks/eclipse_normal.png', evolutionImages: ['/cards/ducks/eclipse_evolved.png'], habitat: 'Shadow realm', ability: 'Dark Eclipse' },
  { id: 'aurora', name: 'Aurora Duck', description: 'Dances with northern lights', baseImage: '/cards/ducks/aurora_normal.png', evolutionImages: ['/cards/ducks/aurora_evolved.png'], habitat: 'Polar regions', ability: 'Light Show' },
  { id: 'comet', name: 'Comet Duck', description: 'Streaks across the sky with trailing fire', baseImage: '/cards/ducks/comet_normal.png', evolutionImages: ['/cards/ducks/comet_evolved.png'], habitat: 'Outer space', ability: 'Meteor Shower' },
  { id: 'meteor', name: 'Meteor Duck', description: 'Falling star with planetary power', baseImage: '/cards/ducks/meteor_normal.png', evolutionImages: ['/cards/ducks/meteor_evolved.png'], habitat: 'Asteroid belt', ability: 'Impact Crater' },
  { id: 'shock', name: 'Shock Duck', description: 'Electricity crackles around it', baseImage: '/cards/ducks/shock_normal.png', evolutionImages: ['/cards/ducks/shock_evolved.png'], habitat: 'Thunderstorms', ability: 'Lightning Strike' },
  { id: 'static', name: 'Static Duck', description: 'Builds charge that can explode', baseImage: '/cards/ducks/static_normal.png', evolutionImages: ['/cards/ducks/static_evolved.png'], habitat: 'Storm clouds', ability: 'Static Discharge' },
  { id: 'current', name: 'Current Duck', description: 'Flows with powerful electric streams', baseImage: '/cards/ducks/current_normal.png', evolutionImages: ['/cards/ducks/current_evolved.png'], habitat: 'Power lines', ability: 'Power Surge' },
  { id: 'plasma', name: 'Plasma Duck', description: 'Fourth state of matter with glowing energy', baseImage: '/cards/ducks/plasma_normal.png', evolutionImages: ['/cards/ducks/plasma_evolved.png'], habitat: 'Fusion reactors', ability: 'Ion Blast' },
  { id: 'fusion', name: 'Fusion Duck', description: 'Merges particles to create energy', baseImage: '/cards/ducks/fusion_normal.png', evolutionImages: ['/cards/ducks/fusion_evolved.png'], habitat: 'Stars', ability: 'Nuclear Blast' },
  { id: 'antimatter', name: 'Antimatter Duck', description: 'Exists in opposite state of matter', baseImage: '/cards/ducks/antimatter_normal.png', evolutionImages: ['/cards/ducks/antimatter_evolved.png'], habitat: 'Particle accelerators', ability: 'Annihilation Wave' },
  { id: 'singularity', name: 'Singularity Duck', description: 'Point of infinite density', baseImage: '/cards/ducks/singularity_normal.png', evolutionImages: ['/cards/ducks/singularity_evolved.png'], habitat: 'Black holes', ability: 'Event Horizon' },
  { id: 'entropy', name: 'Entropy Duck', description: 'Dissipates energy into disorder', baseImage: '/cards/ducks/entropy_normal.png', evolutionImages: ['/cards/ducks/entropy_evolved.png'], habitat: 'Heat death', ability: 'Heat Death' },
  { id: 'void', name: 'Void Duck', description: 'Emptiness given form', baseImage: '/cards/ducks/void_normal.png', evolutionImages: ['/cards/ducks/void_evolved.png'], habitat: 'Empty space', ability: 'Nullify' },
  { id: 'infinity', name: 'Infinity Duck', description: 'Endless possibilities', baseImage: '/cards/ducks/infinity_normal.png', evolutionImages: ['/cards/ducks/infinity_evolved.png'], habitat: 'Multiverse', ability: 'Endless' },
  { id: 'zen', name: 'Zen Duck', description: 'Achieves perfect balance and harmony', baseImage: '/cards/ducks/zen_normal.png', evolutionImages: ['/cards/ducks/zen_evolved.png'], habitat: 'Meditation gardens', ability: 'Inner Peace' },
  { id: 'seed', name: 'Seed Duck', description: 'Grows into powerful plants', baseImage: '/cards/ducks/seed_normal.png', evolutionImages: ['/cards/ducks/seed_evolved.png'], habitat: 'Forests', ability: 'Photosynthesis' },
  { id: 'spore', name: 'Spore Duck', description: 'Releases magical spores', baseImage: '/cards/ducks/spore_normal.png', evolutionImages: ['/cards/ducks/spore_evolved.png'], habitat: 'Mushroom groves', ability: 'Spore Cloud' },
  { id: 'hive', name: 'Hive Duck', description: 'Works in perfect unison with others', baseImage: '/cards/ducks/hive_normal.png', evolutionImages: ['/cards/ducks/hive_evolved.png'], habitat: 'Beehives', ability: 'Swarm Mind' },
  { id: 'colony', name: 'Colony Duck', description: 'United as one massive organism', baseImage: '/cards/ducks/colony_normal.png', evolutionImages: ['/cards/ducks/colony_evolved.png'], habitat: 'Anthill', ability: 'Organic Unity' },
  { id: 'soul', name: 'Soul Duck', description: 'Exists in the spirit realm', baseImage: '/cards/ducks/soul_normal.png', evolutionImages: ['/cards/ducks/soul_evolved.png'], habitat: 'Spirit world', ability: 'Soul Drain' },
  { id: 'dream', name: 'Dream Duck', description: 'Lives in the realm of dreams', baseImage: '/cards/ducks/dream_normal.png', evolutionImages: ['/cards/ducks/dream_evolved.png'], habitat: 'Sleeping minds', ability: 'Illusion' },
  { id: 'nightmare', name: 'Nightmare Duck', description: 'Terror from the subconscious', baseImage: '/cards/ducks/nightmare_normal.png', evolutionImages: ['/cards/ducks/nightmare_evolved.png'], habitat: 'Dark dreams', ability: 'Fear Aura' },
  { id: 'waking', name: 'Waking Duck', description: 'Awakened from the dream state', baseImage: '/cards/ducks/waking_normal.png', evolutionImages: ['/cards/ducks/waking_evolved.png'], habitat: 'Reality', ability: 'Reality Anchor' },
  { id: 'gravity', name: 'Gravity Duck', description: 'Controls gravitational force', baseImage: '/cards/ducks/gravity_normal.png', evolutionImages: ['/cards/ducks/gravity_evolved.png'], habitat: 'Black hole', ability: 'Graviton Pull' },
  { id: 'magnet', name: 'Magnet Duck', description: 'Attracts and repels with magnetic force', baseImage: '/cards/ducks/magnet_normal.png', evolutionImages: ['/cards/ducks/magnet_evolved.png'], habitat: 'Magnetic north', ability: 'Polarity Switch' },
  { id: 'radiation', name: 'Radiation Duck', description: 'Bubbles with dangerous radiation', baseImage: '/cards/ducks/radiation_normal.png', evolutionImages: ['/cards/ducks/radiation_evolved.png'], habitat: 'Nuclear waste', ability: 'Radioactive Aura' },
  { id: 'isotope', name: 'Isotope Duck', description: 'Variant with altered atomic structure', baseImage: '/cards/ducks/isotope_normal.png', evolutionImages: ['/cards/ducks/isotope_evolved.png'], habitat: 'Laboratory', ability: 'Decay Chain' },
  { id: 'elemental', name: 'Elemental Duck', description: 'Master of the fundamental forces', baseImage: '/cards/ducks/elemental_normal.png', evolutionImages: ['/cards/ducks/elemental_evolved.png'], habitat: 'Core of earth', ability: 'Elemental Mastery' },
  { id: 'prime', name: 'Prime Duck', description: 'Divisible only by itself and one', baseImage: '/cards/ducks/prime_normal.png', evolutionImages: ['/cards/ducks/prime_evolved.png'], habitat: 'Mathematical realm', ability: 'Prime Power' },
  { id: 'fibonacci', name: 'Fibonacci Duck', description: 'Follows nature\'s sequence', baseImage: '/cards/ducks/fibonacci_normal.png', evolutionImages: ['/cards/ducks/fibonacci_evolved.png'], habitat: 'Golden ratio', ability: 'Golden Spiral' },
  { id: 'fractal', name: 'Fractal Duck', description: 'Self-similar patterns at every scale', baseImage: '/cards/ducks/fractal_normal.png', evolutionImages: ['/cards/ducks/fractal_evolved.png'], habitat: 'Infinite complexity', ability: 'Fractal Growth' }
]

export const CARD_DATA: Record<string, CardData> = {}

const RARITY_COUNTS: Record<Rarity, number> = {
  common: 60,
  rare: 20,
  epic: 10,
  legendary: 5,
  mythic: 2
}

const BASE_STATS = {
  common: { hp: 50, atk: 30, def: 25 },
  rare: { hp: 80, atk: 50, def: 40 },
  epic: { hp: 120, atk: 75, def: 60 },
  legendary: { hp: 180, atk: 100, def: 85 },
  mythic: { hp: 250, atk: 130, def: 110 }
}

Object.entries(RARITY_COUNTS).forEach(([rarity, count]) => {
  const rarityKey = rarity as Rarity
  const stats = BASE_STATS[rarityKey]
  for (let i = 0; i < count; i++) {
    const duck = DUCK_TYPES[i % DUCK_TYPES.length]
    const id = `card_${rarity}_${String(i + 1).padStart(3, '0')}`
    CARD_DATA[id] = {
      id,
      name: `${duck.name} ${rarityKey.charAt(0).toUpperCase() + rarityKey.slice(1)}`,
      duckType: duck.id,
      hp: stats.hp + (i * 2),
      attack: stats.atk + (i),
      defense: stats.def + (i * 2),
      description: duck.description,
      habitat: duck.habitat,
      ability: duck.ability,
      evolutionRequirements: { count: 3, rarity: rarityKey },
      variants: {
        normal: { image: duck.baseImage, holographic: false, sparkle: false, foil: false },
        shiny: { image: duck.baseImage.replace('.png', '_shiny.png'), holographic: true, sparkle: true, foil: true },
        glossy: { image: duck.baseImage.replace('.png', '_glossy.png'), holographic: true, sparkle: false, foil: true }
      },
      evolution: i < count - 1 ? `card_${rarity}_${String(i + 2).padStart(3, '0')}` : '',
      mutantRecipes: []
    }
  }
})

const mythicCard = CARD_DATA['card_mythic_002']
if (mythicCard) {
  mythicCard.name = 'Omega Duck Mythic'
  mythicCard.hp = 300
  mythicCard.attack = 150
  mythicCard.defense = 120
  mythicCard.description = 'The ultimate form of duck evolution'
  mythicCard.ability = 'Total Domination'
  mythicCard.variants.normal.image = '/cards/ducks/omega_evolved.png'
  mythicCard.variants.shiny.image = '/cards/ducks/omega_evolved_shiny.png'
  mythicCard.variants.glossy.image = '/cards/ducks/omega_evolved_glossy.png'
}

CARD_DATA['card_legendary_005'].mutantRecipes = ['card_common_001', 'card_rare_001', 'card_epic_001']