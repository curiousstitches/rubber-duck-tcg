'use client'

import { useState } from 'react'
import type { Card as CardType } from '@/types/game'
import { DUCK_TYPES } from '@/data/cards'
import { getDuckEmoji } from '@/lib/duck-emoji'
import { cn } from '@/lib/utils'

const ELEMENT_ICON: Record<string, string> = {
  water: '💧', fire: '🔥', earth: '🌿', wind: '💨', lightning: '⚡',
  ice: '❄️', light: '☀️', dark: '🌙', neutral: '⭐',
}

const FRAME: Record<string, { border: string; plate: string; gem: string; label: string; text: string }> = {
  common: {
    border: 'bg-gradient-to-br from-slate-300 via-slate-500 to-slate-400',
    plate: 'from-slate-800/95 to-slate-900/95',
    gem: 'bg-slate-300', label: 'Common', text: 'text-slate-200',
  },
  rare: {
    border: 'bg-gradient-to-br from-sky-300 via-blue-600 to-cyan-400',
    plate: 'from-slate-800/95 to-blue-950/95',
    gem: 'bg-sky-400', label: 'Rare', text: 'text-sky-200',
  },
  epic: {
    border: 'bg-gradient-to-br from-fuchsia-300 via-purple-600 to-violet-400',
    plate: 'from-slate-800/95 to-purple-950/95',
    gem: 'bg-fuchsia-400', label: 'Epic', text: 'text-fuchsia-200',
  },
  legendary: {
    border: 'bg-gradient-to-br from-yellow-200 via-amber-500 to-yellow-400',
    plate: 'from-amber-950/95 to-slate-950/95',
    gem: 'bg-yellow-400', label: 'Legendary', text: 'text-yellow-200',
  },
  mythic: {
    border: 'bg-[linear-gradient(135deg,#F472B6,#FBBF24,#34D399,#60A5FA,#A78BFA,#F472B6)]',
    plate: 'from-fuchsia-950/95 to-slate-950/95',
    gem: 'bg-gradient-to-br from-pink-400 to-purple-500', label: 'Mythic', text: 'text-pink-200',
  },
}

function duckMeta(duckType: string) {
  return DUCK_TYPES.find(d => d.id === duckType)
}

interface DuckCardProps {
  card: CardType
  size?: 'sm' | 'lg'
  className?: string
}

export function DuckCard({ card, size = 'sm', className }: DuckCardProps) {
  const [imgFailed, setImgFailed] = useState(false)
  const frame = FRAME[card.rarity] || FRAME.common
  const meta = duckMeta(card.duckType)
  const element = meta?.element || 'neutral'
  const premium = card.rarity === 'legendary' || card.rarity === 'mythic'
  const lg = size === 'lg'

  return (
    <div
      className={cn(
        'rounded-2xl p-[3px] shadow-xl',
        frame.border,
        card.rarity === 'legendary' && 'glow-legendary',
        card.rarity === 'mythic' && 'glow-mythic',
        className
      )}
    >
      <div className={cn('flex h-full w-full flex-col overflow-hidden rounded-[13px] bg-gradient-to-b', frame.plate)}>
        {/* name bar */}
        <div className="flex items-center justify-between gap-1 px-2 pt-1.5 pb-1">
          <div className={cn('truncate font-extrabold text-white drop-shadow-md', lg ? 'text-base' : 'text-[11px]')}>
            {card.name}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <span className={cn(lg ? 'text-base' : 'text-[11px]')}>{ELEMENT_ICON[element]}</span>
            <span className={cn('font-black text-white drop-shadow', lg ? 'text-sm' : 'text-[10px]')}>
              {card.hp}<span className="ml-0.5 font-bold text-white/70">HP</span>
            </span>
          </div>
        </div>

        {/* art window */}
        <div className={cn('relative mx-1.5 overflow-hidden rounded-lg ring-1 ring-white/25', lg ? 'aspect-square' : 'aspect-[5/4]')}>
          {!imgFailed ? (
            <img
              src={card.image}
              alt={card.name}
              className="h-full w-full object-cover"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-700 text-4xl">
              {getDuckEmoji(card.duckType)}
            </div>
          )}
          {(card.foil || card.holographic || card.variant === 'shiny') && <div className="holo-overlay" />}
          {premium && <div className="foil-sweep" />}
          {card.variant !== 'normal' && (
            <span className="absolute left-1 top-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
              {card.variant === 'shiny' ? '✨ Shiny' : '💎 Glossy'}
            </span>
          )}
          {card.evolutionStage > 0 && (
            <span className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[8px] font-bold text-yellow-300 backdrop-blur-sm">
              {'★'.repeat(Math.min(card.evolutionStage, 3))} EVO
            </span>
          )}
        </div>

        {/* stat plates */}
        <div className={cn('mx-1.5 mt-1.5 grid grid-cols-3 gap-1', lg ? 'text-[11px]' : 'text-[8px]')}>
          {[
            ['ATK', card.attack],
            ['DEF', card.defense],
            ['SPD', card.speed],
          ].map(([label, val]) => (
            <div key={label} className="rounded-md bg-black/35 px-1 py-0.5 text-center ring-1 ring-white/10">
              <span className="font-bold text-white/55">{label} </span>
              <span className="font-black text-white">{val}</span>
            </div>
          ))}
        </div>

        {/* ability plate (large size only) */}
        {lg && meta && (
          <div className="mx-1.5 mt-1.5 rounded-md bg-black/30 px-2 py-1.5 ring-1 ring-white/10">
            <div className="text-[11px] font-extrabold text-yellow-200">{meta.ability}</div>
            <div className="mt-0.5 line-clamp-2 text-[10px] leading-tight text-white/75">{meta.description}</div>
          </div>
        )}

        {/* footer */}
        <div className="flex items-center justify-between px-2 py-1.5">
          <div className="flex items-center gap-1">
            <span className={cn('inline-block rounded-full ring-1 ring-white/40', frame.gem, lg ? 'h-3 w-3' : 'h-2 w-2')} />
            <span className={cn('font-extrabold uppercase tracking-widest', frame.text, lg ? 'text-[10px]' : 'text-[7px]')}>
              {frame.label}
            </span>
          </div>
          {lg && meta && (
            <span className="truncate pl-2 text-[9px] font-semibold text-white/50">{meta.habitat}</span>
          )}
        </div>
      </div>
    </div>
  )
}
