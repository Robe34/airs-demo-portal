// src/components/observability/FilterBar.jsx
import React from 'react'
import { Search, X } from 'lucide-react'

export function FilterBar({ filters, setFilters }) {
  const set = (key, val) => setFilters(prev => ({ ...prev, [key]: val }))
  const clear = () => setFilters({ status: '', model: '', category: '', search: '' })
  const hasFilters = filters.status || filters.model || filters.category || filters.search

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Status filter */}
      <select
        value={filters.status}
        onChange={e => set('status', e.target.value)}
        className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-slate-300 text-xs focus:outline-none focus:border-teal-500/40"
      >
        <option value="">All statuses</option>
        <option value="BLOCKED">BLOCKED</option>
        <option value="ALLOWED">ALLOWED</option>
        <option value="DIRECT">DIRECT</option>
      </select>

      {/* Model filter */}
      <select
        value={filters.model}
        onChange={e => set('model', e.target.value)}
        className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-slate-300 text-xs focus:outline-none focus:border-teal-500/40"
      >
        <option value="">All providers</option>
        <option value="vertex">Vertex AI</option>
        <option value="bedrock">Bedrock</option>
        <option value="azure">Azure</option>
      </select>

      {/* Category filter */}
      <select
        value={filters.category}
        onChange={e => set('category', e.target.value)}
        className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-slate-300 text-xs focus:outline-none focus:border-teal-500/40"
      >
        <option value="">All categories</option>
        <option value="benign">Benign</option>
        <option value="malicious">Malicious</option>
        <option value="jailbreak">Jailbreak</option>
        <option value="data_leakage">Data Leakage</option>
      </select>

      {/* Search */}
      <div className="relative flex-1 min-w-[160px]">
        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600" />
        <input
          type="text"
          placeholder="Search prompts..."
          value={filters.search}
          onChange={e => set('search', e.target.value)}
          className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-slate-300 text-xs placeholder-slate-700 focus:outline-none focus:border-teal-500/40"
        />
      </div>

      {hasFilters && (
        <button onClick={clear} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-300 border border-white/[0.06] hover:border-white/[0.12] transition-colors">
          <X size={10} /> Clear
        </button>
      )}
    </div>
  )
}
