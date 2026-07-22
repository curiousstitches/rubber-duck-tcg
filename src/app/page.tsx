'use client'

import { useState, useEffect } from 'react'
import type { Card as CardType, Pack } from '@/types/game'
import { useGameState } from '@/hooks/use-game-state'
import { getRarityColor } from '@/lib/card-generator'
import { Button } from '@/components/ui/button'
import { Card as CardUI, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Package as PackIcon, Star, Sparkles, Crown, Shield, Sword, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

type View = 'theme' | 'packs' | 'collection' | 'evolve'

export default function Home() {
  const { state, isLoaded, addPack, openPack, evolveCard, combineMutants, checkPackClaims } = useGameState()
  const [currentView, setCurrentView] = useState<View>('theme')
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null)
  const [isOpening, setIsOpening] = useState(false)
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null)
  const [theme, setTheme] = useState('classic')

  useEffect(() => {
    if (isLoaded) {
      checkPackClaims()
      if (state.packs.length === 0 || (state.packs.length === 1 && state.packs[0].opened)) {
        setCurrentView('theme')
      } else {
        setCurrentView('packs')
      }
    }
  }, [isLoaded, state])

  if (!isLoaded) {
    return <div className="flex h-screen w-full items-center justify-center bg-gradient-to-b from-purple-900/20 to-blue-900/20" />
  }

  const handleThemeSelect = (selected: string) => {
    setTheme(selected)
    setCurrentView('packs')
  }

  const handleOpenPack = (pack: Pack) => {
    setSelectedPack(pack)
    setIsOpening(true)
    setTimeout(() => {
      setIsOpening(false)
    }, 1000)
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
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-500">
          Rubber Duck TCG
        </h1>
        <p className="mt-2 text-xl text-muted-foreground">Choose your theme!</p>
      </div>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {['classic', 'ocean', 'cosmic', 'steampunk', 'retro'].map((t) => (
          <motion.div
            key={t}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="outline"
              className="h-32 w-full flex-col gap-2 border-2"
              onClick={() => handleThemeSelect(t)}
            >
              <div className="text-2xl font-bold uppercase">{t}</div>
              <Badge variant="secondary">New Game</Badge>
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  )

  const renderPacks = () => (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-900 to-slate-950 p-4">
      <div className="mb-4 flex justify-between items-center">
        <Button variant="ghost" onClick={() => setCurrentView('collection')}>
          Collection ({state.cards.length})
        </Button>
        <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-500">
          Duck TCG
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Your Packs</h2>
        <p className="text-muted-foreground">
          12-hour packs and app-open packs available!
        </p>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-3">Available Packs ({state.packs.filter(p => !p.opened).length})</h3>
        <AnimatePresence>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {state.packs.filter(p => !p.opened).map((pack) => (
              <motion.div
                key={pack.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
              >
                <CardUI className="cursor-pointer hover:scale-105 transition-transform" onClick={() => handleOpenPack(pack)}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PackIcon className="h-6 w-6" />
                      Pack #{state.packs.indexOf(pack) + 1}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                      <p className="text-muted-foreground">Tap to open pack!</p>
                      <p className="text-sm mt-2">Animation: {pack.openingAnimation === 'frontToBack' ? 'Front to Back' : 'Back to Front'}</p>
                    </div>
                  </CardContent>
                </CardUI>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Collection Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {(['common', 'rare', 'epic', 'legendary', 'mythic'] as const).map((rarity) => (
            <div key={rarity} className="text-center p-4 rounded-lg bg-muted/50">
              <Badge className="mb-2" style={{ backgroundColor: `hsl(var(--${rarity}-500))`, color: 'white' }}>
                {rarity}
              </Badge>
              <p className="text-2xl font-bold">
                {state.cards.filter(c => c.rarity === rarity).length}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderCollection = () => (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-900 to-slate-950 p-4">
      <div className="mb-4 flex justify-between items-center">
        <Button variant="ghost" onClick={() => setCurrentView('packs')}>
          Packs ({state.packs.filter(p => !p.opened).length})
        </Button>
        <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-500">
          Collection
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <Badge variant="outline">Total Cards: {state.cards.length}</Badge>
        <Badge variant="outline">Unique Types: {new Set(state.cards.map(c => c.duckType)).size}</Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 overflow-y-auto flex-1">
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
                <CardContent className="p-3">
                  <div className="aspect-[3/4] rounded-lg bg-muted/30 flex items-center justify-center mb-2 overflow-hidden">
                    <div className="text-4xl">{getDuckEmoji(card.duckType)}</div>
                    {card.holographic && <Sparkles className="absolute w-4 h-4 text-yellow-400 animate-pulse" />}
                    {card.foil && <Crown className="absolute w-3 h-3 text-pink-400" />}
                  </div>
                  <div className="text-sm font-semibold truncate">{card.name}</div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{card.hp} HP</span>
                    <Badge variant="outline" className="text-xs">
                      {card.rarity}
                    </Badge>
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
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
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
                <div className="text-6xl mb-2">{getDuckEmoji(selectedCard.duckType)}</div>
                <div className="text-2xl font-bold mb-2">{selectedCard.name}</div>
                <div className="flex justify-center gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{evolutionData}</p>
                    <p className="text-sm text-muted-foreground">Collected</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">3</p>
                    <p className="text-sm text-muted-foreground">Required</p>
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
              <Button variant="ghost" onClick={() => setCurrentView('collection')}>
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
          <div className="grid grid-cols-5 gap-2 py-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0.5, opacity: 0, rotateY: 180 }}
                animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                transition={{ delay: i * 0.2 }}
              >
                <CardUI className="h-20 w-full flex items-center justify-center border-2 border-yellow-500">
                  <div className="text-3xl">🦆</div>
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
      mallard: '🦆',
      pintail: '🦆',
      teal: '🦆',
      canvasback: '🦆',
      bufflehead: '🦆',
      woodduck: '🦆',
      mandarin: '🦆',
      eagle: '🦅',
      rubber: '🛁',
      glow: '🌟',
      storm: '⛈️',
      ice: '🧊',
      fire: '🔥',
      earth: '🌍',
      wind: '💨',
      rain: '🌧️',
      shadow: '🌑',
      light: '☀️',
      crystal: '💎',
      metal: '⚙️',
      ghost: '👻',
      dragon: '🐉',
      phantom: '👻',
      neon: '⚡',
      bio: '🧬',
      cyber: '🖥️',
      quantum: '🌀',
      nebula: '🌌',
      stellar: '⭐',
      omega: '🌀',
      alpha: '🔱',
      chaos: '🎲',
      order: '📐',
      prism: '🌈',
      echo: '🔊',
      flare: '🌋',
      tide: '🌊',
      breeze: '💨',
      thorn: '🌵',
      frost: '❄️',
      quake: '🌋',
      vortex: '🌀',
      nova: '💥',
      eclipse: '🌒',
      aurora: '🌈',
      comet: '☄️',
      meteor: '☄️',
      shock: '⚡',
      static: '⚡',
      current: '⚡',
      plasma: '⚡',
      fusion: '☀️',
      antimatter: '💥',
      singularity: '🌀',
      entropy: '🌀',
      void: '🕳️',
      infinity: '∞',
      zen: '🧘',
      seed: '🌱',
      spore: '🍄',
      hive: '🐝',
      colony: '🐜',
      soul: '👻',
      dream: '🌙',
      nightmare: '😱',
      waking: '☀️',
      gravity: '🌍',
      magnet: '🧲',
      radiation: '☢️',
      isotope: '⚛️',
      elemental: '🔥',
      prime: '🔢',
      fibonacci: '🔢',
      fractal: '🔁'
    }
    return emojis[duckType] || '🦆'
  }

  return (
    <>
      {currentView === 'theme' && renderThemeSelection()}
      {currentView === 'packs' && renderPacks()}
      {currentView === 'collection' && renderCollection()}
      {currentView === 'evolve' && renderEvolve()}
      {renderPacksModal()}
    </>
  )
}