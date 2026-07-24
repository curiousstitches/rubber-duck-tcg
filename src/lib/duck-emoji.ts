export function getDuckEmoji(duckType: string): string {
  const emojis: Record<string, string> = {
    mallard: '🦆', pintail: '🦆', teal: '🦆', canvasback: '🦆', bufflehead: '🦆',
    woodduck: '🦆', mandarin: '🦆', eagle: '🦅', rubber: '🛁', glow: '🌟',
    storm: '⛈️', ice: '🧊', fire: '🔥', earth: '🌍', wind: '💨',
    rain: '🌧️', shadow: '🌑', light: '☀️', crystal: '💎', metal: '⚙️',
    ghost: '👻', dragon: '🐉', phantom: '👻', neon: '⚡', bio: '🧬',
    cyber: '🖥️', quantum: '🌀', nebula: '🌌', stellar: '⭐', omega: '🌀',
    alpha: '🔱', chaos: '🎲', order: '📐', prism: '🌈', echo: '🔊',
    flare: '🌋', tide: '🌊', breeze: '💨', thorn: '🌵', frost: '❄️',
    quake: '🌋', vortex: '🌀', nova: '💥', eclipse: '🌒', aurora: '🌈',
    comet: '☄️', meteor: '☄️', shock: '⚡', static: '⚡', current: '⚡',
    plasma: '⚡', fusion: '☀️', antimatter: '💥', singularity: '🌀', entropy: '🌀',
    void: '🕳️', infinity: '∞', zen: '🧘', seed: '🌱', spore: '🍄',
    hive: '🐝', colony: '🐜', soul: '👻', dream: '🌙', nightmare: '😱',
    waking: '☀️', gravity: '🌍', magnet: '🧲', radiation: '☢️', isotope: '⚛️',
    elemental: '🔥', prime: '🔢', fibonacci: '🔢', fractal: '🔁'
  }
  return emojis[duckType] || '🦆'
}
