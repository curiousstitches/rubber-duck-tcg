'use client'

import { useState, useRef, useCallback } from 'react'
import type { Card as CardType, Pack } from '@/types/game'
import { motion, AnimatePresence } from 'framer-motion'
import { DuckCard } from '@/components/DuckCard'
import { cn } from '@/lib/utils'

interface PackRipOpenerProps {
  pack: Pack
  onRip: () => CardType[]
  onDone: () => void
}

const RARITY_ORDER: Record<string, number> = { mythic: 4, legendary: 3, epic: 2, rare: 1, common: 0 }

const RARITY_STYLE: Record<string, { frame: string; glow: string; label: string; tag: string }> = {
  common:    { frame: 'border-slate-400',   glow: '',                 label: 'Common',    tag: 'bg-slate-400 text-slate-900' },
  rare:      { frame: 'border-blue-400',    glow: 'glow-rare',        label: 'Rare',      tag: 'bg-blue-400 text-blue-950' },
  epic:      { frame: 'border-purple-400',  glow: 'glow-epic',        label: 'Epic',      tag: 'bg-purple-400 text-purple-950' },
  legendary: { frame: 'border-yellow-400',  glow: 'glow-legendary',   label: 'Legendary', tag: 'bg-yellow-400 text-yellow-950' },
  mythic:    { frame: 'border-pink-400',    glow: 'glow-mythic',      label: 'Mythic',    tag: 'bg-pink-400 text-pink-950' },
}

function buzz(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern)
}

function ConfettiBurst({ mythic }: { mythic?: boolean }) {
  const pieces = Array.from({ length: mythic ? 26 : 16 })
  const colors = mythic
    ? ['#F472B6', '#FBBF24', '#A78BFA', '#34D399', '#60A5FA']
    : ['#FBBF24', '#F59E0B', '#FDE68A']
  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-visible">
      {pieces.map((_, i) => {
        const angle = (i / pieces.length) * Math.PI * 2
        const dist = 70 + Math.random() * 90
        return (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 h-2 w-2 rounded-sm"
            style={{ backgroundColor: colors[i % colors.length] }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
            animate={{
              x: Math.cos(angle) * dist,
              y: Math.sin(angle) * dist,
              opacity: 0,
              rotate: 320,
            }}
            transition={{ duration: 0.9 + Math.random() * 0.4, ease: 'easeOut' }}
          />
        )
      })}
    </div>
  )
}


