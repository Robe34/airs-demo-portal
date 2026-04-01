import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, ShieldX, ShieldCheck, Zap, AlertTriangle,
  Clock, Activity, Cpu, Copy, User, Search, CheckCircle,
} from 'lucide-react'

// ─── CopyButton ───────────────────────────────────────────────────────────────
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <button onClick={copy} className="ml-1 text-slate-600 hover:text-slate-400 transition-colors flex-shrink-0" title="Copy">
      {copied ? <span className="text-[8px] text-emerald-400">✓</span> : <Copy size={10} />}
    </button>
  )
}

// ─── Build spans from telemetry (mirrors server.js persistTrace logic) ────────
function buildSpans(telemetry) {
  const timing   = telemetry.timing ?? {}
  const airsInMs  = timing.airs_input_scan_ms  ?? 0
  const llmMs     = timing.llm_ms              ?? 0
  const airsOutMs = timing.airs_output_scan_ms ?? 0
  const verdict   = telemetry.summary?.verdict ?? 'DIRECT'
  const llm       = telemetry.llm ?? {}

  const spans = []
  let cursor = 0

  spans.push({ name: 'user_prompt_received', latency_ms: 0, status: 'success', metadata: null })

  if (airsInMs > 0) {
    spans.push({
      name: 'airs_input_scan',
      latency_ms: airsInMs,
      status: verdict === 'BLOCKED' && !llmMs ? 'blocked' : 'success',
      metadata: telemetry.inputScan ? {
        scan_id: telemetry.inputScan.scan_id,
        category: telemetry.inputScan.category,
        action: telemetry.inputScan.action,
      } : null,
    })
    cursor += airsInMs
  }

  if (llmMs > 0) {
    spans.push({
      name: 'llm_inference',
      latency_ms: llmMs,
      status: 'success',
      metadata: { model: llm.model, tokens_in: llm.tokens_in, tokens_out: llm.tokens_out },
    })
    cursor += llmMs
  }

  if (airsOutMs > 0) {
    spans.push({
      name: 'airs_output_scan',
      latency_ms: airsOutMs,
      status: verdict === 'BLOCKED' && llmMs ? 'blocked' : 'success',
      metadata: telemetry.outputScan ? {
        scan_id: telemetry.outputScan.scan_id,
        category: telemetry.outputScan.category,
        action: telemetry.outputScan.action,
      } : null,
    })
  }

  spans.push({ name: 'response_delivered', latency_ms: 0, status: verdict === 'BLOCKED' ? 'blocked' : 'success', metadata: null })

  return spans
}

// ─── Span config (mirrors TraceDrawer SPAN_CFG) ───────────────────────────────
const SPAN_CFG = {
  user_prompt_received: {
    label: 'User Prompt', icon: <User size={18} className="text-slate-400" />,
    dotBg: 'bg-slate-100 border-slate-300', bar: 'bg-slate-400', text: 'text-slate-600',
    cardBg: 'bg-white/[0.06] border-white/[0.10]', line: '#94a3b8', badge: 'received',
    detail: () => 'Message sent to the protected LLM endpoint',
  },
  airs_input_scan: {
    label: 'AIRS Input Scan', icon: <Search size={18} className="text-emerald-500" />,
    dotBg: 'bg-emerald-50 border-emerald-300', bar: 'bg-emerald-500', text: 'text-emerald-600',
    cardBg: 'bg-emerald-500/[0.06] border-emerald-500/20', line: '#34d399', badge: null,
    detail: (span) => {
      const m = span.metadata ?? {}
      const parts = []
      if (m.action) parts.push(`action: ${m.action}`)
      if (m.category) parts.push(m.category)
      if (m.scan_id) parts.push(`scan: ${m.scan_id.slice(0, 8)}…`)
      return parts.join(' · ') || 'Prompt scanned · Prisma AIRS'
    },
  },
  llm_inference: {
    label: 'LLM Inference', icon: <Cpu size={18} className="text-blue-400" />,
    dotBg: 'bg-blue-50 border-blue-300', bar: 'bg-blue-500', text: 'text-blue-600',
    cardBg: 'bg-blue-500/[0.06] border-blue-500/20', line: '#60a5fa', badge: null,
    detail: (span) => {
      const m = span.metadata ?? {}
      const parts = []
      if (m.model) parts.push(m.model)
      if (m.tokens_in != null && m.tokens_out != null) parts.push(`${m.tokens_in} in / ${m.tokens_out} out tokens`)
      return parts.join(' · ') || 'LLM processing'
    },
  },
  airs_output_scan: {
    label: 'AIRS Output Scan', icon: <Search size={18} className="text-violet-500" />,
    dotBg: 'bg-violet-50 border-violet-300', bar: 'bg-violet-500', text: 'text-violet-600',
    cardBg: 'bg-violet-500/[0.06] border-violet-500/20', line: '#a78bfa', badge: null,
    detail: (span) => {
      const m = span.metadata ?? {}
      const parts = []
      if (m.action) parts.push(`action: ${m.action}`)
      if (m.category) parts.push(m.category)
      return parts.join(' · ') || 'Response scanned · Prisma AIRS'
    },
  },
  response_delivered: {
    label: 'Response Delivered', icon: <CheckCircle size={18} className="text-teal-500" />,
    dotBg: 'bg-teal-50 border-teal-300', bar: 'bg-teal-500', text: 'text-teal-600',
    cardBg: 'bg-teal-500/[0.06] border-teal-500/20', line: '#14b8a6', badge: null,
    detail: (span) => span.status === 'blocked' ? 'Blocked — response suppressed' : 'Clean response returned to user',
  },
}

