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
  image: string
  holographic: boolean
  sparkle: boolean
  foil: boolean
  collectionCount: number
  isMutant: boolean
  baseCards?: string[]
}

export interface Pack {
  id: string
  opened: boolean
  cards: Card[]
  openingAnimation: 'frontToBack' | 'backToFront'
  createdAt: number
}

export interface GameState {
  cards: Card[]
  packs: Pack[]
  duckTypes: DuckType[]
  lastPackClaim: number
  lastAppOpenPack: number
  accountSync: boolean
  accountId: string | null
}

export interface DuckType {
  id: string
  name: string
  description: string
  baseImage: string
  evolutionImages: string[]
  habitat: string
  ability: string
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
    }
  }
  evolution: string
  mutantRecipes: string[]
}

export type CardGrade = 'basic' | 'advanced' | 'premium'