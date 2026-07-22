import type { Card, Rarity, CardVariant } from '@/types/game'
import { RARITY_WEIGHTS, CARD_DATA, DUCK_TYPES } from '@/data/cards'

const RARITIES: Rarity[] = ['common', 'rare', 'epic', 'legendary', 'mythic']

export function weightedRarity(): Rarity {
  const rand = Math.random() * 100
  let cumulative = 0
  for (const rarity of RARITIES) {
    cumulative += RARITY_WEIGHTS[rarity]
    if (rand <= cumulative) return rarity
  }
  return 'common'
}

export function getRandomVariant(): CardVariant {
  const rand = Math.random()
  if (rand < 0.05) return 'shiny'
  if (rand < 0.15) return 'glossy'
  return 'normal'
}

export function generateRandomCard(collectionCount: (cardId: string) => number): Card {
  const rarity = weightedRarity()
  const variant = getRandomVariant()
  const duck = DUCK_TYPES[Math.floor(Math.random() * DUCK_TYPES.length)]
  
  const matchingCards = Object.values(CARD_DATA).filter(c => c.duckType === duck.id)
  const cardData = matchingCards[Math.floor(Math.random() * matchingCards.length)] || CARD_DATA['card_common_001']
  
  const id = `card_${rarity}_${Math.floor(Math.random() * 1000)}`
  
  const baseCardData = CARD_DATA[id] || cardData
  
  return {
    id,
    name: baseCardData.name,
    duckType: duck.id,
    variant,
    rarity,
    evolutionStage: 1,
    hp: baseCardData.hp,
    attack: baseCardData.attack,
    defense: baseCardData.defense,
    image: baseCardData.variants[variant].image,
    holographic: baseCardData.variants[variant].holographic || variant !== 'normal',
    sparkle: baseCardData.variants[variant].sparkle || variant === 'shiny',
    foil: baseCardData.variants[variant].foil || variant === 'shiny' || variant === 'glossy',
    collectionCount: collectionCount(id) + 1,
    isMutant: false
  }
}

export function getRarityColor(rarity: Rarity): string {
  const colors: Record<Rarity, string> = {
    common: 'border-green-500 bg-green-500/10',
    rare: 'border-blue-500 bg-blue-500/10',
    epic: 'border-purple-500 bg-purple-500/10',
    legendary: 'border-yellow-500 bg-yellow-500/10',
    mythic: 'border-pink-500 bg-pink-500/10'
  }
  return colors[rarity]
}

export function calculateEvolutionProgress(card: Card, collection: Card[]): number {
  const sameCards = collection.filter(c => c.duckType === card.duckType && c.rarity === card.rarity)
  return Math.min(sameCards.length, 3) / 3
}