// ─── FlowNode ─────────────────────────────────────────────────────────────────
function FlowNode({ span, totalMs, isLast }) {
  const cfg = SPAN_CFG[span.name] ?? {
    label: span.name, icon: null,
    dotBg: 'bg-slate-100 border-slate-300', bar: 'bg-slate-400', text: 'text-slate-600',
    cardBg: 'bg-white/[0.06] border-white/[0.10]', line: '#94a3b8', badge: null,
    detail: () => '',
  }
  const isBlocked = span.status === 'blocked'
  const barPct = totalMs > 0 && span.latency_ms > 0
    ? Math.max((span.latency_ms / totalMs) * 100, 2)
    : 0
  const detail = typeof cfg.detail === 'function' ? cfg.detail(span) : cfg.detail

  return (
    <div className="flex gap-3 items-stretch">
      {/* Icon circle + connector */}
      <div className="flex flex-col items-center flex-shrink-0" style={{ width: 44 }}>
        <div className={`w-11 h-11 rounded-full border-2 flex items-center justify-center flex-shrink-0 z-10 ${cfg.dotBg} ${isBlocked ? 'ring-2 ring-red-400' : ''}`}>
          {cfg.icon}
        </div>
        {!isLast && (
          <div className="w-0.5 flex-1 mt-1" style={{ background: cfg.line, opacity: 0.4, minHeight: 16 }} />
        )}
      </div>

      {/* Card */}
      <div className={`flex-1 mb-3 p-3 rounded-xl border ${cfg.cardBg}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[12px] font-bold ${cfg.text}`}>{cfg.label}</span>
              {cfg.badge && <span className="text-[10px] text-slate-400">{cfg.badge}</span>}
              {isBlocked && (
                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-red-100 border border-red-300 text-slate-900 text-[8px] font-black">
                  <AlertTriangle size={7} />BLOCKED
                </span>
              )}
            </div>
            {detail && (
              <div className="text-[11px] text-slate-400 mt-1 leading-relaxed font-medium">{detail}</div>
            )}
            {span.metadata?.scan_id && (
              <span className="flex items-center gap-1 mt-0.5">
                <span className="text-[9px] font-mono text-slate-500 truncate">{span.metadata.scan_id.slice(0, 16)}…</span>
                <CopyButton text={span.metadata.scan_id} />
              </span>
            )}
          </div>
          {span.latency_ms > 0 && (
            <span className={`text-[11px] font-mono font-bold flex-shrink-0 ${cfg.text}`}>
              {span.latency_ms.toLocaleString()}ms
            </span>
          )}
        </div>

        {barPct > 0 && (
          <div className="h-1.5 rounded-full bg-black/[0.06] overflow-hidden mt-2.5">
            <motion.div
              className={`h-full rounded-full ${cfg.bar} opacity-70`}
              initial={{ width: 0 }}
              animate={{ width: `${barPct}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── PipelineFlow ─────────────────────────────────────────────────────────────
function PipelineFlow({ spans, totalMs }) {
  if (!spans?.length) return null
  return (
    <div>
      {spans.map((span, i) => (
        <FlowNode key={`${span.name}-${i}`} span={span} totalMs={totalMs} isLast={i === spans.length - 1} />
      ))}
      <div className="flex items-center justify-between text-[11px] pt-3 mt-1 border-t border-white/[0.08]">
        <span className="text-slate-400 font-bold">Total round-trip</span>
        <span className="font-mono font-bold text-slate-300">{totalMs.toLocaleString()}ms</span>
      </div>
    </div>
  )
}

// ─── VerdictBanner ────────────────────────────────────────────────────────────
function VerdictBanner({ telemetry }) {
  const verdict   = telemetry.summary?.verdict ?? 'DIRECT'
  const isBlocked = verdict === 'BLOCKED'
  const isDirect  = verdict === 'DIRECT'
  const threats   = telemetry.summary?.threats_detected ?? []
  const category  = telemetry.summary?.category ?? 'UNKNOWN'
  const modelLabel = telemetry.llm?.model ?? telemetry.summary?.model ?? '—'
  const profile    = telemetry.summary?.profile ?? null

  const styles = isBlocked
    ? { wrap: 'bg-red-500/10 border-red-500/30', icon: <ShieldX size={22} className="text-red-400" />, iconBg: 'bg-red-500/20', text: 'text-red-300', badge: 'bg-red-500/20 border-red-500/30 text-red-400' }
    : isDirect
    ? { wrap: 'bg-white/[0.04] border-white/[0.08]', icon: <Zap size={22} className="text-slate-400" />, iconBg: 'bg-white/[0.06]', text: 'text-slate-300', badge: 'bg-white/[0.06] border-white/[0.08] text-slate-500' }
    : { wrap: 'bg-emerald-500/10 border-emerald-500/30', icon: <ShieldCheck size={22} className="text-emerald-400" />, iconBg: 'bg-emerald-500/20', text: 'text-emerald-300', badge: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' }

  return (
    <div className={`p-4 rounded-2xl border ${styles.wrap}`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${styles.iconBg}`}>
          {styles.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className={`text-base font-black tracking-wide ${styles.text}`}>{verdict}</div>
          <div className="text-[11px] text-slate-400 mt-0.5 truncate font-medium">
            {modelLabel}{profile ? ` · ${profile}` : ''}
          </div>
        </div>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex-shrink-0 ${styles.badge}`}>
          {category.toUpperCase()}
        </span>
      </div>
      {threats.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-white/[0.06]">
          {threats.map(t => (
            <span key={t} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-100 border border-red-300 text-[9px] font-black text-slate-900 uppercase tracking-wide">
              <AlertTriangle size={7} />{t.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── MetricsStrip ─────────────────────────────────────────────────────────────
function MetricsStrip({ telemetry }) {
  const timing  = telemetry.timing ?? {}
  const airsMs  = (timing.airs_input_scan_ms ?? 0) + (timing.airs_output_scan_ms ?? 0)
  const totalMs = timing.total_ms ?? null
  const llmMs   = timing.llm_ms ?? null

  const cards = [
    totalMs != null && { label: 'Total Time',    value: totalMs, sub: 'end-to-end',  color: 'text-slate-300',   icon: Clock },
    llmMs   != null && { label: 'LLM Latency',   value: llmMs,   sub: 'inference',   color: 'text-blue-400',    icon: Cpu },
    airsMs  > 0     && { label: 'AIRS Overhead', value: airsMs,  sub: 'total scans', color: 'text-emerald-400', icon: Activity },
  ].filter(Boolean)

  if (!cards.length) return null

  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cards.length}, 1fr)` }}>
      {cards.map(({ label, value, sub, color, icon: Icon }) => (
        <div key={label} className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08]">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Icon size={11} className={color} />
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">{label}</span>
          </div>
          <div className={`text-xl font-black font-mono leading-none ${color}`}>
            {value.toLocaleString()}
            <span className="text-xs font-normal text-slate-500 ml-1">ms</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-medium">{sub}</div>
        </div>
      ))}
    </div>
  )
}

// ─── TokenBar ─────────────────────────────────────────────────────────────────
function TokenBar({ telemetry }) {
  const tokens_in  = telemetry.llm?.tokens_in  ?? null
  const tokens_out = telemetry.llm?.tokens_out ?? null
  const llm_ms     = telemetry.llm?.latency_ms ?? null

  if (tokens_in == null && tokens_out == null) return null

  const total  = (tokens_in ?? 0) + (tokens_out ?? 0)
  const inPct  = total > 0 ? ((tokens_in ?? 0) / total) * 100 : 0
  const outPct = total > 0 ? ((tokens_out ?? 0) / total) * 100 : 0
  const tps    = (tokens_out && llm_ms) ? Math.round((tokens_out / llm_ms) * 1000) : null

  return (
    <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold text-slate-400">Token distribution</span>
        <span className="text-[11px] font-mono font-bold text-slate-300">{total.toLocaleString()} total</span>
      </div>
      <div className="flex h-3 rounded-lg overflow-hidden bg-black/[0.06] gap-px">
        <motion.div className="bg-blue-500/80" initial={{ width: 0 }} animate={{ width: `${inPct}%` }} transition={{ duration: 0.5, ease: 'easeOut' }} />
        <motion.div className="bg-violet-500/80" initial={{ width: 0 }} animate={{ width: `${outPct}%` }} transition={{ duration: 0.5, ease: 'easeOut', delay: 0.05 }} />
      </div>
      <div className="flex items-center gap-4 mt-2">
        <span className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
          <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" />
          {tokens_in ?? '—'} input tokens
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
          <span className="w-2.5 h-2.5 rounded-sm bg-violet-500 inline-block" />
          {tokens_out ?? '—'} output tokens
        </span>
        {tps != null && <span className="ml-auto text-[10px] font-bold text-slate-400">{tps} tok/s</span>}
      </div>
    </div>
  )
}

// ─── SectionLabel ─────────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{children}</div>
}

