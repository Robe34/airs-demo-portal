import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldX, ShieldCheck, Info, RefreshCw, ArrowDownToLine, ArrowUpFromLine, Languages, Copy, Check, Activity, ChevronDown, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useProtectionTheme } from '../../hooks/useProtectionTheme'
import { useAppContext } from '../../context/AppContext'

// ─── Helpers ──────────────────────────────────────────────────────────────────
// Used by AssistantMessage for Hebrew RTL display — do not remove
function isHebrewText(str) {
  return /[\u0590-\u05FF]/.test(str)
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => fallbackCopy(text))
    } else {
      fallbackCopy(text)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  const fallbackCopy = (str) => {
    const el = document.createElement('textarea')
    el.value = str
    el.style.position = 'fixed'
    el.style.opacity = '0'
    document.body.appendChild(el)
    el.focus()
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
  }
  return (
    <button onClick={handleCopy} className="flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity" title="Copy">
      {copied ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
      <span>{copied ? 'Copied' : 'Copy'}</span>
    </button>
  )
}

// ─── System message ───────────────────────────────────────────────────────────
function SystemMessage({ message }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center gap-2 px-4 py-1"
    >
      <div className="h-px flex-1 bg-white/5" />
      <div className="flex items-center gap-1.5">
        <Info size={10} className="text-slate-600" />
        <p className="text-[9px] text-slate-600 italic">{message.content}</p>
      </div>
      <div className="h-px flex-1 bg-white/5" />
    </motion.div>
  )
}

// ─── User bubble (iMessage style) ─────────────────────────────────────────────
const LANGUAGES = [
  { label: 'English',            flag: '🇺🇸' },
  { label: 'Spanish',            flag: '🇪🇸' },
  { label: 'Russian',            flag: '🇷🇺' },
  { label: 'German',             flag: '🇩🇪' },
  { label: 'French',             flag: '🇫🇷' },
  { label: 'Japanese',           flag: '🇯🇵' },
  { label: 'Portuguese',         flag: '🇧🇷' },
  { label: 'Italian',            flag: '🇮🇹' },
  { label: 'Simplified Chinese', flag: '🇨🇳' },
  { label: 'Hebrew',             flag: '🇮🇱' },
]

