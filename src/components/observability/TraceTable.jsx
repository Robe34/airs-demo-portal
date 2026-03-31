// src/components/observability/TraceTable.jsx
import React from 'react'
import { ShieldX, ShieldCheck, Zap, AlertTriangle } from 'lucide-react'

function VerdictBadge({ verdict }) {
  if (verdict === 'BLOCKED') return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-500/20 border border-red-500/30 text-red-400">
      <ShieldX size={8} /> BLOCKED
    </span>
  )
  if (verdict === 'ALLOWED') return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
      <ShieldCheck size={8} /> ALLOWED
    </span>
  )
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/[0.06] border border-white/[0.08] text-slate-500">
      <Zap size={8} /> DIRECT
    </span>
  )
}

export function TraceTable({ traces, selectedId, onSelect }) {
  if (!traces.length) return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
        <AlertTriangle size={20} className="text-slate-700" />
      </div>
      <p className="text-sm text-slate-600">No traces match the current filters</p>
    </div>
  )

  return (
    <div className="rounded-xl border border-white/[0.08] overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[1fr_120px_90px_80px_80px_100px] gap-3 px-4 py-2.5 bg-white/[0.03] border-b border-white/[0.06]">
        {['Prompt', 'Model', 'Verdict', 'Total', 'LLM', 'Time'].map(h => (
          <span key={h} className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">{h}</span>
        ))}
      </div>
      {/* Rows */}
      {traces.map(trace => (
        <button
          key={trace.id}
          onClick={() => onSelect(trace.id)}
          className={`w-full grid grid-cols-[1fr_120px_90px_80px_80px_100px] gap-3 px-4 py-3 border-b border-white/[0.04] last:border-0 text-left transition-colors hover:bg-white/[0.04] ${selectedId === trace.id ? 'bg-teal-500/[0.07] border-l-2 border-l-teal-500/50' : ''}`}
        >
          <span className="text-xs text-slate-400 truncate pr-2">
            {trace.attack_label
              ? <><span className="text-orange-400 font-semibold mr-1.5">[{trace.attack_label}]</span>{trace.prompt?.slice(0, 60)}{trace.prompt?.length > 60 ? '…' : ''}</>
              : <>{trace.prompt?.slice(0, 80) ?? '—'}{trace.prompt?.length > 80 ? '…' : ''}</>}
          </span>
          <span className="text-[10px] text-slate-500 font-mono truncate">{trace.backend ?? '—'}</span>
          <span><VerdictBadge verdict={trace.verdict} /></span>
          <span className="text-[10px] font-mono text-slate-400">{trace.total_ms != null ? `${trace.total_ms}ms` : '—'}</span>
          <span className="text-[10px] font-mono text-blue-400">{trace.llm_ms != null ? `${trace.llm_ms}ms` : '—'}</span>
          <span className="text-[9px] text-slate-600">{new Date(trace.created_at).toLocaleTimeString()}</span>
        </button>
      ))}
    </div>
  )
}
