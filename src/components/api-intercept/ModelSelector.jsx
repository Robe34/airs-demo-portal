import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Loader2, CheckCircle2, AlertCircle, RefreshCw, Cpu } from 'lucide-react'
import { useProtectionTheme } from '../../hooks/useProtectionTheme'

const TABS = [
  {
    id: 'vertex',
    label: 'Vertex AI',
    sublabel: 'Google Cloud',
    logo: '/logo-gcp.png',
    // brand colors for glow/gradient
    gradient: 'from-blue-500/20 via-green-500/10 to-red-500/20',
    glow: '0 0 20px rgba(66,133,244,0.35)',
    activeBorder: 'rgba(66,133,244,0.5)',
    activeText: '#4285F4',
  },
  {
    id: 'bedrock',
    label: 'Bedrock',
    sublabel: 'Amazon Web Services',
    logo: '/logo-aws.png',
    gradient: 'from-orange-500/20 via-yellow-500/10 to-orange-400/20',
    glow: '0 0 20px rgba(255,153,0,0.35)',
    activeBorder: 'rgba(255,153,0,0.5)',
    activeText: '#FF9900',
  },
  {
    id: 'azure',
    label: 'Azure OpenAI',
    sublabel: 'Microsoft Azure',
    logo: '/logo-azure.png',
    gradient: 'from-blue-600/20 via-cyan-500/10 to-blue-400/20',
    glow: '0 0 20px rgba(0,120,212,0.35)',
    activeBorder: 'rgba(0,120,212,0.5)',
    activeText: '#0078D4',
  },
]

const STATUS_STYLE = {
  available:    { text: 'text-emerald-400', dot: 'bg-emerald-400' },
  experimental: { text: 'text-yellow-400',  dot: 'bg-yellow-400' },
  legacy:       { text: 'text-slate-500',   dot: 'bg-slate-500' },
  unknown:      { text: 'text-slate-600',   dot: 'bg-slate-600' },
}