// ─── MessageBubble ────────────────────────────────────────────────────────────
function MessageBubble({ text }) {
  return (
    <div className="p-3 rounded-xl border bg-white/[0.03] border-white/[0.06] text-xs text-slate-400 font-mono leading-relaxed">
      <div className="overflow-y-auto max-h-[160px] pr-1 whitespace-pre-wrap break-words">{text}</div>
    </div>
  )
}

// ─── PromptTelemetryDrawer ────────────────────────────────────────────────────
export function PromptTelemetryDrawer({ telemetry, onClose }) {
  React.useEffect(() => {
    if (!telemetry) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [telemetry, onClose])

  const modelLabel  = telemetry?.llm?.model ?? telemetry?.summary?.model ?? null
  const isProtected = !!telemetry?.summary
  const totalMs     = telemetry?.timing?.total_ms ?? 0
  const spans       = telemetry ? buildSpans(telemetry) : []
  const attackMeta  = telemetry?.attackMeta ?? null
  const prompt      = telemetry?.prompt ?? null

  return (
    <AnimatePresence>
      {telemetry && (
        <motion.div
          key="prompt-telemetry-drawer"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed top-0 right-0 bottom-0 w-[560px] bg-white/[0.02] border-l border-white/[0.08] z-50 flex flex-col shadow-2xl backdrop-blur-xl"
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.08] flex-shrink-0">
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-300">Prompt Telemetry</div>
              {modelLabel && (
                <div className="text-[9px] font-mono text-slate-600 mt-0.5">{modelLabel}</div>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center transition-colors"
            >
              <X size={12} className="text-slate-400" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Verdict */}
            <VerdictBanner telemetry={telemetry} />

            {/* Model pill */}
            {modelLabel && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] w-fit">
                <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                <span className="text-[11px] font-semibold text-slate-400">{modelLabel}</span>
              </div>
            )}

            {/* Performance metrics */}
            {isProtected && (
              <div className="space-y-2">
                <SectionLabel>Performance Metrics</SectionLabel>
                <MetricsStrip telemetry={telemetry} />
              </div>
            )}

            {/* Token usage */}
            <div className="space-y-2">
              <SectionLabel>Token Usage</SectionLabel>
              <TokenBar telemetry={telemetry} />
            </div>

            {/* Pipeline flow */}
            <div className="space-y-3">
              <SectionLabel>Pipeline Flow</SectionLabel>
              <PipelineFlow spans={spans} totalMs={totalMs} />
            </div>

            {/* Prompt */}
            {prompt && (
              <div className="space-y-1.5">
                <SectionLabel>Prompt</SectionLabel>
                <MessageBubble text={prompt} />
              </div>
            )}

            {/* Attack label */}
            {attackMeta && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-orange-500/[0.07] border border-orange-500/20">
                <AlertTriangle size={14} className="text-orange-400 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-xs font-bold text-orange-300">{attackMeta.label}</div>
                  <div className="text-[10px] text-orange-500/70 mt-0.5">{attackMeta.severity} severity</div>
                </div>
                <span className="text-[9px] font-bold px-2 py-1 rounded-lg bg-orange-500/20 border border-orange-500/30 text-orange-400 uppercase">
                  {attackMeta.severity}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
