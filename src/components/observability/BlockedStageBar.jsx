// src/components/observability/BlockedStageBar.jsx
import React from 'react'
import { motion } from 'framer-motion'
import { ShieldX } from 'lucide-react'

export function BlockedStageBar({ blockedAtInput = 0, blockedAtOutput = 0 }) {
  const total = blockedAtInput + blockedAtOutput
  if (total === 0) return (
    <div className="flex items-center justify-center h-32 text-slate-700 text-sm">No blocked requests yet</div>
  )

  const inputPct  = Math.round((blockedAtInput  / total) * 100)
  const outputPct = Math.round((blockedAtOutput / total) * 100)

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <ShieldX size={12} className="text-red-400" />
        <span><strong className="text-slate-300">{total}</strong> blocked requests — caught across {blockedAtInput > 0 && blockedAtOutput > 0 ? 'both stages' : 'one stage'}</span>
      </div>

      {/* Input stage bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-400 font-semibold">Blocked at Input Scan</span>
            <span className="text-slate-600">(before LLM)</span>
          </div>
          <span className="font-mono font-bold text-emerald-400">{blockedAtInput}</span>
        </div>
        <div className="h-6 rounded-lg bg-white/[0.04] overflow-hidden">
          <motion.div
            className="h-full rounded-lg bg-emerald-500/70 flex items-center justify-end pr-2"
            initial={{ width: 0 }}
            animate={{ width: `${inputPct}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            {inputPct > 15 && <span className="text-[9px] text-emerald-200 font-bold">{inputPct}%</span>}
          </motion.div>
        </div>
        <div className="text-[9px] text-slate-600">Prompt was dangerous — LLM never called. {inputPct}% of blocked.</div>
      </div>

      {/* Output stage bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-violet-500" />
            <span className="text-slate-400 font-semibold">Blocked at Output Scan</span>
            <span className="text-slate-600">(after LLM)</span>
          </div>
          <span className="font-mono font-bold text-violet-400">{blockedAtOutput}</span>
        </div>
        <div className="h-6 rounded-lg bg-white/[0.04] overflow-hidden">
          <motion.div
            className="h-full rounded-lg bg-violet-500/70 flex items-center justify-end pr-2"
            initial={{ width: 0 }}
            animate={{ width: `${outputPct}%` }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
          >
            {outputPct > 15 && <span className="text-[9px] text-violet-200 font-bold">{outputPct}%</span>}
          </motion.div>
        </div>
        <div className="text-[9px] text-slate-600">LLM responded unsafely — response suppressed. {outputPct}% of blocked.</div>
      </div>
    </div>
  )
}