export function ModelSelector({ backend, model, onBackendChange, onModelChange }) {
  const theme = useProtectionTheme()
  const [open, setOpen] = useState(false)
  const [vertexModels, setVertexModels] = useState([])
  const [bedrockModels, setBedrockModels] = useState([])
  const [azureModels, setAzureModels] = useState([])
  const [loading, setLoading] = useState({ vertex: false, bedrock: false, azure: false })
  const [errors, setErrors] = useState({ vertex: null, bedrock: null, azure: null })
  const [filter, setFilter] = useState('')
  const [hoveredTab, setHoveredTab] = useState(null)
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const fetchModels = async (provider) => {
    setLoading(prev => ({ ...prev, [provider]: true }))
    setErrors(prev => ({ ...prev, [provider]: null }))
    try {
      const res = await fetch(`/api/models/${provider}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load models')
      if (provider === 'vertex') setVertexModels(data.models ?? [])
      else if (provider === 'bedrock') setBedrockModels(data.models ?? [])
      else setAzureModels(data.models ?? [])
    } catch (err) {
      setErrors(prev => ({ ...prev, [provider]: err.message }))
    } finally {
      setLoading(prev => ({ ...prev, [provider]: false }))
    }
  }

  useEffect(() => {
    fetchModels('vertex')
    fetchModels('bedrock')
    fetchModels('azure')
  }, [])

  const currentModels = backend === 'vertex' ? vertexModels : backend === 'azure' ? azureModels : bedrockModels
  const isLoading = loading[backend]
  const error = errors[backend]
  const activeTab = TABS.find(t => t.id === backend)

  const filtered = currentModels.filter(m =>
    m.label?.toLowerCase().includes(filter.toLowerCase()) ||
    m.id?.toLowerCase().includes(filter.toLowerCase()) ||
    m.provider?.toLowerCase().includes(filter.toLowerCase())
  )

  const activeModel = currentModels.find(m => m.id === model) ?? { id: model, label: model }

  return (
    <div className="relative" ref={panelRef}>
      <div className="space-y-2">

        {/* ── Provider tabs ─────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-1.5">
          {TABS.map(tab => {
            const isActive = backend === tab.id
            const isHovered = hoveredTab === tab.id
            return (
              <motion.button
                key={tab.id}
                onClick={() => { onBackendChange(tab.id); setFilter('') }}
                onHoverStart={() => setHoveredTab(tab.id)}
                onHoverEnd={() => setHoveredTab(null)}
                whileTap={{ scale: 0.97 }}
                className="relative flex flex-col items-center justify-center gap-1.5 px-2 py-3 rounded-xl overflow-hidden"
                style={{
                  background: isActive
                    ? `linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))`
                    : isHovered
                      ? 'rgba(255,255,255,0.04)'
                      : 'rgba(0,0,0,0.25)',
                  border: `1px solid ${isActive ? tab.activeBorder : 'rgba(255,255,255,0.07)'}`,
                  boxShadow: isActive ? tab.glow : 'none',
                  transition: 'all 0.25s ease',
                }}
              >
                {/* Brand gradient wash when active */}
                {isActive && (
                  <motion.div
                    layoutId="tab-wash"
                    className={`absolute inset-0 bg-gradient-to-br ${tab.gradient} opacity-60`}
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}

                {/* Shimmer on hover */}
                <AnimatePresence>
                  {isHovered && !isActive && (
                    <motion.div
                      initial={{ x: '-100%', opacity: 0 }}
                      animate={{ x: '100%', opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"
                    />
                  )}
                </AnimatePresence>

                <img
                  src={tab.logo}
                  alt={tab.label}
                  className="relative z-10 h-5 w-auto object-contain"
                  style={{
                    opacity: isActive ? 1 : 0.45,
                    filter: isActive ? 'none' : 'grayscale(30%)',
                    transition: 'all 0.2s ease',
                  }}
                />
                <span
                  className="relative z-10 text-[10px] font-semibold leading-tight text-center"
                  style={{
                    color: isActive ? tab.activeText : 'rgb(100,116,139)',
                    transition: 'color 0.2s ease',
                  }}
                >
                  {tab.label}
                </span>
              </motion.button>
            )
          })}
        </div>

        {/* ── Model picker trigger ───────────────────────────────────── */}
        <motion.button
          onClick={() => setOpen(o => !o)}
          whileTap={{ scale: 0.99 }}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left overflow-hidden relative"
          style={{
            background: open
              ? `linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))`
              : 'rgba(0,0,0,0.3)',
            border: `1px solid ${open ? (activeTab?.activeBorder ?? 'rgba(255,255,255,0.15)') : 'rgba(255,255,255,0.08)'}`,
            boxShadow: open ? activeTab?.glow : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <Cpu size={11} style={{ color: activeTab?.activeText ?? '#94a3b8', flexShrink: 0 }} />
          <span className="flex-1 text-[11px] font-mono text-slate-300 truncate">
            {activeModel.label || activeModel.id}
          </span>
          {isLoading ? (
            <Loader2 size={10} className="animate-spin text-slate-500 flex-shrink-0" />
          ) : (
            <motion.div
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={10} className="text-slate-500" />
            </motion.div>
          )}
        </motion.button>
      </div>

      {/* ── Dropdown panel ────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-xl overflow-hidden"
            style={{
              background: 'rgba(8,12,20,0.97)',
              border: `1px solid ${activeTab?.activeBorder ?? 'rgba(255,255,255,0.1)'}`,
              boxShadow: `${activeTab?.glow ?? ''}, 0 25px 50px rgba(0,0,0,0.7)`,
              backdropFilter: 'blur(24px)',
              minWidth: '230px',
            }}
          >
            {/* Header strip with provider color */}
            <div
              className="flex items-center gap-2 px-3 py-2 border-b"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <img src={activeTab?.logo} alt="" className="h-3.5 w-auto object-contain opacity-70" />
              <input
                autoFocus
                value={filter}
                onChange={e => setFilter(e.target.value)}
                placeholder={`Filter ${activeTab?.label} models…`}
                className="flex-1 bg-transparent text-xs text-slate-300 placeholder-slate-600 outline-none"
              />
              <button
                onClick={() => fetchModels(backend)}
                disabled={isLoading}
                className="text-slate-600 hover:text-slate-400 transition-colors disabled:opacity-40"
                title="Refresh"
              >
                <RefreshCw size={10} className={isLoading ? 'animate-spin' : ''} />
              </button>
            </div>

            {/* Model list */}
            <div className="max-h-64 overflow-y-auto">
              {isLoading && filtered.length === 0 ? (
                <div className="flex items-center justify-center gap-2 py-8 text-slate-500">
                  <Loader2 size={12} className="animate-spin" />
                  <span className="text-xs">Loading models…</span>
                </div>
              ) : error ? (
                <div className="px-3 py-5 text-center">
                  <AlertCircle size={16} className="text-red-400 mx-auto mb-1.5" />
                  <p className="text-[10px] text-red-400 mb-2">{error}</p>
                  <button
                    onClick={() => fetchModels(backend)}
                    className="text-[10px] text-slate-500 hover:text-slate-300 underline"
                  >
                    Retry
                  </button>
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-600">No models match</div>
              ) : (
                filtered.map((m, i) => {
                  const isSelected = m.id === model
                  const ss = STATUS_STYLE[m.status] ?? STATUS_STYLE.unknown
                  return (
                    <motion.button
                      key={m.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.018, duration: 0.15 }}
                      onClick={() => { onModelChange(m.id); setOpen(false); setFilter('') }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors duration-100"
                      style={{
                        background: isSelected
                          ? `linear-gradient(90deg, ${activeTab?.activeBorder?.replace('0.5', '0.12') ?? 'rgba(255,255,255,0.05)'}, transparent)`
                          : undefined,
                        borderLeft: isSelected ? `2px solid ${activeTab?.activeText ?? '#94a3b8'}` : '2px solid transparent',
                      }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = '' }}
                    >
                      {/* Status dot */}
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ss.dot}`} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-xs font-medium truncate"
                            style={{ color: isSelected ? (activeTab?.activeText ?? '#e2e8f0') : '#cbd5e1' }}
                          >
                            {m.label ?? m.id}
                          </span>
                          {m.provider && (
                            <span className="text-[9px] text-slate-600 flex-shrink-0 font-mono">{m.provider}</span>
                          )}
                        </div>
                        <span className="text-[9px] font-mono text-slate-600 truncate block">{m.id}</span>
                      </div>

                      {isSelected && (
                        <CheckCircle2 size={11} className="flex-shrink-0" style={{ color: activeTab?.activeText }} />
                      )}
                    </motion.button>
                  )
                })
              )}
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-between px-3 py-1.5 border-t"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <span className="text-[9px] text-slate-600">
                {filtered.length} model{filtered.length !== 1 ? 's' : ''}
              </span>
              <span className="text-[9px]" style={{ color: activeTab?.activeText ?? '#64748b', opacity: 0.7 }}>
                {activeTab?.sublabel}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
