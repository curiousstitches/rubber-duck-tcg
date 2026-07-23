'use client'

import { useState, useEffect } from 'react'
import type { Card as CardType, Pack } from '@/types/game'
import { useGameState } from '@/hooks/use-game-state'
import { getRarityColor } from '@/lib/card-generator'
import { BattleSystem } from '@/components/BattleSystem'
import { Button } from '@/components/ui/button'
import { Card as CardUI, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { motion, AnimatePresence } from 'framer-motion'
import { Package as PackIcon, Sparkles, Crown, Swords } from 'lucide-react'
import { cn } from '@/lib/utils'

type View = 'theme' | 'packs' | 'collection' | 'evolve' | 'battle'

export default function Home() {
  const { state, isLoaded, addPack, openPack, evolveCard, combineMutants, checkPackClaims } = useGameState()
  const [currentView, setCurrentView] = useState<View>('theme')
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null)
  const [isOpening, setIsOpening] = useState(false)
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null)
  const [battleWinner, setBattleWinner] = useState<'player' | 'enemy' | null>(null)
  const [theme, setTheme] = useState('classic')

  useEffect(() => {
    if (isLoaded) {
      checkPackClaims()
      const unopenedPacks = state.packs.filter(p => !p.opened)
      if (unopenedPacks.length === 0) {
        setCurrentView('theme')
      } else {
        setCurrentView('packs')
      }
    }
  }, [isLoaded, state])

  if (!isLoaded) {
    return <div className="flex h-screen w-full items-center justify-center bg-gradient-to-b from-purple-900/20 to-blue-900/30" />
  }

  const handleThemeSelect = (selected: string) => {
    setTheme(selected)
    setCurrentView('packs')
  }

  const handleOpenPack = (pack: Pack) => {
    const animation = pack.openingAnimation
    setSelectedPack(pack)
    setIsOpening(true)
    setTimeout(() => {
      setIsOpening(false)
      openPack(pack.id, animation)
      setCurrentView('collection')
    }, 1500)
  }

  const handlePackAnimationComplete = () => {
    if (selectedPack) {
      openPack(selectedPack.id, selectedPack.openingAnimation)
      setSelectedPack(null)
    }
  }

  const handleEvolveCard = (card: CardType) => {
    setSelectedCard(card)
    setCurrentView('evolve')
  }

  const handleMutate = () => {
    if (selectedCard) {
      combineMutants([selectedCard.id])
    }
  }

  const renderThemeSelection = () => (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-purple-900/30 to-blue-900/30 p-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-500">
          Rubber Duck TCG
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">Choose your theme!</p>
      </div>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 max-w-md">
        {['classic', 'ocean', 'cosmic', 'steampunk', 'retro'].map((t) => (
          <motion.div
            key={t}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="outline"
              className="h-24 w-full flex-col gap-1 border-2"
              onClick={() => handleThemeSelect(t)}
            >
              <div className="text-xl font-bold uppercase">{t}</div>
              <Badge variant="secondary">New Game</Badge>
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  )

  const renderPacks = () => (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-900 to-slate-950 p-2 sm:p-4">
      <div className="mb-4 flex justify-between items-center">
        <Button variant="ghost" size="sm" onClick={() => setCurrentView('collection')}>
          Collection ({state.cards.length})
        </Button>
        <div className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-500">
          Duck TCG
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-1">Your Packs</h2>
        <p className="text-xs text-muted-foreground">
          12-hour packs and app-open packs available!
        </p>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-semibold mb-2">Available Packs ({state.packs.filter(p => !p.opened).length})</h3>
        <AnimatePresence>
          <div className="grid grid-cols-1 gap-3">
            {state.packs.filter(p => !p.opened).map((pack) => (
              <motion.div
                key={pack.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
              >
                <CardUI className="cursor-pointer hover:scale-105 transition-transform" onClick={() => handleOpenPack(pack)}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <PackIcon className="h-5 w-5" />
                      Pack #{state.packs.indexOf(pack) + 1}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-center py-4 sm:py-6 border-2 border-dashed rounded-lg">
                      <p className="text-muted-foreground text-sm">Tap to open pack!</p>
                      <p className="text-xs mt-1">Animation: {pack.openingAnimation === 'frontToBack' ? 'Front to Back' : 'Back to Front'}</p>
                    </div>
                  </CardContent>
                </CardUI>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2">Collection Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {(['common', 'rare', 'epic', 'legendary', 'mythic'] as const).map((rarity) => (
            <div key={rarity} className="text-center p-2 rounded-lg bg-muted/50">
              <Badge className="mb-1 text-xs" style={{ backgroundColor: `hsl(var(--${rarity}-500))`, color: 'white' }}>
                {rarity}
              </Badge>
              <p className="text-lg font-bold">
                {state.cards.filter(c => c.rarity === rarity).length}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderCollection = () => (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-900 to-slate-950 p-2 sm:p-4">
      <div className="mb-4 flex justify-between items-center">
        <Button variant="ghost" size="sm" onClick={() => setCurrentView('packs')}>
          Packs ({state.packs.filter(p => !p.opened).length})
        </Button>
        <div className="flex gap-2 items-center">
          <Button variant="ghost" size="sm" onClick={() => setCurrentView('battle')}>
            <Swords className="h-4 w-4 mr-1" /> Battle
          </Button>
          <div className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-500">
            Collection
          </div>
        </div>
      </div>

      <div className="mb-3 flex gap-2 text-xs">
        <Badge variant="outline">Total: {state.cards.length}</Badge>
        <Badge variant="outline">Unique: {new Set(state.cards.map(c => c.duckType)).size}</Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 overflow-y-auto flex-1">
        <AnimatePresence>
          {state.cards.map((card, index) => (
            <motion.div
              key={card.id + index}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.05 }}
              className="cursor-pointer"
              onClick={() => handleEvolveCard(card)}
            >
              <CardUI className={cn('border-2', getRarityColor(card.rarity))}>
                <CardContent className="p-2">
                  <div className="aspect-[3/4] rounded-lg bg-muted/30 flex items-center justify-center mb-1.5 relative overflow-hidden">
                    <div className="text-2xl sm:text-3xl">{getDuckEmoji(card.duckType)}</div>
                    {card.holographic && <Sparkles className="absolute w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 animate-pulse" />}
                    {card.foil && <Crown className="absolute w-2 h-2 sm:w-3 sm:h-3 text-pink-400" />}
                  </div>
                  <div className="text-xs font-semibold truncate">{card.name}</div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{card.hp} HP</span>
                    <Badge variant="outline" className="text-xs">{card.rarity}</Badge>
                  </div>
                </CardContent>
              </CardUI>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )

  const renderEvolve = () => {
    if (!selectedCard) return null
    
    const evolutionData = state.cards.filter(c => c.id === selectedCard.id).length
    
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-2 sm:p-4 z-50">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md"
        >
          <CardUI>
            <CardHeader>
              <CardTitle>Evolve {selectedCard.name}?</CardTitle>
              <CardDescription>
                Collect 3 of the same card to evolve!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <div className="text-4xl sm:text-5xl mb-2">{getDuckEmoji(selectedCard.duckType)}</div>
                <div className="text-lg sm:text-xl font-bold mb-3">{selectedCard.name}</div>
                <div className="flex justify-center gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-xl sm:text-2xl font-bold">{evolutionData}</p>
                    <p className="text-xs text-muted-foreground">Collected</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl sm:text-2xl font-bold">3</p>
                    <p className="text-xs text-muted-foreground">Required</p>
                  </div>
                </div>
                <Progress value={(evolutionData / 3) * 100} className="mb-4" />
                {evolutionData >= 3 && (
                  <Button onClick={() => evolveCard(selectedCard.id)}>
                    Evolve Now!
                  </Button>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="ghost" size="sm" onClick={() => setCurrentView('collection')}>
                Cancel
              </Button>
            </CardFooter>
          </CardUI>
        </motion.div>
      </div>
    )
  }

  const renderPacksModal = () => {
    if (!selectedPack || !isOpening) return null
    
    return (
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent className="bg-gradient-to-b from-purple-900/50 to-blue-900/50 border-2 border-yellow-500">
          <DialogHeader>
            <DialogTitle>Opening Pack...</DialogTitle>
            <DialogDescription>
              {selectedPack.openingAnimation === 'frontToBack' ? 'Revealing cards...' : 'Uncovering treasures...'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-5 gap-1.5 py-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0.5, opacity: 0, rotateY: 180 }}
                animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                transition={{ delay: i * 0.15 }}
              >
                <CardUI className="h-12 w-full sm:h-16 flex items-center justify-center border-2 border-yellow-500">
                  <div className="text-2xl sm:text-3xl">🦆</div>
                </CardUI>
              </motion.div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const getDuckEmoji = (duckType: string): string => {
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

  return (
    <>
      {currentView === 'theme' && renderThemeSelection()}
      {currentView === 'packs' && renderPacks()}
      {currentView === 'collection' && renderCollection()}
      {currentView === 'evolve' && renderEvolve()}
      {currentView === 'battle' && <BattleSystem playerCards={state.cards} onBattleEnd={(winner) => { setBattleWinner(winner); setCurrentView('collection'); }} />}
      {renderPacksModal()}
    </>
  )
}