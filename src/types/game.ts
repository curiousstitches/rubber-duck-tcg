export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'

export type CardVariant = 'normal' | 'shiny' | 'glossy'

export interface Card {
  id: string
  name: string
  duckType: string
  variant: CardVariant
  rarity: Rarity
  evolutionStage: number
  hp: number
  attack: number
  defense: number
  speed: number
  specialAttack: number
  image: string
  holographic: boolean
  sparkle: boolean
  foil: boolean
  animation: string
  collectionCount: number
  isMutant: boolean
  baseCards?: string[]
  abilities?: string[]
  description?: string
}

export interface Pack {
  id: string
  opened: boolean
  cards: Card[]
  openingAnimation: 'frontToBack' | 'backToFront'
  createdAt: number
  grade: 'basic' | 'premium' | 'elite'
}

export interface Deck {
  id: string
  name: string
  cards: string[]
  active: boolean
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  unlockedAt?: number
  progress: number
  target: number
}

export interface GameState {
  cards: Card[]
  packs: Pack[]
  duckTypes: DuckType[]
  decks: Deck[]
  achievements: Achievement[]
  quests: Quest[]
  lastPackClaim: number
  lastAppOpenPack: number
  lastLogin: number
  loginStreak: number
  coins: number
  gems: number
  accountSync: boolean
  accountId: string | null
  soundEnabled: boolean
  language: string
  battleWinner: 'player' | 'enemy' | null
}

export interface DuckType {
  id: string
  name: string
  description: string
  baseImage: string
  evolutionImages: string[]
  habitat: string
  ability: string
  element: 'water' | 'fire' | 'earth' | 'wind' | 'lightning' | 'ice' | 'light' | 'dark' | 'neutral'
}

export interface MutantRecipe {
  baseCards: string[]
  resultCardId: string
  chance: number
}

export interface CardData {
  id: string
  name: string
  duckType: string
  hp: number
  attack: number
  defense: number
  speed: number
  specialAttack: number
  description: string
  habitat: string
  ability: string
  evolutionRequirements: { count: number, rarity?: Rarity }
  variants: {
    [key in CardVariant]: {
      image: string
      holographic: boolean
      sparkle: boolean
      foil: boolean
      animation: string
    }
  }
  evolution: string
  mutantRecipes: string[]
  element: 'water' | 'fire' | 'earth' | 'wind' | 'lightning' | 'ice' | 'light' | 'dark' | 'neutral'
  abilities: string[]
}

export type CardGrade = 'basic' | 'advanced' | 'premium'

export interface BattleState {
  playerDeck: Card[]
  enemyDeck: Card[]
  currentTurn: 'player' | 'enemy'
  playerHp: number
  enemyHp: number
  log: string[]
}

export interface Quest {
  id: string
  title: string
  description: string
  reward: { coins?: number, gems?: number, card?: string }
  progress: number
  target: number
  completed: boolean
}