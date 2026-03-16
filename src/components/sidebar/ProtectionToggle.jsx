import React from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, ShieldOff } from 'lucide-react'
import { useAppContext } from '../../context/AppContext'
import { useProtectionTheme } from '../../hooks/useProtectionTheme'
import { PulsingDot } from '../shared/PulsingDot'

export function ProtectionToggle({ collapsed }) {
  const { dispatch } = useAppContext()
  const theme = useProtectionTheme()

  const toggle = () => dispatch({ type: 'TOGGLE_PROTECTION' })

  if (collapsed) {
    return (
      <div className="px-2 py-3 border-y border-white/10 flex justify-center">
        <button
          onClick={toggle}
          className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-500
            ${theme.isProtected ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-red-500/40 bg-red-500/10'}
          `}
          aria-label="Toggle protection"
          title={theme.isProtected ? 'Protected — click to disable' : 'Unprotected — click to enable'}
        >
          {theme.isProtected ? (
            <ShieldCheck size={16} className="text-emerald-400" strokeWidth={2.5} />
          ) : (
            <ShieldOff size={16} className="text-red-400" strokeWidth={2.5} />
          )}
        </button>
      </div>
    )
  }

  return (
    <div className="px-3 py-4 border-y border-white/10">
      {/* Label row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <PulsingDot size="sm" />
          <span className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase">
            Protection
          </span>
        </div>
        <span className={`text-[10px] font-bold tracking-wider transition-colors duration-500 ${theme.primaryText}`}>
          {theme.isProtected ? 'ON' : 'OFF'}
        </span>
      </div>

      {/* Toggle track */}
      <button
        onClick={toggle}
        className={`relative w-full h-12 rounded-xl border transition-all duration-500 overflow-hidden
          ${theme.isProtected
            ? 'border-emerald-500/40 bg-emerald-500/10'
            : 'border-red-500/40 bg-red-500/10'
          }
        `}
        aria-label="Toggle protection"
      >
        {/* Background shimmer */}
        <motion.div
          className="absolute inset-0"
          animate={{
            background: theme.isProtected
              ? 'linear-gradient(90deg, rgba(52,211,153,0.05) 0%, rgba(59,130,246,0.05) 100%)'
              : 'linear-gradient(90deg, rgba(239,68,68,0.05) 0%, rgba(234,88,12,0.05) 100%)',
          }}
          transition={{ duration: 0.5 }}
        />

        {/* Thumb */}
        <motion.div
          className={`absolute top-1.5 h-9 w-9 rounded-lg flex items-center justify-center shadow-lg transition-colors duration-500
            ${theme.isProtected ? 'bg-emerald-500' : 'bg-red-500'}
          `}
          animate={{ left: theme.isProtected ? 'calc(100% - 42px)' : '6px' }}
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        >
          {theme.isProtected ? (
            <ShieldCheck size={16} className="text-black" strokeWidth={2.5} />
          ) : (
            <ShieldOff size={16} className="text-white" strokeWidth={2.5} />
          )}
        </motion.div>

        {/* Status label in track */}
        <div
          className={`absolute inset-0 flex items-center transition-all duration-300 ${
            theme.isProtected ? 'justify-start pl-14' : 'justify-end pr-14'
          }`}
        >
          <span className={`text-[10px] font-bold tracking-wider ${theme.primaryText}`}>
            {theme.isProtected ? 'SECURED' : 'VULNERABLE'}
          </span>
        </div>
      </button>
    </div>
  )
}