export function PackRipOpener({ pack, onRip, onDone }: PackRipOpenerProps) {
  const [stage, setStage] = useState<'pack' | 'ripping' | 'reveal'>('pack')
  const [cards, setCards] = useState<CardType[]>([])
  const [flipped, setFlipped] = useState<Set<number>>(new Set())
  const [burstAt, setBurstAt] = useState<number | null>(null)
  const tearStart = useRef<number | null>(null)
  const [tearX, setTearX] = useState(0)
  const packRef = useRef<HTMLDivElement>(null)

  const rip = useCallback(() => {
    setStage('ripping')
    buzz([30, 40, 80])
    const newCards = onRip()
    const sorted = [...newCards].sort(
      (a, b) => (RARITY_ORDER[b.rarity] ?? 0) - (RARITY_ORDER[a.rarity] ?? 0)
    )
    setTimeout(() => {
      setCards(sorted)
      setStage('reveal')
    }, 700)
  }, [onRip])

  const onPointerDown = (e: React.PointerEvent) => {
    if (stage !== 'pack') return
    tearStart.current = e.clientX
    ;(e.target as Element).setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (stage !== 'pack' || tearStart.current === null) return
    const dx = Math.max(0, e.clientX - tearStart.current)
    setTearX(dx)
    if (dx > 8 && Math.floor(dx) % 16 === 0) buzz(5)
    const width = packRef.current?.offsetWidth ?? 240
    if (dx > width * 0.6) {
      tearStart.current = null
      rip()
    }
  }
  const onPointerUp = () => {
    tearStart.current = null
    if (stage === 'pack') setTearX(0)
  }

  const flip = (i: number) => {
    if (flipped.has(i)) return
    const card = cards[i]
    const next = new Set(flipped)
    next.add(i)
    setFlipped(next)
    if (card.rarity === 'mythic') {
      buzz([50, 60, 150])
      setBurstAt(i)
    } else if (card.rarity === 'legendary') {
      buzz([40, 60, 120])
      setBurstAt(i)
    } else {
      buzz(15)
    }
  }

  const allFlipped = cards.length > 0 && flipped.size === cards.length

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-slate-900 via-slate-950 to-black">
      {/* ---------- PACK STAGE ---------- */}
      {(stage === 'pack' || stage === 'ripping') && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 p-4">
          <motion.div
            ref={packRef}
            className="relative aspect-[5/7] w-[min(62vw,240px)]"
            animate={
              stage === 'ripping'
                ? { y: '120vh', rotate: 8, transition: { duration: 0.5, delay: 0.3, ease: 'easeIn' } }
                : { y: [0, -10, 0], rotate: [-1.5, 1.5, -1.5], transition: { duration: 3.2, repeat: Infinity } }
            }
          >
            <div className="absolute inset-0 overflow-hidden rounded-2xl border-2 border-yellow-400/50 bg-gradient-to-br from-teal-700 via-teal-900 to-slate-900 shadow-2xl">
              <div className="foil-sweep" />
              <div className="absolute inset-x-0 top-0 h-4 rounded-t-2xl bg-[repeating-linear-gradient(90deg,rgba(0,0,0,.3)_0_5px,rgba(255,255,255,.12)_5px_10px)]" />
              <div className="absolute inset-x-0 bottom-0 h-4 rounded-b-2xl bg-[repeating-linear-gradient(90deg,rgba(0,0,0,.3)_0_5px,rgba(255,255,255,.12)_5px_10px)]" />
              <div className="flex h-full flex-col items-center justify-center gap-2 px-3">
                <div className="text-6xl drop-shadow-lg">🦆</div>
                <div className="text-center text-lg font-black uppercase tracking-wide text-yellow-400 drop-shadow">
                  Ducking Fun
                </div>
                <div className="rounded-full bg-black/30 px-3 py-1 text-[10px] uppercase tracking-widest text-yellow-100/80">
                  {pack.grade === 'elite' ? 'Elite Pack' : pack.grade === 'premium' ? 'Premium Pack' : '5 Cards Inside'}
                </div>
              </div>
            </div>

            {/* tear flap */}
            <AnimatePresence>
              {stage === 'ripping' && (
                <motion.div
                  className="absolute inset-x-0 top-0 h-9 rounded-t-2xl border-2 border-b-0 border-yellow-400/50 bg-gradient-to-br from-teal-700 to-teal-900"
                  initial={{ rotate: 0, x: 0, y: 0, opacity: 1 }}
                  animate={{ rotate: -38, x: -40, y: -140, opacity: 0 }}
                  transition={{ duration: 0.55, ease: 'easeIn' }}
                  style={{ transformOrigin: 'left bottom' }}
                />
              )}
            </AnimatePresence>

            {/* tear strip */}
            {stage === 'pack' && (
              <div
                className="absolute inset-x-0 top-3 z-10 h-10 cursor-grab touch-none"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
              >
                <div className="absolute inset-x-2 top-7 border-t-2 border-dashed border-yellow-400/90" />
                <motion.div
                  className="absolute top-4 flex h-7 w-7 items-center justify-center rounded-full bg-yellow-400 text-sm shadow-lg"
                  style={{ left: 6 + tearX }}
                  animate={tearX === 0 ? { x: [0, 12, 0] } : { x: 0 }}
                  transition={tearX === 0 ? { duration: 1.4, repeat: Infinity } : { duration: 0 }}
                >
                  ✊
                </motion.div>
              </div>
            )}
          </motion.div>
          {stage === 'pack' && (
            <motion.div
              className="text-sm font-bold uppercase tracking-widest text-orange-400"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.6, repeat: Infinity }}
            >
              Swipe the gold line to rip
            </motion.div>
          )}
        </div>
      )}

      {/* ---------- REVEAL STAGE ---------- */}
      {stage === 'reveal' && (
        <div className="flex flex-1 flex-col items-center overflow-y-auto p-3">
          <div className="my-2 text-[11px] uppercase tracking-widest text-slate-400">
            Tap each card to flip it
          </div>
          <div className="grid w-full max-w-md grid-cols-2 gap-3 pb-4">
            {cards.map((card, i) => {
              const isFlipped = flipped.has(i)
              const style = RARITY_STYLE[card.rarity] || RARITY_STYLE.common
              return (
                <motion.div
                  key={i}
                  className={cn('relative aspect-[5/7]', i === 0 && 'col-span-2 mx-auto w-[min(52vw,210px)]')}
                  style={{ perspective: 900 }}
                  initial={{ opacity: 0, y: 26 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.12 }}
                  onClick={() => flip(i)}
                >
                  <motion.div
                    className={cn('relative h-full w-full', isFlipped && style.glow)}
                    style={{ transformStyle: 'preserve-3d' }}
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.65, ease: [0.2, 0.7, 0.3, 1.05] }}
                  >
                    {/* back */}
                    <div
                      className="absolute inset-0 flex items-center justify-center rounded-xl border-2 border-yellow-400/45 bg-gradient-to-br from-teal-800 to-slate-900"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <div className="text-5xl opacity-90">🦆</div>
                    </div>
                    {/* front */}
                    <div
                      className="absolute inset-0"
                      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                      <DuckCard card={card} size="sm" className="h-full" />
                    </div>
                  </motion.div>
                  {burstAt === i && isFlipped && <ConfettiBurst mythic={card.rarity === 'mythic'} />}
                </motion.div>
              )
            })}
          </div>
          <AnimatePresence>
            {allFlipped && (
              <motion.button
                className="mb-4 rounded-2xl bg-gradient-to-b from-yellow-400 to-amber-500 px-8 py-3.5 text-base font-black uppercase tracking-wide text-amber-950 shadow-[0_5px_0_#92650a,0_10px_20px_rgba(0,0,0,.4)] active:translate-y-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={onDone}
              >
                Add to Collection
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