function UserMessage({ message, onResend, onTranslate, isLoading, isTranslating }) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [openUpward, setOpenUpward] = useState(false)
  const btnRef = useRef(null)
  const isLight = document.documentElement.classList.contains('light')

  useEffect(() => {
    if (!showDropdown) return
    const handler = (e) => {
      if (btnRef.current && !btnRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showDropdown])

  const severityColor = message.attackMeta?.severity === 'critical'
    ? 'bg-red-500/20 text-red-400 border-red-500/30'
    : message.attackMeta?.severity === 'high'
    ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'

  return (
    <motion.div
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="flex flex-col items-end px-4"
    >
      {/* Attack badge */}
      {message.attackMeta && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-1.5"
        >
          <span className="text-[8px] text-slate-500 font-mono tracking-wider">{message.attackMeta.technique}</span>
          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${severityColor}`}>
            {message.attackMeta.severity.toUpperCase()}
          </span>
        </motion.div>
      )}

      {/* Bubble */}
      <div className="relative max-w-[78%]">
        <div
          className="relative px-4 py-3 rounded-[22px] rounded-tr-[5px]"
          style={{
            background: 'rgba(99, 155, 255, 0.13)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(147, 197, 253, 0.18)',
            boxShadow: '0 2px 20px rgba(59,130,246,0.12), inset 0 1px 0 rgba(255,255,255,0.12)',
          }}
        >
          {/* Subtle inner gloss */}
          <div
            className="absolute inset-0 rounded-[22px] rounded-tr-[5px] pointer-events-none"
            style={{ background: 'linear-gradient(150deg, rgba(255,255,255,0.07) 0%, transparent 55%)' }}
          />
          <p
            className="relative leading-relaxed whitespace-pre-wrap break-words"
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              fontSize: '12px',
              color: 'var(--user-bubble-text)',
            }}
          >
            {message.content}
          </p>
        </div>

        {/* Bubble tail */}
        <div
          className="absolute top-0 -right-1"
          style={{
            width: 0, height: 0,
            borderLeft: '8px solid rgba(99,155,255,0.18)',
            borderBottom: '8px solid transparent',
          }}
        />
      </div>

      {/* Action row — always visible */}
      <div className="flex items-center gap-3 mt-1.5 text-[9px] text-slate-500">
        <span className="text-slate-600">{new Date(message.timestamp).toLocaleTimeString()}</span>
        {onResend && (
          <button
            onClick={onResend}
            disabled={isLoading}
            className="flex items-center gap-1 hover:text-slate-300 transition-colors disabled:opacity-30"
            title="Resend"
          >
            <RefreshCw size={9} className={isLoading && !isTranslating ? 'animate-spin' : ''} />
            Resend
          </button>
        )}
        {onTranslate && (
          <div className="relative translate-dropdown-root" ref={btnRef}>
            <button
              onClick={() => {
                if (btnRef.current) {
                  const rect = btnRef.current.getBoundingClientRect()
                  setOpenUpward(rect.bottom > window.innerHeight / 2)
                }
                setShowDropdown(prev => !prev)
              }}
              disabled={isLoading}
              className="flex items-center gap-1 text-blue-400/70 hover:text-blue-300 transition-colors disabled:opacity-30"
              title="Translate message"
            >
              <Languages size={9} className={isTranslating ? 'animate-spin' : ''} />
              Translate
            </button>
            {showDropdown && (
              <div
                className={`absolute right-0 z-50 w-44 rounded-xl shadow-xl overflow-hidden ${
                  openUpward ? 'bottom-full mb-1' : 'top-full mt-1'
                }`}
                style={isLight ? {
                  background: '#ffffff',
                  border: '1px solid rgba(0,48,135,0.14)',
                  boxShadow: '0 8px 24px rgba(0,48,135,0.10)',
                } : {
                  background: 'rgba(15, 20, 35, 0.98)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(16px)',
                }}
              >
                {LANGUAGES.map(({ label, flag }) => (
                  <button
                    key={label}
                    onClick={() => {
                      setShowDropdown(false)
                      onTranslate(message.content, label)
                    }}
                    className="w-full text-left px-3 py-1.5 text-[11px] transition-colors flex items-center gap-2"
                    style={{ color: isLight ? '#1e293b' : '#e2e8f0' }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = isLight ? 'rgba(0,48,135,0.06)' : 'rgba(255,255,255,0.08)'
                      e.currentTarget.style.color = isLight ? '#0f172a' : '#ffffff'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = isLight ? '#1e293b' : '#e2e8f0'
                    }}
                  >
                    <span className="text-[13px]">{flag}</span>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <CopyButton text={message.content} />
      </div>
    </motion.div>
  )
}

// ─── MCP tool name inference (mirrors TelemetrySidebar) ──────────────────────
const MCP_LABEL_TO_TOOL = {
  'Path Traversal via Agent':       'read_file',
  'OS Command Execution via Agent': 'execute_code',
  'Persistent Memory Poisoning':    'set_memory',
  'Tool Shadowing / Override':      'set_memory',
  'PII Exfiltration via File Read': 'read_file',
}

function isMcpMessage(message) {
  const label = message.telemetry?.attackMeta?.label ?? ''
  const tech  = message.telemetry?.attackMeta?.technique ?? ''
  return MCP_LABEL_TO_TOOL[label] != null || tech.toLowerCase().includes('tool') || tech.toLowerCase().includes('memory store')
}

// ─── Copy button for pipeline trace ──────────────────────────────────────────
function TraceCopy({ text }) {
  const [copied, setCopied] = useState(false)
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
      className="opacity-50 hover:opacity-100 transition-opacity flex-shrink-0">
      {copied ? <Check size={9} className="text-emerald-400" /> : <Copy size={9} />}
    </button>
  )
}

// ─── Real pipeline trace — built from message.telemetry (chat or real MCP) ────
function PipelineTrace({ message }) {
  const [open, setOpen] = useState(false)
  const [expandedPayload, setExpandedPayload] = useState(null)
  const { state } = useAppContext()
  const isDark = state.isDark !== false

  const tel      = message.telemetry ?? {}
  const isMcpInvoke = !!tel.isMcpInvoke  // real /api/mcp/invoke path
  const input    = tel.inputScan  ?? null
  const output   = tel.outputScan ?? null
  const timing   = tel.timing     ?? {}
  const llm      = tel.llm        ?? {}
  const meta     = tel.attackMeta ?? null
  const toolName = tel.tool ?? null
  const toolParams = tel.params ?? null
  const toolResult = tel.toolResult ?? null

  if (!input && !timing.total_ms && !isMcpInvoke && message.verdict === 'ERROR') return null

  // ── Always-dark design (code/terminal aesthetic) ──────────────────────────
  const bg         = '#0f1117'
  const headerBg   = '#161b27'
  const border     = 'rgba(255,255,255,0.10)'
  const rowDiv     = 'rgba(255,255,255,0.05)'
  const labelC     = '#6b7280'   // muted grey
  const valueC     = '#e2e8f0'   // near-white
  const monoC      = '#67e8f9'   // cyan
  const codeBg     = '#0d1117'
  const nums       = ['①','②','③','④','⑤','⑥','⑦']
  let   ni         = 0

  // ── Build steps ───────────────────────────────────────────────────────────
  const steps = []
  const inputBlocked = input?.action === 'block'
  const stage1Blocked = isMcpInvoke && tel.stage1?.action === 'block'

  // Step: Prompt / Tool invocation received
  steps.push({
    num: nums[ni++], color: '#94a3b8',
    title: isMcpInvoke ? `MCP Invoke: ${toolName}` : 'Prompt received',
    icon: isMcpInvoke ? '🔧' : '👤',
    rows: [
      meta ? { label: 'attack', value: meta.label } : null,
      meta ? { label: 'technique', value: meta.technique } : null,
      meta ? { label: 'severity', value: meta.severity, accent: meta.severity === 'critical' ? '#f87171' : meta.severity === 'high' ? '#fb923c' : '#facc15' } : null,
      isMcpInvoke && toolParams ? { label: 'params', value: JSON.stringify(toolParams), mono: true } : null,
      { label: 'airsEnabled', value: String(!!(input || isMcpInvoke && tel.stage1)), mono: true },
    ].filter(Boolean),
  })

  // Step: AIRS Input / Stage 1 Scan
  if (input || (isMcpInvoke && tel.stage1)) {
    const rawStage1 = isMcpInvoke ? tel.stage1 : null
    const s = isMcpInvoke
      ? { action: tel.stage1?.action, category: tel.stage1?.category, scan_id: tel.stage1?.scan_id, prompt_detected: tel.stage1?.prompt_detected, latency_ms: tel.stage1?.latencyMs }
      : input
    const threats = Object.entries(s?.prompt_detected ?? {}).filter(([,v]) => v).map(([k]) => k)
    const blocked = s?.action === 'block'
    // Extract tool_event from requestBody (what SCM shows as "Tool Event")
    const toolEvent = (input?.requestBody ?? rawStage1?.requestBody)?.contents?.[0]?.tool_event?.metadata
    const trId = isMcpInvoke ? tel.stage1?.trId : (input?.tr_id)
    // DLP-masked content (only present when AIRS profile is configured to mask)
    const maskedIn = !isMcpInvoke ? (input?.prompt_masked_data ?? input?.rawResponse?.prompt_masked_data ?? null) : null
    const maskedPreviewIn = maskedIn?.data ? (maskedIn.data.length > 80 ? `${maskedIn.data.slice(0, 80)}…` : maskedIn.data) : null
    const patternsIn = maskedIn?.pattern_detections?.map(p => p.pattern).join(', ') || null
    steps.push({
      num: nums[ni++],
      color: blocked ? '#f87171' : '#34d399',
      title: isMcpInvoke ? 'AIRS Stage 1 — Tool Input Scan' : 'AIRS Input Scan',
      icon: '🔍',
      badge: { label: blocked ? 'BLOCKED' : 'ALLOWED', color: blocked ? '#f87171' : '#34d399', bg: blocked ? 'rgba(239,68,68,0.2)' : 'rgba(52,211,153,0.15)', border: blocked ? 'rgba(239,68,68,0.5)' : 'rgba(52,211,153,0.4)' },
      ms: (isMcpInvoke ? tel.stage1?.latencyMs : timing.airs_input_scan_ms) ?? s?.latency_ms,
      rows: [
        { label: 'action', value: s?.action, mono: true, accent: blocked ? '#f87171' : '#34d399' },
        { label: 'category', value: s?.category, mono: true },
        threats.length ? { label: 'threats', value: threats.join(', '), accent: '#fca5a5' } : null,
        { label: 'scan_id', value: s?.scan_id, mono: true, copy: true },
        !isMcpInvoke && input?.report_id ? { label: 'report_id', value: input.report_id, mono: true, copy: true } : null,
        trId ? { label: 'session_id', value: trId, mono: true, copy: true } : null,
        // DLP masking — only visible when profile action is mask/allow-with-mask
        maskedPreviewIn ? { label: 'masked', value: maskedPreviewIn, mono: true, accent: '#fbbf24' } : null,
        patternsIn ? { label: 'patterns', value: patternsIn, accent: '#fbbf24' } : null,
        // Tool Event fields — matches SCM "Tool Event" section
        toolEvent?.tool_invoked ? { label: 'te:tool', value: toolEvent.tool_invoked, mono: true, accent: '#5eead4' } : null,
        toolEvent?.ecosystem   ? { label: 'te:ecosystem', value: toolEvent.ecosystem, mono: true } : null,
        toolEvent?.method      ? { label: 'te:method', value: toolEvent.method, mono: true } : null,
        toolEvent?.server_name ? { label: 'te:server', value: toolEvent.server_name, mono: true } : null,
      ].filter(Boolean),
      payload: isMcpInvoke
        ? { request: rawStage1?.requestBody ?? null, response: s }
        : {
            request:  input?.rawRequest  ?? input?.requestBody ?? null,
            response: input?.rawResponse ?? null,
            report:   input?.report?.data ?? input?.report ?? null,
          },
      payloadKey: 'stage1',
      note: blocked ? (isMcpInvoke ? 'Tool params blocked at Stage 1 — MCP server never called.' : 'Prompt blocked — request never reached the LLM.') : null,
    })
  }

  // Step: MCP Tool Execution (real MCP invoke, not blocked at stage 1)
  if (isMcpInvoke && !stage1Blocked) {
    const executed   = !!toolResult
    const noAirs     = !tel.stage1 && !tel.stage2  // AIRS was off

    // Format tool output readably per tool type
    let outputSummary = null
    if (toolResult) {
      if (toolResult.content != null)    outputSummary = String(toolResult.content).slice(0, 200) + (String(toolResult.content).length > 200 ? '…' : '')
      else if (toolResult.stdout != null) outputSummary = `exit=${toolResult.returncode} stdout: ${String(toolResult.stdout).slice(0, 120)}${toolResult.stderr ? ` stderr: ${String(toolResult.stderr).slice(0, 60)}` : ''}`
      else if (toolResult.found != null)  outputSummary = `found=${toolResult.found}${toolResult.value != null ? ` value="${String(toolResult.value).slice(0, 80)}"` : ''}`
      else if (toolResult.stored != null) outputSummary = `stored=${toolResult.stored} key="${toolParams?.key}"`
      else if (toolResult.status_code)    outputSummary = `HTTP ${toolResult.status_code} · ${String(toolResult.body_preview ?? '').slice(0, 120)}`
      else outputSummary = JSON.stringify(toolResult).slice(0, 150)
    }

    steps.push({
      num: nums[ni++],
      color: executed ? '#5eead4' : '#f87171',
      title: `MCP Tool: ${toolName}`,
      icon: executed ? '⚙️' : '⛔',
      badge: noAirs && executed
        ? { label: 'EXECUTED — NO AIRS PROTECTION', color: '#fb923c', bg: 'rgba(251,146,60,0.2)', border: 'rgba(251,146,60,0.5)' }
        : executed
        ? { label: 'EXECUTED', color: '#5eead4', bg: 'rgba(20,184,166,0.2)', border: 'rgba(20,184,166,0.5)' }
        : { label: 'OUTPUT SUPPRESSED BY AIRS', color: '#f87171', bg: 'rgba(239,68,68,0.2)', border: 'rgba(239,68,68,0.5)' },
      rows: [
        { label: 'tool', value: toolName, mono: true, accent: '#5eead4' },
        { label: 'server', value: 'airs-mcp-demo-server' },
        { label: 'ecosystem', value: 'mcp', mono: true },
        { label: 'method', value: 'tools/call', mono: true },
        toolParams ? { label: 'params', value: JSON.stringify(toolParams), mono: true } : null,
        outputSummary ? { label: 'result', value: outputSummary, mono: true, accent: noAirs ? '#fb923c' : '#5eead4' } : null,
        noAirs ? { label: '⚠ warning', value: 'Tool executed without AIRS scanning — no threat detection applied', accent: '#fb923c' } : null,
      ].filter(Boolean),
    })
  }

  // Step: LLM Inference (chat path only, not blocked)
  if (!isMcpInvoke && !inputBlocked && (timing.llm_ms || llm.tokens_in != null)) {
    steps.push({
      num: nums[ni++], color: '#60a5fa',
      title: 'LLM Inference',
      icon: '🤖',
      ms: timing.llm_ms,
      rows: [
        llm.model ? { label: 'model', value: llm.model, mono: true } : null,
        llm.tokens_in != null ? { label: 'tokens_in', value: String(llm.tokens_in), mono: true } : null,
        llm.tokens_out != null ? { label: 'tokens_out', value: String(llm.tokens_out), mono: true } : null,
        llm.throughput_tps ? { label: 'throughput', value: `${llm.throughput_tps} tok/s`, mono: true } : null,
      ].filter(Boolean),
    })
  }

  // Step: AIRS Output / Stage 2 Scan
  if (output || (isMcpInvoke && tel.stage2)) {
    const rawStage2 = isMcpInvoke ? tel.stage2 : null
    const s2 = isMcpInvoke
      ? { action: tel.stage2?.action, category: tel.stage2?.category, scan_id: tel.stage2?.scan_id, response_detected: tel.stage2?.response_detected, latency_ms: tel.stage2?.latencyMs }
      : output
    const threats2 = Object.entries(s2?.response_detected ?? {}).filter(([,v]) => v).map(([k]) => k)
    const blocked2 = s2?.action === 'block'
    const toolEvent2 = (output?.requestBody ?? rawStage2?.requestBody)?.contents?.[0]?.tool_event?.metadata
    const trId2 = isMcpInvoke ? tel.stage2?.trId : (output?.tr_id)
    // DLP-masked content on the response side
    const maskedOut = !isMcpInvoke ? (output?.response_masked_data ?? output?.rawResponse?.response_masked_data ?? null) : null
    const maskedPreviewOut = maskedOut?.data ? (maskedOut.data.length > 80 ? `${maskedOut.data.slice(0, 80)}…` : maskedOut.data) : null
    const patternsOut = maskedOut?.pattern_detections?.map(p => p.pattern).join(', ') || null
    steps.push({
      num: nums[ni++],
      color: blocked2 ? '#f87171' : '#a78bfa',
      title: isMcpInvoke ? 'AIRS Stage 2 — Tool Output Scan' : 'AIRS Output Scan',
      icon: '🔍',
      badge: { label: blocked2 ? 'BLOCKED' : 'ALLOWED', color: blocked2 ? '#f87171' : '#a78bfa', bg: blocked2 ? 'rgba(239,68,68,0.2)' : 'rgba(167,139,250,0.15)', border: blocked2 ? 'rgba(239,68,68,0.5)' : 'rgba(167,139,250,0.4)' },
      ms: (isMcpInvoke ? tel.stage2?.latencyMs : timing.airs_output_scan_ms) ?? s2?.latency_ms,
      rows: [
        { label: 'action', value: s2?.action, mono: true, accent: blocked2 ? '#f87171' : '#a78bfa' },
        { label: 'category', value: s2?.category, mono: true },
        threats2.length ? { label: 'threats', value: threats2.join(', '), accent: '#fca5a5' } : null,
        { label: 'scan_id', value: s2?.scan_id, mono: true, copy: true },
        !isMcpInvoke && output?.report_id ? { label: 'report_id', value: output.report_id, mono: true, copy: true } : null,
        trId2 ? { label: 'session_id', value: trId2, mono: true, copy: true } : null,
        maskedPreviewOut ? { label: 'masked', value: maskedPreviewOut, mono: true, accent: '#fbbf24' } : null,
        patternsOut ? { label: 'patterns', value: patternsOut, accent: '#fbbf24' } : null,
        toolEvent2?.tool_invoked ? { label: 'te:tool', value: toolEvent2.tool_invoked, mono: true, accent: '#5eead4' } : null,
        toolEvent2?.ecosystem   ? { label: 'te:ecosystem', value: toolEvent2.ecosystem, mono: true } : null,
      ].filter(Boolean),
      payload: isMcpInvoke
        ? { request: rawStage2?.requestBody ?? null, response: s2 }
        : {
            request:  output?.rawRequest  ?? output?.requestBody ?? null,
            response: output?.rawResponse ?? null,
            report:   output?.report?.data ?? output?.report ?? null,
          },
      payloadKey: 'stage2',
      note: blocked2 ? 'Tool output suppressed — response not returned to agent.' : null,
    })
  }

  // Step: Final result
  const finalBlocked = message.blocked
  steps.push({
    num: nums[ni++],
    color: finalBlocked ? '#f87171' : '#34d399',
    title: finalBlocked ? 'Response suppressed' : (isMcpInvoke ? 'Tool result returned' : 'Response delivered'),
    icon: finalBlocked ? '🚫' : '✅',
    rows: [
      { label: 'verdict', value: message.verdict ?? 'DIRECT', mono: true, accent: finalBlocked ? '#f87171' : '#34d399' },
      timing.total_ms ? { label: 'total_ms', value: `${timing.total_ms}ms`, mono: true } : null,
    ].filter(Boolean),
  })

  const totalMs = timing.total_ms

  return (
    <div className="w-full max-w-[90%] mt-2 mb-1">
      {/* Toggle button */}
      <button onClick={() => setOpen(v => !v)} className="flex items-center gap-2">
        <span className="text-[12px]" style={{ color: '#38bdf8' }}>⬡</span>
        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border tracking-wide"
          style={{ background: open ? 'rgba(56,189,248,0.15)' : 'rgba(56,189,248,0.07)', borderColor: 'rgba(56,189,248,0.4)', color: '#38bdf8' }}>
          Pipeline Trace
        </span>
        <span className="text-[9px] font-mono" style={{ color: '#4b5563' }}>
          {steps.length} steps{totalMs ? ` · ${totalMs}ms` : ''}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.15 }}>
          <ChevronDown size={10} style={{ color: '#38bdf8' }} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="mt-2 rounded-xl overflow-hidden" style={{ background: bg, border: `1px solid ${border}` }}>
              {steps.map((step, si) => (
                <div key={si} style={{ borderBottom: si < steps.length - 1 ? `1px solid ${rowDiv}` : 'none' }}>

                  {/* Step header */}
                  <div className="flex items-center gap-2.5 px-4 py-2.5" style={{ background: headerBg }}>
                    <span className="text-base leading-none flex-shrink-0">{step.icon}</span>
                    <span className="text-[12px] font-bold flex-1 tracking-tight" style={{ color: step.color }}>{step.title}</span>
                    {step.badge && (
                      <span className="text-[8px] font-black px-2 py-0.5 rounded-full border tracking-widest flex-shrink-0"
                        style={{ background: step.badge.bg, borderColor: step.badge.border, color: step.badge.color }}>
                        {step.badge.label}
                      </span>
                    )}
                    {step.ms != null && <span className="text-[10px] font-mono font-bold flex-shrink-0" style={{ color: '#4b5563' }}>{step.ms}ms</span>}
                  </div>

                  {/* Data rows */}
                  {step.rows?.map((row, ri) => (
                    <div key={ri} className="flex items-start gap-3 px-4 py-1.5" style={{ borderTop: `1px solid ${rowDiv}` }}>
                      <span className="text-[10px] font-mono w-20 flex-shrink-0 pt-px" style={{ color: labelC }}>{row.label}</span>
                      <span className={`text-[11px] flex-1 leading-relaxed break-all ${row.mono ? 'font-mono' : 'font-medium'}`}
                        style={{ color: row.accent ?? (row.mono ? monoC : valueC) }}>
                        {row.copy && row.value?.length > 24 ? `${row.value.slice(0, 20)}…` : row.value}
                      </span>
                      {row.copy && row.value && <TraceCopy text={row.value} />}
                    </div>
                  ))}

                  {/* Warning note */}
                  {step.note && (
                    <div className="mx-4 mb-3 mt-1 px-3 py-2 rounded-lg text-[10px] leading-relaxed font-medium"
                      style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
                      ⚠ {step.note}
                    </div>
                  )}

                  {/* AIRS payload expand */}
                  {step.payload && (
                    <div className="px-4 pb-3">
                      <button
                        onClick={() => setExpandedPayload(expandedPayload === step.payloadKey ? null : step.payloadKey)}
                        className="flex items-center gap-1 text-[9px] font-mono font-semibold transition-colors hover:opacity-80"
                        style={{ color: '#4b5563' }}>
                        <ChevronDown size={9} style={{ transform: expandedPayload === step.payloadKey ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.15s' }} />
                        {expandedPayload === step.payloadKey ? 'hide' : 'show'} raw AIRS data
                      </button>
                      <AnimatePresence initial={false}>
                        {expandedPayload === step.payloadKey && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                            <pre className="mt-2 rounded-lg p-3 overflow-auto text-[10px] font-mono leading-relaxed"
                              style={{ background: codeBg, border: '1px solid rgba(255,255,255,0.08)', maxHeight: '200px', color: '#67e8f9', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                              {JSON.stringify(step.payload, null, 2)}
                            </pre>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Assistant bubble ─────────────────────────────────────────────────────────
function AssistantMessage({ message, onOpenTelemetry }) {
  const isBlocked = message.blocked
  const isError = message.verdict === 'ERROR'
const hebrew = isHebrewText(message.content || '')

  // Verdict config — only show pill for BLOCKED and ERROR
  const verdict = isError
    ? { icon: <ShieldX size={11} className="text-orange-400" />, label: 'LLM ERROR', labelColor: 'text-orange-400', dot: 'bg-orange-400', border: 'border-orange-500/20' }
    : isBlocked
    ? { icon: <ShieldX size={11} className="text-red-400" />, label: 'BLOCKED BY AIRS', labelColor: 'text-red-400', dot: 'bg-red-500', border: 'border-red-500/20' }
    : { icon: <ShieldCheck size={11} className="text-emerald-400" />, label: 'AIRS ALLOWED', labelColor: 'text-emerald-400', dot: 'bg-emerald-400', border: 'border-emerald-500/20' }

  const showPill = isBlocked || isError

  return (
    <motion.div
      initial={{ opacity: 0, x: -20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="flex flex-col items-start px-4"
    >
      {/* Verdict pill — only for BLOCKED / ERROR */}
      {showPill && (
      <div className={`flex items-center gap-1.5 mb-1.5 px-2 py-0.5 rounded-full border ${verdict.border} bg-white/3`}>
        <motion.div
          className={`w-1.5 h-1.5 rounded-full ${verdict.dot}`}
          animate={!isBlocked && !isError ? { opacity: [1, 0.4, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        />
        {verdict.icon}
        <span className={`text-[9px] font-bold tracking-wider ${verdict.labelColor}`}>{verdict.label}</span>
        {message.riskScore && (
          <span className={`text-[8px] ${verdict.labelColor} opacity-60`}>· Risk {message.riskScore}/100</span>
        )}
      </div>
      )}

      {/* Bubble */}
      <div
        className="relative max-w-[78%] rounded-[22px] rounded-tl-[5px] px-4 py-3"
        style={{
          background: isBlocked
            ? 'rgba(239,68,68,0.08)'
            : isError
            ? 'rgba(249,115,22,0.08)'
            : 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: 'blur(20px) saturate(160%)',
          border: isBlocked
            ? '1px solid rgba(239,68,68,0.2)'
            : isError
            ? '1px solid rgba(249,115,22,0.2)'
            : '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 2px 16px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.07)',
        }}
      >
        {/* Bubble tail */}
        <div
          className="absolute top-0 -left-1"
          style={{
            width: 0, height: 0,
            borderRight: `8px solid ${isBlocked ? 'rgba(239,68,68,0.15)' : isError ? 'rgba(249,115,22,0.12)' : 'rgba(255,255,255,0.07)'}`,
            borderBottom: '8px solid transparent',
          }}
        />

        {(isError || isBlocked) ? (
          <div className="flex items-start gap-2">
            <ShieldX size={13} className={`flex-shrink-0 mt-0.5 ${isError ? 'text-orange-400' : 'text-red-400'}`} />
            <p className={`text-sm leading-relaxed ${isError ? 'text-orange-300' : 'text-red-300'}`}>
              {message.blockReason}
            </p>
          </div>
        ) : (
          <p
            className="leading-relaxed text-[13px] whitespace-pre-wrap break-words text-slate-800 dark:text-slate-100"
            style={hebrew
              ? { fontFamily: 'Arial, sans-serif', direction: 'rtl', textAlign: 'right' }
              : {}
            }
          >
            {message.content}
          </p>
        )}
      </div>

      {/* Pipeline Trace */}
      <PipelineTrace message={message} />

      {/* Meta row */}
      <div className="flex items-center gap-3 mt-1.5 text-[9px] text-slate-600 pl-1">
        <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
        {message.tokensIn != null && (
          <span className="flex items-center gap-1 text-blue-400/60">
            <ArrowDownToLine size={9} />{message.tokensIn.toLocaleString()} in
          </span>
        )}
        {message.tokensOut != null && (
          <span className="flex items-center gap-1 text-violet-400/60">
            <ArrowUpFromLine size={9} />{message.tokensOut.toLocaleString()} out
          </span>
        )}
        {message.traceId && onOpenTelemetry && (
          <button
            onClick={() => onOpenTelemetry(message.traceId)}
            className="flex items-center gap-1 text-slate-500 hover:text-blue-400 transition-colors"
            title="View prompt telemetry"
          >
            <Activity size={9} />
            Prompt Telemetry
          </button>
        )}
      </div>
    </motion.div>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────
export function ChatMessage({ message, onResend, onTranslate, isLoading, isTranslating, onOpenTelemetry }) {
  if (message.role === 'system') return <SystemMessage message={message} />
  if (message.role === 'user') return (
    <UserMessage
      message={message}
      onResend={onResend}
      onTranslate={onTranslate}
      isLoading={isLoading}
      isTranslating={isTranslating}
    />
  )
  if (message.role === 'assistant') return <AssistantMessage message={message} onOpenTelemetry={onOpenTelemetry} />
  return null
}
