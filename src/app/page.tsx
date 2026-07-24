'use client'

import { useState, useEffect } from 'react'
import type { Card as CardType, Pack } from '@/types/game'
import { useGameState } from '@/hooks/use-game-state'
import { BattleSystem } from '@/components/BattleSystem'
import { PackRipOpener } from '@/components/PackRipOpener'
import { DuckCard } from '@/components/DuckCard'
import { Button } from '@/components/ui/button'
import { Card as CardUI, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { motion, AnimatePresence } from 'framer-motion'
import { Package as PackIcon, Layers, Swords, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

type View = 'theme' | 'packs' | 'collection' | 'evolve' | 'battle'

export default function Home() {
  const { state, isLoaded, addPack, openPack, evolveCard, combineMutants, checkPackClaims } = useGameState()
  const [currentView, setCurrentView] = useState<View>('theme')
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null)
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null)
  const [battleWinner, setBattleWinner] = useState<'player' | 'enemy' | null>(null)
  const [theme, setTheme] = useState('classic')
  const [started, setStarted] = useState(false)

  useEffect(() => {
    if (isLoaded && !selectedPack && !started) {
      checkPackClaims()
      const unopenedPacks = state.packs.filter(p => !p.opened)
      if (unopenedPacks.length > 0) {
        setCurrentView('packs')
        setStarted(true)
      }
    }
  }, [isLoaded, state])

  if (!isLoaded) {
    return <div className="flex h-screen w-full items-center justify-center bg-slate-950" />
  }

  const unopenedCount = state.packs.filter(p => !p.opened).length

  const handleThemeSelect = (selected: string) => {
    setTheme(selected)
    setStarted(true)
    setCurrentView('packs')
  }

  const handleOpenPack = (pack: Pack) => setSelectedPack(pack)

  const handleRip = (): CardType[] => {
    if (!selectedPack) return []
    const newState = openPack(selectedPack.id, selectedPack.openingAnimation)
    if (!newState) return []
    const opened = newState.packs.find(p => p.id === selectedPack.id)
    return opened?.cards ?? []
  }

  const handleRipDone = () => {
    setSelectedPack(null)
    setCurrentView('collection')
  }

  const handleEvolveCard = (card: CardType) => {
    setSelectedCard(card)
    setCurrentView('evolve')
  }

  /* ---------- shared chrome ---------- */

  const Header = ({ title, backTo }: { title: string; backTo?: View }) => (
    <div className="sticky top-0 z-30 flex items-center gap-2 border-b border-white/10 bg-slate-950/90 px-3 py-3 backdrop-blur-md">
      {backTo && (
        <button
          onClick={() => setCurrentView(backTo)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white active:bg-white/20"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      )}
      <div className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-400 drop-shadow">
        {title}
      </div>
    </div>
  )

  const BottomNav = () => (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-slate-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
      <div className="mx-auto grid max-w-md grid-cols-3">
        {([
          ['packs', 'Packs', PackIcon, unopenedCount],
          ['collection', 'Collection', Layers, state.cards.length],
          ['battle', 'Battle', Swords, null],
        ] as const).map(([view, label, Icon, count]) => {
          const active = currentView === view
          return (
            <button
              key={view}
              onClick={() => setCurrentView(view)}
              className={cn(
                'relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-bold',
                active ? 'text-yellow-300' : 'text-white/50'
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
              {count !== null && count > 0 && (
                <span className="absolute right-[22%] top-1 min-w-[16px] rounded-full bg-pink-500 px-1 text-[9px] font-black text-white">
                  {count}
                </span>
              )}
              {active && <span className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-yellow-300" />}
            </button>
          )
        })}
      </div>
    </nav>
  )

  /* ---------- views ---------- */

  const renderThemeSelection = () => (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-purple-950 via-slate-950 to-blue-950 p-4">
      <div className="mb-8 text-center">
        <div className="mb-2 text-6xl">🦆</div>
        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-400 drop-shadow-lg">
          Ducking Fun
        </h1>
        <p className="mt-2 text-lg font-medium text-white/80">Choose your theme!</p>
      </div>
      <div className="grid w-full max-w-md grid-cols-1 gap-3 sm:grid-cols-2">
        {['classic', 'ocean', 'cosmic', 'steampunk', 'retro'].map((t) => (
          <motion.button
            key={t}
            whileTap={{ scale: 0.95 }}
            className="rounded-2xl border-2 border-white/20 bg-white/5 py-5 text-lg font-black uppercase tracking-wide text-white backdrop-blur active:bg-white/15"
            onClick={() => handleThemeSelect(t)}
          >
            {t}
          </motion.button>
        ))}
      </div>
    </div>
  )

  const renderPacks = () => (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 pb-24">
      <Header title="Ducking Fun" />
      <div className="p-3">
        <h2 className="mb-1 text-base font-extrabold text-white">Your Packs</h2>
        <p className="mb-4 text-xs text-white/60">New packs arrive every 12 hours and each time you open the app.</p>

        {unopenedCount === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-white/15 py-10 text-center">
            <div className="mb-2 text-4xl">⏳</div>
            <p className="font-bold text-white">No packs right now</p>
            <p className="mt-1 text-xs text-white/60">Come back soon — a fresh pack is on the way!</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <AnimatePresence>
            {state.packs.filter(p => !p.opened).map((pack, i) => (
              <motion.button
                key={pack.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleOpenPack(pack)}
                className="relative aspect-[5/7] overflow-hidden rounded-2xl border-2 border-yellow-400/50 bg-gradient-to-br from-teal-700 via-teal-900 to-slate-900 shadow-xl"
              >
                <div className="foil-sweep" />
                <div className="flex h-full flex-col items-center justify-center gap-1.5 px-2">
                  <div className="text-5xl drop-shadow-lg">🦆</div>
                  <div className="text-center text-sm font-black uppercase tracking-wide text-yellow-300 drop-shadow">
                    Ducking Fun
                  </div>
                  {pack.grade && pack.grade !== 'basic' ? (
                    <Badge className={pack.grade === 'elite' ? 'bg-purple-500' : 'bg-blue-500'}>
                      {pack.grade}
                    </Badge>
                  ) : (
                    <div className="rounded-full bg-black/30 px-2.5 py-0.5 text-[9px] uppercase tracking-widest text-yellow-100/80">
                      5 cards
                    </div>
                  )}
                  <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/70">
                    Tap to rip!
                  </div>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        <h3 className="mb-2 mt-6 text-sm font-extrabold text-white">Collection Summary</h3>
        <div className="grid grid-cols-5 gap-1.5">
          {(['common', 'rare', 'epic', 'legendary', 'mythic'] as const).map((rarity) => (
            <div key={rarity} className="rounded-xl bg-white/5 p-1.5 text-center ring-1 ring-white/10">
              <p className="text-lg font-black text-white">
                {state.cards.filter(c => c.rarity === rarity).length}
              </p>
              <p className="truncate text-[8px] font-bold uppercase tracking-wider text-white/60">{rarity}</p>
            </div>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  )

  const renderCollection = () => (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 pb-24">
      <Header title="Collection" backTo="packs" />
      <div className="p-3">
        <div className="mb-3 flex gap-2">
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white">
            Total {state.cards.length}
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white">
            Unique {new Set(state.cards.map(c => c.duckType)).size}
          </span>
        </div>

        {state.cards.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-white/15 py-12 text-center">
            <div className="mb-2 text-4xl">🃏</div>
            <p className="font-bold text-white">No cards yet</p>
            <p className="mt-1 text-xs text-white/60">Rip a pack to start your collection!</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <AnimatePresence>
            {state.cards.map((card, index) => (
              <motion.div
                key={card.id + index}
                layout
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleEvolveCard(card)}
              >
                <DuckCard card={card} size="sm" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
      <BottomNav />
    </div>
  )

  const renderEvolve = () => {
    if (!selectedCard) return null
    const copies = state.cards.filter(c => c.id === selectedCard.id).length
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-sm"
        >
          <div className="mx-auto mb-4 w-64">
            <DuckCard card={selectedCard} size="lg" />
          </div>
          <div className="rounded-2xl bg-slate-900 p-4 ring-1 ring-white/15">
            <div className="mb-1 text-center text-sm font-bold text-white">
              Collect 3 copies to evolve!
            </div>
            <div className="mb-3 text-center text-xs text-white/60">
              You have {copies} of 3
            </div>
            <Progress value={(copies / 3) * 100} className="mb-4" />
            <div className="flex justify-center gap-2">
              <Button variant="secondary" onClick={() => setCurrentView('collection')}>
                Back
              </Button>
              {copies >= 3 && (
                <Button
                  className="bg-gradient-to-r from-yellow-400 to-amber-500 font-black text-amber-950"
                  onClick={() => { evolveCard(selectedCard.id); setCurrentView('collection') }}
                >
                  Evolve Now!
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  const renderBattle = () => (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 pb-24">
      <Header title="Battle" backTo="collection" />
      <BattleSystem
        playerCards={state.cards}
        onBattleEnd={(winner) => { setBattleWinner(winner); setCurrentView('collection') }}
      />
      <BottomNav />
    </div>
  )

  return (
    <>
      {currentView === 'theme' && renderThemeSelection()}
      {currentView === 'packs' && renderPacks()}
      {currentView === 'collection' && renderCollection()}
      {currentView === 'evolve' && (
        <>
          {renderCollection()}
          {renderEvolve()}
        </>
      )}
      {currentView === 'battle' && renderBattle()}
      {selectedPack && (
        <PackRipOpener pack={selectedPack} onRip={handleRip} onDone={handleRipDone} />
      )}
    </>
  )
}
