import React, { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, MessageSquare, Send, RotateCcw, Plus, ShieldCheck, Cpu, User, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { ChatMessage } from './ChatMessage'
import { useProtectionTheme } from '../../hooks/useProtectionTheme'

function FlowNode({ label, sublabel, color, icon: Icon, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl border ${color} min-w-[80px]`}
    >
      <Icon size={16} />
      <span className="text-[10px] font-bold tracking-wider">{label}</span>
      {sublabel && <span className="text-[8px] opacity-60 text-center leading-tight">{sublabel}</span>}
    </motion.div>
  )
}

function FlowArrow({ delay, label }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.3 }}
      className="flex flex-col items-center gap-0.5"
    >
      <ArrowRight size={14} className="text-slate-500" />
      {label && <span className="text-[7px] text-slate-600 whitespace-nowrap">{label}</span>}
    </motion.div>
  )
}

function WelcomeDiagram({ isProtected, theme }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center h-full px-6 py-8 gap-8"
    >
      {/* Shield icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
        className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${
          isProtected ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-red-500/40 bg-red-500/10'
        }`}
      >
        <ShieldCheck size={28} className={isProtected ? 'text-emerald-400' : 'text-red-400'} />
      </motion.div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <div className="text-sm font-bold tracking-widest text-slate-300 mb-1">PRISMA AIRS</div>
        <div className="text-[10px] tracking-widest text-slate-500">AI RUNTIME SECURITY · API INTERCEPT</div>
      </motion.div>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-xs text-slate-500 text-center max-w-xs leading-relaxed"
      >
        Every prompt and response is scanned in real time. Malicious payloads, prompt injections, and data leaks are blocked before they reach the LLM or the user.
      </motion.p>

      {/* Flow diagram */}
      <div className="flex items-center gap-2 flex-wrap justify-center">
        <FlowNode label="USER" sublabel="Prompt" color="border-slate-600 bg-slate-800/50 text-slate-300" icon={User} delay={0.35} />
        <FlowArrow delay={0.45} label="input" />
        <FlowNode label="AIRS" sublabel="Input Scan" color="border-emerald-500/40 bg-emerald-500/10 text-emerald-400" icon={ShieldCheck} delay={0.5} />
        <FlowArrow delay={0.6} label={isProtected ? 'if safe' : 'skipped'} />
        <FlowNode label="LLM" sublabel="AI Model" color="border-blue-500/40 bg-blue-500/10 text-blue-400" icon={Cpu} delay={0.65} />
        <FlowArrow delay={0.75} label="output" />
        <FlowNode label="AIRS" sublabel="Output Scan" color="border-purple-500/40 bg-purple-500/10 text-purple-400" icon={ShieldCheck} delay={0.8} />
        <FlowArrow delay={0.9} label="if safe" />
        <FlowNode label="USER" sublabel="Response" color="border-slate-600 bg-slate-800/50 text-slate-300" icon={CheckCircle2} delay={0.95} />
      </div>

      {/* Status badges */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="flex items-center gap-3"
      >
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-semibold ${
          isProtected
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
            : 'border-red-500/30 bg-red-500/10 text-red-400'
        }`}>
          {isProtected ? <CheckCircle2 size={9} /> : <AlertTriangle size={9} />}
          {isProtected ? 'AIRS Protection ON' : 'AIRS Protection OFF'}
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-blue-500/20 bg-blue-500/5 text-[9px] font-semibold text-blue-400">
          <Cpu size={9} />
          Prompt + Response Scanning
        </div>
      </motion.div>

      {/* CTA */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        className="text-[10px] text-slate-600 text-center"
      >
        Use the <span className="text-slate-400 font-medium">Attack Library</span> on the left to test security, or type a prompt below.
      </motion.p>
    </motion.div>
  )
}

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
}

export function ChatCenter({ messages, isLoading, onSendMessage, onClear, backend, model }) {
  const theme = useProtectionTheme()
  const hasConversation = messages.some(m => m.role === 'user' || m.role === 'assistant')
  const endRef = useRef(null)
  const inputRef = useRef(null)
  const [input, setInput] = useState('')
  const [translating, setTranslating] = useState(null)

  const handleSendHebrew = async (text) => {
    setTranslating(text)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Translate the following text to Hebrew. Return ONLY the translated text, nothing else:\n\n${text}`,
          airsEnabled: false,
          backend,
          modelId: model,
        }),
      })
      const data = await res.json()
      const translated = data.chatResponse?.content?.trim() || text
      onSendMessage(translated, backend, model)
    } catch {
      onSendMessage(text, backend, model)
    } finally {
      setTranslating(null)
    }
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e) => {
    e?.preventDefault()
    const text = input.trim()
    if (!text || isLoading) return
    onSendMessage(text, backend, model)
    setInput('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 flex-shrink-0">
        <MessageSquare size={14} className={theme.primaryText} />
        <span className="text-xs font-semibold text-slate-300">Intercept Console</span>
        <div className="ml-auto flex items-center gap-2">
          {hasConversation && (
            <button
              onClick={onClear}
              className="flex items-center gap-1 text-[10px] text-slate-600 hover:text-slate-400 transition-colors"
            >
              <RotateCcw size={10} /> Clear
            </button>
          )}
          <button
            onClick={onClear}
            className={`flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-lg border transition-colors ${
              theme.isProtected
                ? 'border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10'
                : 'border-blue-500/30 text-blue-400 hover:bg-blue-500/10'
            }`}
          >
            <Plus size={10} /> New Session
          </button>
        </div>
      </div>

      {/* Messages or Welcome Diagram */}
      <div className="flex-1 overflow-y-auto py-4">
        {!hasConversation ? (
          <WelcomeDiagram isProtected={theme.isProtected} theme={theme} />
        ) : (
          <motion.div variants={staggerContainer} animate="animate">
            <AnimatePresence>
              {messages.map((msg) => (
                <div key={msg.id} className="mb-4">
                  <ChatMessage
                    message={msg}
                    onResend={msg.role === 'user' ? () => onSendMessage(msg.content, backend, model) : undefined}
                    onResendHebrew={msg.role === 'user' ? () => handleSendHebrew(msg.content) : undefined}
                    isLoading={isLoading || translating === msg.content}
                    isTranslating={translating === msg.content}
                  />
                </div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-4 mb-4"
          >
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
              theme.isProtected
                ? 'bg-emerald-500/10 border-emerald-500/25'
                : 'bg-blue-500/15 border-blue-400/30'
            }`}>
              <Loader2 size={12} className={`animate-spin ${theme.isProtected ? theme.primaryText : 'text-blue-500'}`} />
              <span className={`text-xs font-medium ${theme.isProtected ? 'text-slate-200' : 'text-blue-700'}`}>
                {theme.isProtected ? 'AIRS scanning…' : 'Sending to LLM…'}
              </span>
              <span className="flex gap-0.5">
                {[0, 1, 2].map(i => (
                  <motion.span
                    key={i}
                    className={`w-1 h-1 rounded-full ${theme.isProtected ? theme.pulseColor : 'bg-blue-400'}`}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
                  />
                ))}
              </span>
            </div>
          </motion.div>
        )}

        <div ref={endRef} />
      </div>

      {/* Chat input */}
      <div className="flex-shrink-0 px-4 pb-4">
        <form onSubmit={handleSubmit}>
          <div className={`flex items-end gap-2 rounded-xl border p-2 transition-all duration-300 ${
            theme.isProtected
              ? 'border-emerald-500/30 bg-emerald-500/5 focus-within:border-emerald-500/50'
              : 'border-white/10 bg-white/5 focus-within:border-white/20'
          }`}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message or use the attack library…"
              rows={1}
              disabled={isLoading}
              className="flex-1 bg-transparent text-xs text-slate-200 placeholder-slate-600 resize-none outline-none leading-relaxed max-h-32 disabled:opacity-50"
              style={{ minHeight: '20px' }}
              onInput={e => {
                e.target.style.height = 'auto'
                e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={`flex-shrink-0 p-2 rounded-lg transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed
                ${theme.isProtected
                  ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }
              `}
            >
              <Send size={12} />
            </button>
          </div>
          <div className="flex items-center justify-between mt-1.5 px-1">
            <span className="text-[9px] text-slate-700">Enter to send · Shift+Enter for newline</span>
            <span className={`text-[9px] font-semibold ${theme.primaryText}`}>
              {theme.isProtected ? '⚡ AIRS Protected' : '⚠ Unprotected'}
            </span>
          </div>
        </form>
      </div>
    </div>
  )
}
