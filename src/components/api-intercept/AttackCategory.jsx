import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Zap, AlertTriangle, Scissors, Database, Terminal, Wrench, Skull } from 'lucide-react'
import { StatusBadge } from '../shared/StatusBadge'

const ICON_MAP = {
  Syringe: Zap,
  Terminal: Terminal,
  Scissors: Scissors,
  Database: Database,
  AlertTriangle: AlertTriangle,
  Wrench: Wrench,
  Skull: Skull,
}

const COLOR_CLASSES = {
  red: { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  orange: { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  yellow: { text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  purple: { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  pink: { text: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
  teal: { text: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20' },
}

// Total attacks helper — supports both flat (attacks[]) and nested (subCategories[]) shapes.
function countAttacks(category) {
  if (Array.isArray(category?.attacks)) return category.attacks.length
  if (Array.isArray(category?.subCategories)) return category.subCategories.reduce((a, sc) => a + (sc.attacks?.length ?? 0), 0)
  return 0
}

// ─── Single attack row (used by both flat and nested modes) ───────────────────
function AttackRow({ attack, index, onSelect }) {
  return (
    <motion.button
      key={attack.id}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.4) }}
      onClick={() => onSelect(attack)}
      className="w-full flex items-start gap-2 p-2 rounded-lg text-left hover:bg-white/5 border border-transparent hover:border-white/10 transition-all duration-150 group"
    >
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-slate-300 group-hover:text-white transition-colors truncate">
          {attack.label}
        </div>
        <div className="text-[10px] text-slate-600 truncate">{attack.technique}</div>
      </div>
      <StatusBadge status={attack.severity} className="flex-shrink-0 mt-0.5" />
    </motion.button>
  )
}

// ─── Nested sub-category accordion ────────────────────────────────────────────
function SubCategory({ subCategory, parentColor, onSelectAttack, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  const colors = COLOR_CLASSES[parentColor] || COLOR_CLASSES.pink
  const count = subCategory.attacks?.length ?? 0

  return (
    <div className={`rounded-md border overflow-hidden transition-colors duration-150 ${open ? 'border-white/10' : 'border-white/5'}`}>
      <button
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-left transition-colors ${open ? 'bg-white/[0.04]' : 'hover:bg-white/[0.03]'}`}
      >
        <span className={`flex-1 text-[11px] font-semibold ${open ? colors.text : 'text-slate-400'}`}>
          {subCategory.label}
        </span>
        <span className="text-[9px] text-slate-600 mr-1">{count}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }}>
          <ChevronDown size={10} className="text-slate-600" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-1.5 pb-1.5 pt-1 space-y-0.5 bg-black/20">
              {subCategory.attacks?.map((attack, i) => (
                <AttackRow key={attack.id} attack={attack} index={i} onSelect={onSelectAttack} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function AttackCategory({ category, onSelectAttack, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const Icon = ICON_MAP[category.icon] || Zap
  const colors = COLOR_CLASSES[category.color] || COLOR_CLASSES.red
  const isNested = Array.isArray(category.subCategories)
  const total = countAttacks(category)

  return (
    <div className={`rounded-lg border ${isOpen ? colors.border : 'border-white/10'} overflow-hidden transition-colors duration-200`}>
      {/* Category header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all duration-200 ${
          isOpen ? colors.bg : 'hover:bg-white/5'
        }`}
      >
        <div className={`flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center ${colors.bg}`}>
          <Icon size={12} className={colors.text} />
        </div>
        <span className={`flex-1 text-xs font-semibold ${isOpen ? colors.text : 'text-slate-400'} transition-colors`}>
          {category.label}
        </span>
        {category.badge && (
          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${colors.bg} ${colors.text} mr-1`}>
            {category.badge}
          </span>
        )}
        <span className="text-[10px] text-slate-600 mr-1">{total}</span>
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={12} className="text-slate-500" />
        </motion.span>
      </button>

      {/* Body — flat attacks list OR nested sub-categories */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className={`pb-2 ${isNested ? 'px-2 pt-2 space-y-1 bg-black/30' : 'px-2 space-y-1 bg-black/20'}`}>
              {isNested
                ? category.subCategories.map(sc => (
                    <SubCategory
                      key={sc.id}
                      subCategory={sc}
                      parentColor={category.color}
                      onSelectAttack={onSelectAttack}
                    />
                  ))
                : category.attacks?.map((attack, i) => (
                    <AttackRow key={attack.id} attack={attack} index={i} onSelect={onSelectAttack} />
                  ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
