// src/hooks/useObservability.js
import { useState, useEffect, useCallback, useRef } from 'react'

export function useObservability() {
  const [metrics, setMetrics]     = useState(null)
  const [traces, setTraces]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [filters, setFilters]     = useState({ status: '', model: '', category: '', search: '' })
  const [since, setSince]         = useState('20m')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const debounceTimer = useRef(null)

  // Debounce the search field — status, model, and category filter immediately
  useEffect(() => {
    clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => setDebouncedSearch(filters.search), 300)
    return () => clearTimeout(debounceTimer.current)
  }, [filters.search])

  const effectiveFilters = { ...filters, search: debouncedSearch }

  const fetchData = useCallback(async () => {
    try {
      const qs = new URLSearchParams()
      if (effectiveFilters.status)   qs.set('status',   effectiveFilters.status)
      if (effectiveFilters.model)    qs.set('model',    effectiveFilters.model)
      if (effectiveFilters.category) qs.set('category', effectiveFilters.category)
      if (effectiveFilters.search)   qs.set('search',   effectiveFilters.search)
      qs.set('limit', '100')

      const [metricsRes, tracesRes] = await Promise.all([
        fetch(`/api/traces/metrics?since=${since}`),
        fetch(`/api/traces?${qs}`),
      ])
      if (metricsRes.ok) setMetrics(await metricsRes.json())
      if (tracesRes.ok)  setTraces((await tracesRes.json()).traces ?? [])
    } catch (err) {
      console.error('[useObservability] fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [effectiveFilters.status, effectiveFilters.model, effectiveFilters.category, effectiveFilters.search, since])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [fetchData])

  return { metrics, traces, loading, filters, setFilters, since, setSince, refresh: fetchData }
}
