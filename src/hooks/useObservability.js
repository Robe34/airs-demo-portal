// src/hooks/useObservability.js
import { useState, useEffect, useCallback } from 'react'

export function useObservability() {
  const [metrics, setMetrics]     = useState(null)
  const [traces, setTraces]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [filters, setFilters]     = useState({ status: '', model: '', search: '' })

  const fetchData = useCallback(async () => {
    try {
      const qs = new URLSearchParams()
      if (filters.status) qs.set('status', filters.status)
      if (filters.model)  qs.set('model',  filters.model)
      if (filters.search) qs.set('search', filters.search)
      qs.set('limit', '100')

      const [metricsRes, tracesRes] = await Promise.all([
        fetch('/api/traces/metrics'),
        fetch(`/api/traces?${qs}`),
      ])
      if (metricsRes.ok) setMetrics(await metricsRes.json())
      if (tracesRes.ok)  setTraces((await tracesRes.json()).traces ?? [])
    } catch (err) {
      console.error('[useObservability] fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Initial fetch + 5s auto-refresh
  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [fetchData])

  return { metrics, traces, loading, filters, setFilters, refresh: fetchData }
}
