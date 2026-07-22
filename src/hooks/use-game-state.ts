import { useState, useEffect, useCallback } from 'react'
import { Card, Pack, GameState, DuckType } from '@/types/game'
import { CARD_DATA, RARITY_WEIGHTS, DUCK_TYPES } from '@/data/cards'
import { generateRandomCard } from '@/lib/card-generator'

const STORAGE_KEY = 'rubber-duck-tcg-game-state'

const EMPTY_STATE: GameState = {
  cards: [],
  packs: [],
  duckTypes: DUCK_TYPES,
  lastPackClaim: 0,
  lastAppOpenPack: 0,
  accountSync: false,
  accountId: null
}

export function useGameState() {
  const [state, setState] = useState<GameState>(EMPTY_STATE)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setState(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load game state:', e)
      }
    } else {
      const initialState = initializeNewGameState()
      setState(initialState)
    }
    setIsLoaded(true)
  }, [])

  const saveState = useCallback((newState: GameState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState))
    setState(newState)
  }, [])

  const getCollectionCount = useCallback((cardId: string) => {
    return state.cards.filter(c => c.id === cardId).length
  }, [state.cards])

  const addPack = useCallback((packId: string) => {
    const newPack: Pack = {
      id: packId,
      opened: false,
      cards: [],
      openingAnimation: Math.random() > 0.5 ? 'frontToBack' : 'backToFront',
      createdAt: Date.now()
    }
    const newState = { ...state, packs: [...state.packs, newPack] }
    saveState(newState)
    return newPack
  }, [state, saveState])

  const openPack = useCallback((packId: string, animation: 'frontToBack' | 'backToFront') => {
    const packIndex = state.packs.findIndex(p => p.id === packId)
    if (packIndex === -1) return null

    const newCards: Card[] = Array.from({ length: 5 }, () => generateRandomCard(getCollectionCount))
    
    const updatedCards = [...state.cards, ...newCards]
    const updatedPacks = [...state.packs]
    updatedPacks[packIndex] = { ...updatedPacks[packIndex], opened: true, cards: newCards, openingAnimation: animation }
    
    const newState = { ...state, cards: updatedCards, packs: updatedPacks }
    saveState(newState)
    return newState
  }, [state, saveState, getCollectionCount])

  const evolveCard = useCallback((cardId: string) => {
    const baseCardData = CARD_DATA[cardId]
    if (!baseCardData || !baseCardData.evolution) return null
    
    const evolutionId = baseCardData.evolution
    const evolutionData = CARD_DATA[evolutionId]
    if (!evolutionData) return null
    
    const cardsToEvolve = state.cards
      .filter(c => c.id === cardId)
      .slice(0, 3)
    
    if (cardsToEvolve.length < 3) return null
    
    const evolvedCard: Card = {
      id: evolutionId,
      name: evolutionData.name,
      duckType: evolutionData.duckType,
      variant: 'normal',
      rarity: evolutionData.name.includes('Mythic') ? 'mythic' : 
              evolutionData.name.includes('Legendary') ? 'legendary' :
              evolutionData.name.includes('Epic') ? 'epic' :
              evolutionData.name.includes('Rare') ? 'rare' : 'common',
      evolutionStage: 2,
      hp: evolutionData.hp,
      attack: evolutionData.attack,
      defense: evolutionData.defense,
      image: evolutionData.variants.normal.image,
      holographic: evolutionData.variants.normal.holographic,
      sparkle: evolutionData.variants.normal.sparkle,
      foil: evolutionData.variants.normal.foil,
      collectionCount: getCollectionCount(evolutionId) + 1,
      isMutant: false
    }
    
    const remainingCards = state.cards.filter(c => c.id !== cardId || !state.cards.slice(0, state.cards.indexOf(c)).some(x => x.id === cardId && state.cards.indexOf(x) < state.cards.indexOf(c)))
    const newCards = [...state.cards.filter(c => c.id !== cardId), evolvedCard]
    
    const newState = { ...state, cards: newCards }
    saveState(newState)
    return evolvedCard
  }, [state, saveState, getCollectionCount])

  const combineMutants = useCallback((cardIds: string[]) => {
    for (const [id, data] of Object.entries(CARD_DATA)) {
      if (data.mutantRecipes && data.mutantRecipes.includes(cardIds[0])) {
        const hasAllCards = cardIds.every(id => getCollectionCount(id) > 0)
        if (hasAllCards) {
          const mutantCard: Card = {
            id: `mutant_${Date.now()}`,
            name: `Mutant ${DUCK_TYPES.find(d => d.id === CARD_DATA[id].duckType)?.name || 'Duck'}`,
            duckType: 'mutant',
            variant: 'shiny',
            rarity: 'mythic',
            evolutionStage: 1,
            hp: 200,
            attack: 150,
            defense: 120,
            image: '/cards/ducks/mutant.png',
            holographic: true,
            sparkle: true,
            foil: true,
            collectionCount: 1,
            isMutant: true,
            baseCards: cardIds
          }
          const newState = { ...state, cards: [...state.cards, mutantCard] }
          saveState(newState)
          return mutantCard
        }
      }
    }
    return null
  }, [state, saveState, getCollectionCount])

  const checkPackClaims = useCallback(() => {
    const now = Date.now()
    const hour = 60 * 60 * 1000
    const twelveHours = 12 * hour
    
    if (now - state.lastPackClaim >= twelveHours) {
      const packsToAdd = Math.floor((now - state.lastPackClaim) / twelveHours)
      for (let i = 0; i < packsToAdd; i++) {
        addPack(`pack_${Date.now() + i}`)
      }
      saveState({ ...state, lastPackClaim: now })
    }
    
    const unopenedPacks = state.packs.filter(p => !p.opened)
    if (unopenedPacks.length < 2) {
      const packCount = Math.min(2, 2 - unopenedPacks.length)
      for (let i = 0; i < packCount; i++) {
        addPack(`pack_app_${Date.now() + i}`)
      }
      saveState({ ...state, lastAppOpenPack: now })
    }
  }, [state, saveState, addPack])

  return {
    state,
    isLoaded,
    getCollectionCount,
    addPack,
    openPack,
    evolveCard,
    combineMutants,
    checkPackClaims
  }
}

function initializeNewGameState(): GameState {
  const now = Date.now()
  const initialPack: Pack = {
    id: 'starter_pack',
    opened: false,
    cards: [],
    openingAnimation: 'frontToBack',
    createdAt: now
  }
  
  return {
    cards: [],
    packs: [initialPack],
    duckTypes: DUCK_TYPES,
    lastPackClaim: now,
    lastAppOpenPack: now,
    accountSync: false,
    accountId: null
  }
}