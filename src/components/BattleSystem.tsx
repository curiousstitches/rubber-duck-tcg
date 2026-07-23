'use client'

import { useState, useEffect } from 'react'
import { Card, BattleState } from '@/types/game'
import { Card as CardUI, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { motion, AnimatePresence } from 'framer-motion'
import { Swords, Heart, Shield, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ELEMENT_COLORS } from '@/data/cards'

interface BattleProps {
  playerCards: Card[]
  onBattleEnd: (winner: 'player' | 'enemy') => void
}

export function BattleSystem({ playerCards, onBattleEnd }: BattleProps) {
  const [battle, setBattle] = useState<BattleState>({
    playerDeck: [...playerCards],
    enemyDeck: generateEnemyDeck(),
    currentTurn: 'player',
    playerHp: 100,
    enemyHp: 100,
    log: []
  })
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)

  function generateEnemyDeck(): Card[] {
    const elements: Array<'water' | 'fire' | 'earth' | 'wind' | 'lightning' | 'ice' | 'light' | 'dark' | 'neutral'> = [
      'water', 'fire', 'earth', 'wind', 'lightning', 'neutral'
    ]
    return Array.from({ length: 3 }, (_, i) => ({
      id: `enemy_${i}`,
      name: `Wild Duck ${i + 1}`,
      duckType: 'mallard',
      variant: 'normal',
      rarity: 'common',
      evolutionStage: 1,
      hp: 50 + i * 10,
      attack: 30 + i * 5,
      defense: 20 + i * 3,
      speed: 40 + i * 5,
      specialAttack: 25 + i * 4,
      image: '/cards/ducks/mallard_normal.png',
      holographic: false,
      sparkle: false,
      foil: false,
      animation: '',
      collectionCount: 0,
      isMutant: false,
      abilities: [`Basic Attack`],
      element: elements[i % elements.length]
    }))
  }

  const handleAttack = (attacker: Card, defender: Card) => {
    const damage = Math.max(1, attacker.attack - defender.defense / 2)
    const logMessage = `${attacker.name} attacks for ${damage} damage!`
    
    setBattle(prev => ({
      ...prev,
      enemyHp: Math.max(0, prev.enemyHp - damage),
      log: [...prev.log, logMessage].slice(-10)
    }))
    
    if (battle.enemyHp - damage <= 0) {
      setTimeout(() => onBattleEnd('player'), 1000)
    }
  }

  const handleSpecialAttack = (attacker: Card, defender: Card) => {
    const damage = Math.max(1, attacker.specialAttack - defender.defense / 3)
    const logMessage = `${attacker.name} uses SPECIAL for ${damage} damage!`
    
    setBattle(prev => ({
      ...prev,
      enemyHp: Math.max(0, prev.enemyHp - damage),
      log: [...prev.log, logMessage].slice(-10)
    }))
    
    if (battle.enemyHp - damage <= 0) {
      setTimeout(() => onBattleEnd('player'), 1000)
    }
  }

  const getDuckEmoji = (duckType: string) => {
    const emojis: Record<string, string> = {
      mallard: '🦆', pintail: '🦆', teal: '🦆', rubber: '🛁', fire: '🔥',
      water: '🌊', earth: '🌍', wind: '💨', lightning: '⚡', ice: '🧊',
      light: '☀️', dark: '🌑', neutral: '⚪'
    }
    return emojis[duckType] || '🦆'
  }

  if (!battle) return null

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-slate-900 to-slate-950 p-4">
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-500">
          Duck Battle!
        </h1>
        <div className="flex justify-center gap-8 mt-4">
          <div className="text-center">
            <Heart className="h-6 w-6 text-red-500 mx-auto mb-1" />
            <Progress value={battle.playerHp} className="w-32" />
            <span className="text-white text-sm">{battle.playerHp}/100</span>
          </div>
          <div className="text-center">
            <Heart className="h-6 w-6 text-red-500 mx-auto mb-1" />
            <Progress value={battle.enemyHp} className="w-32" />
            <span className="text-white text-sm">{battle.enemyHp}/100</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {battle.enemyDeck.map((card, idx) => (
          <CardUI key={card.id} className="bg-red-900/30 border-red-500/50">
            <CardContent className="p-2 text-center">
              <div className="text-2xl">{getDuckEmoji(card.duckType)}</div>
              <div className="text-xs text-white">{card.name}</div>
              <div className="text-xs text-red-300">HP: {card.hp}</div>
            </CardContent>
          </CardUI>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {battle.playerDeck.map((card) => (
          <motion.div
            key={card.id}
            whileTap={{ scale: 0.95 }}
            className={cn(
              'border-2 rounded-lg p-2 text-center cursor-pointer transition-all',
              selectedCard?.id === card.id ? 'ring-2 ring-yellow-400' : ''
            )}
            onClick={() => setSelectedCard(card)}
            style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
          >
            <div className="text-2xl">{getDuckEmoji(card.duckType)}</div>
            <div className="text-xs text-white">{card.name}</div>
            <div className="text-xs text-green-300">HP: {card.hp}</div>
          </motion.div>
        ))}
      </div>

      {selectedCard && (
        <div className="mb-4 bg-slate-800/50 rounded-lg p-3">
          <h3 className="text-white font-semibold mb-2">Selected: {selectedCard.name}</h3>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => handleAttack(selectedCard, battle.enemyDeck[0])}>
              <Swords className="h-4 w-4 mr-1" /> Attack
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleSpecialAttack(selectedCard, battle.enemyDeck[0])}>
              <Zap className="h-4 w-4 mr-1" /> Special
            </Button>
          </div>
        </div>
      )}

      <div className="bg-slate-800/50 rounded-lg p-3 flex-1 overflow-y-auto">
        <h3 className="text-white font-semibold mb-2">Battle Log</h3>
        <AnimatePresence>
          {battle.log.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-sm text-gray-300"
            >
              {msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}