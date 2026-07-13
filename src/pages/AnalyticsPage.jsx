import { useState, useEffect, useCallback } from 'react'
import {
  TrendingUp,
  Users,
  FolderOpen,
  DollarSign,
  CheckCircle,
  Clock,
  AlertTriangle,
  Brain,
  RefreshCw,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { clsx } from 'clsx'
import { supabase } from '@/lib/supabase'

function formatAED(fils) {
  return `AED ${(fils / 100).toLocaleString('en-AE', { minimumFractionDigits: 0 })}`
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-AE', { month: 'short', day: 'numeric' })
}

// ─── Stat Card ─────────────────────────────────────────────────────
function MetricCard({ label, value, sub, icon: Icon, color = 'gold', trend }) {
  const colorMap = {
    gold: 'bg-gold-500/10   border-gold-500/20   text-gold-400',
    blue: 'bg-blue-500/10   border-blue-500/20   text-blue-400',
    green: 'bg-green-500/10  border-green-500/20  text-green-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    red: 'bg-red-500/10    border-red-500/20    text-red-400',
  }
  return (
    <div className="glass-panel rounded-xl p-5 flex items-start justify-between">
      <div>
        <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-2">
          {label}
        </p>
        <p className="font-display text-3xl font-semibold text-[var(--text-primary)]">{value}</p>
        {sub && <p className="text-xs text-[var(--text-muted)] mt-1">{sub}</p>}
        {trend !== undefined && (
          <p
            className={clsx(
              'text-xs mt-1 flex items-center gap-1',
              trend >= 0 ? 'text-green-400' : 'text-red-400',
            )}
          >
            {trend >= 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
            {Math.abs(trend)}% vs last month
          </p>
        )}
      </div>
      <div
        className={clsx(
          'w-10 h-10 rounded-lg border flex items-center justify-center shrink-0',
          colorMap[color],
        )}
      >
        <Icon size={18} />
      </div>
    </div>
  )
}

// ─── Mini bar chart ────────────────────────────────────────────────
function BarChart({ data, label }) {
  if (!data || data.length === 0)
    return (
      <div className="h-32 flex items-center justify-center text-sm text-[var(--text-muted)]">
        No data yet
      </div>
    )

  const max = Math.max(...data.map((d) => d.case_count), 1)

  return (
    <div>
      <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-4">
        {label}
      </p>
      <div className="flex items-end gap-1.5 h-32">
        {data.map((d, i) => {
          const pct = (d.case_count / max) * 100
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
              <div className="relative w-full">
                <div
                  className="w-full rounded-t-sm bg-gold-500/20 hover:bg-gold-500/40 transition-all duration-200 cursor-default"
                  style={{ height: `${Math.max(pct, 4)}%`, minHeight: '4px', maxHeight: '128px' }}
                  title={`${d.case_count} cases on ${formatDate(d.day)}`}
                />
              </div>
              {i % 5 === 0 && (
                <p className="text-[9px] text-[var(--text-muted)] truncate w-full text-center">
                  {formatDate(d.day)}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Case type breakdown ───────────────────────────────────────────
function TypeBreakdown({ cases }) {
  const counts = {}
  cases.forEach((c) => {
    counts[c.type] = (counts[c.type] || 0) + 1
  })
  const total = cases.length || 1
  const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a)

  const colors = [
    'bg-gold-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-cyan-500',
  ]

  return (
    <div className="space-y-3">
      {sorted.map(([type, count], i) => (
        <div key={type}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[var(--text-secondary)] capitalize">{type}</span>
            <span className="text-xs text-[var(--text-muted)]">
              {count} ({Math.round((count / total) * 100)}%)
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className={clsx(
                'h-full rounded-full transition-all duration-700',
                colors[i % colors.length],
              )}
              style={{ width: `${(count / total) * 100}%`, opacity: 0.7 }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Risk distribution ─────────────────────────────────────────────
function RiskPie({ cases }) {
  const aiDone = cases.filter((c) => c.ai_status === 'done')
  const counts = { high: 0, medium: 0, low: 0 }
  aiDone.forEach((c) => {
    if (c.ai_risk_level) counts[c.ai_risk_level]++
  })
  const total = aiDone.length || 1

  return (
    <div className="space-y-3">
      {[
        { key: 'high', label: 'High Risk', color: 'bg-red-500', text: 'text-red-400' },
        { key: 'medium', label: 'Medium Risk', color: 'bg-amber-500', text: 'text-amber-400' },
        { key: 'low', label: 'Low Risk', color: 'bg-green-500', text: 'text-green-400' },
      ].map(({ key, label, color, text }) => (
        <div key={key}>
          <div className="flex justify-between mb-1">
            <span className={clsx('text-xs font-medium', text)}>{label}</span>
            <span className="text-xs text-[var(--text-muted)]">
              {counts[key]} ({Math.round((counts[key] / total) * 100)}%)
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className={clsx('h-full rounded-full opacity-70', color)}
              style={{ width: `${(counts[key] / total) * 100}%` }}
            />
          </div>
        </div>
      ))}
      {aiDone.length === 0 && (
        <p className="text-xs text-[var(--text-muted)] text-center py-4">
          No AI analyses completed yet
        </p>
      )}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────
export function AnalyticsPage() {
  const [summary, setSummary] = useState(null)
  const [dailyCases, setDailyCases] = useState([])
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [
        { data: summaryData, error: summaryErr },
        { data: dailyData, error: dailyErr },
        { data: casesData, error: casesErr },
      ] = await Promise.all([
        supabase.from('analytics_summary').select('*').single(),
        supabase.from('cases_per_day').select('*'),
        supabase.from('cases').select('type, status, ai_status, ai_risk_level, created_at'),
      ])

      if (summaryErr && summaryErr.code !== '42P01') throw summaryErr
      if (dailyErr && dailyErr.code !== '42P01') throw dailyErr

      setSummary(summaryData)
      setDailyCases(dailyData || [])
      setCases(casesData || [])
    } catch (err) {
      console.error('[Analytics] fetch error:', err.message)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const s = summary || {}
  const revenueAED = s.total_revenue_fils ? formatAED(s.total_revenue_fils) : 'AED 0'
  const aiReadyPct =
    s.total_cases > 0
      ? Math.round((cases.filter((c) => c.ai_status === 'done').length / s.total_cases) * 100)
      : 0

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between animate-slide-up">
        <div>
          <h1 className="font-display text-3xl font-semibold text-[var(--text-primary)]">
            Analytics
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Platform-wide performance overview
          </p>
        </div>
        <button
          onClick={fetchAll}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg glass-panel text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all disabled:opacity-50"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/8 border border-amber-500/20 text-amber-400 text-sm">
          <AlertTriangle size={14} />
          {error.includes('42P01')
            ? 'Run migration_phase6.sql first to enable analytics views'
            : error}
        </div>
      )}

      {/* Top metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-slide-up-delay-1">
        <MetricCard
          label="Total Cases"
          value={loading ? '—' : s.total_cases || 0}
          icon={FolderOpen}
          color="gold"
        />
        <MetricCard
          label="Total Users"
          value={loading ? '—' : s.total_users || 0}
          icon={Users}
          color="blue"
        />
        <MetricCard
          label="Paid Unlocks"
          value={loading ? '—' : s.paid_unlocks || 0}
          icon={DollarSign}
          color="green"
        />
        <MetricCard
          label="Total Revenue"
          value={loading ? '—' : revenueAED}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-slide-up-delay-1">
        <MetricCard
          label="Pending Cases"
          value={loading ? '—' : s.pending_cases || 0}
          icon={Clock}
          color="gold"
        />
        <MetricCard
          label="Active Cases"
          value={loading ? '—' : s.active_cases || 0}
          icon={TrendingUp}
          color="blue"
        />
        <MetricCard
          label="Resolved"
          value={loading ? '—' : s.resolved_cases || 0}
          icon={CheckCircle}
          color="green"
        />
        <MetricCard
          label="AI Analyses"
          value={loading ? '—' : `${aiReadyPct}%`}
          icon={Brain}
          color="purple"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up-delay-2">
        {/* Bar chart - cases per day */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">
              Cases — Last 30 Days
            </h2>
            <span className="text-xs text-[var(--text-muted)]">
              {dailyCases.reduce((sum, d) => sum + d.case_count, 0)} total
            </span>
          </div>
          {loading ? (
            <div className="h-40 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-gold-400/30 border-t-gold-400 rounded-full animate-spin" />
            </div>
          ) : (
            <BarChart data={dailyCases} label="" />
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Team breakdown */}
          <div className="glass-panel rounded-xl p-4">
            <h3 className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-3">
              Team
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Clients', value: s.total_clients || 0, color: 'text-blue-400' },
                { label: 'Partners', value: s.total_partners || 0, color: 'text-purple-400' },
                { label: 'Total', value: s.total_users || 0, color: 'text-gold-400' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">{item.label}</span>
                  <span className={clsx('text-sm font-semibold tabular-nums', item.color)}>
                    {loading ? '—' : item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Task breakdown */}
          <div className="glass-panel rounded-xl p-4">
            <h3 className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-3">
              Tasks
            </h3>
            <div className="space-y-3">
              {[
                {
                  label: 'Total Tasks',
                  value: s.total_tasks || 0,
                  color: 'text-[var(--text-primary)]',
                },
                { label: 'Completed', value: s.completed_tasks || 0, color: 'text-green-400' },
                {
                  label: 'Completion %',
                  value:
                    s.total_tasks > 0
                      ? `${Math.round(((s.completed_tasks || 0) / s.total_tasks) * 100)}%`
                      : '—',
                  color: 'text-gold-400',
                },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">{item.label}</span>
                  <span className={clsx('text-sm font-semibold', item.color)}>
                    {loading ? '—' : item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Case breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up-delay-3">
        {/* Case types */}
        <div className="glass-panel rounded-xl p-5">
          <h2 className="font-display text-lg font-semibold text-[var(--text-primary)] mb-4">
            Cases by Type
          </h2>
          {loading ? (
            <div className="h-32 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-gold-400/30 border-t-gold-400 rounded-full animate-spin" />
            </div>
          ) : cases.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-8">No cases yet</p>
          ) : (
            <TypeBreakdown cases={cases} />
          )}
        </div>

        {/* Risk levels */}
        <div className="glass-panel rounded-xl p-5">
          <h2 className="font-display text-lg font-semibold text-[var(--text-primary)] mb-4">
            AI Risk Distribution
          </h2>
          {loading ? (
            <div className="h-32 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-gold-400/30 border-t-gold-400 rounded-full animate-spin" />
            </div>
          ) : (
            <RiskPie cases={cases} />
          )}
        </div>
      </div>
    </div>
  )
}

export default AnalyticsPage
