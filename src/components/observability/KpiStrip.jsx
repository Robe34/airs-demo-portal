// src/components/observability/KpiStrip.jsx
import React from 'react'
import { Activity, Clock, TrendingUp, ShieldX, Zap, Hash, Shield } from 'lucide-react'

function KpiCard({ label, value, sub, icon: Icon, color = 'text-slate-200', bgColor = 'bg-white/[0.04]', borderColor = 'border-white/[0.08]' }) {
  return (
    <div className={`flex flex-col gap-2 p-4 rounded-2xl border ${bgColor} ${borderColor} flex-1 min-w-0`}>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center">
          <Icon size={14} className={color} />
        </div>
        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold truncate">{label}</span>
      </div>
      <span className={`text-3xl font-bold font-mono leading-none ${color}`}>{value ?? '—'}</span>
      {sub && <span className="text-[10px] text-slate-600">{sub}</span>}
    </div>
  )
}

export function KpiStrip({ metrics }) {
  if (!metrics) return null
  return (
    <div className="flex gap-3">
      <KpiCard
        label="Total Requests"
        value={metrics.total_requests}
        sub="all time"
        icon={Activity}
        color="text-slate-200"
      />
      <KpiCard
        label="Avg Latency"
        value={metrics.avg_total_ms ? `${metrics.avg_total_ms}ms` : '—'}
        sub="end-to-end"
        icon={Clock}
        color="text-blue-400"
        bgColor="bg-blue-500/[0.06]"
        borderColor="border-blue-500/20"
      />
      <KpiCard
        label="P95 Latency"
        value={metrics.p95_total_ms ? `${metrics.p95_total_ms}ms` : '—'}
        sub="95th percentile"
        icon={TrendingUp}
        color="text-violet-400"
        bgColor="bg-violet-500/[0.06]"
        borderColor="border-violet-500/20"
      />
      <KpiCard
        label="Blocked"
        value={metrics.blocked_count}
        sub={`${metrics.block_rate_pct ?? 0}% block rate`}
        icon={ShieldX}
        color="text-red-400"
        bgColor="bg-red-500/[0.06]"
        borderColor="border-red-500/20"
      />
      <KpiCard
        label="Detection Rate"
        value={metrics.total_requests > 0 ? `${metrics.block_rate_pct}%` : '—'}
        sub="threats caught"
        icon={Zap}
        color="text-emerald-400"
        bgColor="bg-emerald-500/[0.06]"
        borderColor="border-emerald-500/20"
      />
      {metrics.avg_airs_overhead_pct != null && (
        <KpiCard
          label="AIRS Overhead"
          value={`${metrics.avg_airs_overhead_pct}%`}
          sub="of total latency"
          icon={Zap}
          color="text-teal-400"
          bgColor="bg-teal-500/[0.06]"
          borderColor="border-teal-500/20"
        />
      )}
      {metrics.avg_tokens_per_request != null && (
        <KpiCard
          label="Avg Tokens"
          value={metrics.avg_tokens_per_request}
          sub="per request"
          icon={Hash}
          color="text-violet-400"
          bgColor="bg-violet-500/[0.06]"
          borderColor="border-violet-500/20"
        />
      )}
      {metrics.protected_count != null && metrics.total_requests > 0 && (
        <KpiCard
          label="Protected"
          value={metrics.protected_count}
          sub={`of ${metrics.total_requests} total`}
          icon={Shield}
          color="text-emerald-400"
          bgColor="bg-emerald-500/[0.06]"
          borderColor="border-emerald-500/20"
        />
      )}
    </div>
  )
}
