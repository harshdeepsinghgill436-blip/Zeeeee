import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { loadBrevoAccounts } from './Settings'
import { BarChart2, RefreshCw, Mail, CheckCircle, XCircle, Clock, TrendingUp, Zap } from 'lucide-react'

interface BrevoStats {
  email: string
  sent: number
  delivered: number
  opens: number
  clicks: number
  bounces: number
  spam: number
  error?: string
}

interface LocalStats {
  totalLeads: number
  activeLeads: number
  doneLeads: number
  pendingLeads: number
  emailsSent: number
  todaySent: number
  campaignCount: number
}

export default function Analytics() {
  const [brevoStats, setBrevoStats] = useState<BrevoStats[]>([])
  const [localStats, setLocalStats] = useState<LocalStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const fetchLocalStats = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const [
        { count: totalLeads },
        { count: activeLeads },
        { count: doneLeads },
        { count: pendingLeads },
        { count: emailsSent },
        { count: todaySent },
        { count: campaignCount },
      ] = await Promise.all([
        supabase.from('leads').select('*', { count: 'exact', head: true }).neq('status', 'deleted'),
        supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'done'),
        supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('email_logs').select('*', { count: 'exact', head: true }),
        supabase.from('email_logs').select('*', { count: 'exact', head: true }).gte('sent_at', `${today}T00:00:00`),
        supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      ])
      setLocalStats({
        totalLeads: totalLeads || 0,
        activeLeads: activeLeads || 0,
        doneLeads: doneLeads || 0,
        pendingLeads: pendingLeads || 0,
        emailsSent: emailsSent || 0,
        todaySent: todaySent || 0,
        campaignCount: campaignCount || 0,
      })
    } catch (e) {
      console.error('Local stats error:', e)
    }
  }, [])

  const fetchBrevoStats = useCallback(async () => {
    const accounts = loadBrevoAccounts().filter(a => a.key && a.email)
    if (accounts.length === 0) {
      setBrevoStats([])
      return
    }

    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - 30)
    const start = startDate.toISOString().split('T')[0]
    const end = today.toISOString().split('T')[0]

    const results = await Promise.all(accounts.map(async (acc) => {
      try {
        const res = await fetch(
          `https://api.brevo.com/v3/smtp/statistics/aggregatedReport?startDate=${start}&endDate=${end}`,
          { headers: { 'api-key': acc.key, 'Accept': 'application/json' } }
        )
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        return {
          email: acc.email,
          sent: data.sent ?? 0,
          delivered: data.delivered ?? 0,
          opens: data.uniqueOpens ?? 0,
          clicks: data.uniqueClicks ?? 0,
          bounces: (data.hardBounces ?? 0) + (data.softBounces ?? 0),
          spam: data.spamReports ?? 0,
        } as BrevoStats
      } catch (e: any) {
        return {
          email: acc.email,
          sent: 0, delivered: 0, opens: 0, clicks: 0, bounces: 0, spam: 0,
          error: e.message,
        } as BrevoStats
      }
    }))
    setBrevoStats(results)
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    await Promise.all([fetchLocalStats(), fetchBrevoStats()])
    setLastRefresh(new Date())
    setLoading(false)
  }, [fetchLocalStats, fetchBrevoStats])

  useEffect(() => {
    refresh()
    // Auto-refresh every 60 seconds
    const interval = setInterval(refresh, 60_000)
    return () => clearInterval(interval)
  }, [refresh])

  const totalSent = brevoStats.reduce((a, b) => a + b.sent, 0)
  const totalOpens = brevoStats.reduce((a, b) => a + b.opens, 0)
  const totalClicks = brevoStats.reduce((a, b) => a + b.clicks, 0)
  const totalBounces = brevoStats.reduce((a, b) => a + b.bounces, 0)
  const openRate = totalSent > 0 ? ((totalOpens / totalSent) * 100).toFixed(1) : '0'
  const clickRate = totalSent > 0 ? ((totalClicks / totalSent) * 100).toFixed(1) : '0'

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-gray-500 text-xs mt-0.5">Live data from Brevo · auto-refreshes every 60s</p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="p-2.5 bg-[#111] border border-[#222] rounded-xl text-gray-500 hover:text-white transition-colors disabled:opacity-40"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {lastRefresh && (
        <div className="text-xs text-gray-700 -mt-4">
          Last updated: {lastRefresh.toLocaleTimeString()}
        </div>
      )}

      {/* Local DB stats */}
      {localStats && (
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 px-1">Campaign Overview</div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Total Leads', value: localStats.totalLeads.toLocaleString(), color: 'text-white' },
              { label: 'Active', value: localStats.activeLeads.toLocaleString(), color: 'text-blue-400' },
              { label: 'Done', value: localStats.doneLeads.toLocaleString(), color: 'text-[#39ff14]' },
              { label: 'Today Sent', value: localStats.todaySent.toLocaleString(), color: 'text-yellow-400' },
            ].map(s => (
              <div key={s.label} className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-3 text-center">
                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-600 mt-0.5 leading-tight">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {[
              { label: 'All Emails Sent', value: localStats.emailsSent.toLocaleString(), icon: <Mail size={14} /> },
              { label: 'Pending', value: localStats.pendingLeads.toLocaleString(), icon: <Clock size={14} /> },
              { label: 'Campaigns', value: localStats.campaignCount.toLocaleString(), icon: <Zap size={14} /> },
            ].map(s => (
              <div key={s.label} className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-3 text-center">
                <div className="text-gray-500 flex justify-center mb-1">{s.icon}</div>
                <div className="text-xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-gray-600 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Brevo live stats */}
      {brevoStats.length === 0 && !loading && (
        <div className="bg-[#111] border border-[#222] rounded-2xl p-6 text-center">
          <BarChart2 size={28} className="mx-auto mb-2 text-gray-700" />
          <div className="text-sm text-gray-500">No Brevo accounts configured.</div>
          <div className="text-xs text-gray-700 mt-1">Add your keys in Settings to see live stats.</div>
        </div>
      )}

      {brevoStats.length > 0 && (
        <>
          {/* Aggregate */}
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 px-1">Brevo — Last 30 Days</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Sent', value: totalSent.toLocaleString(), icon: <Mail size={16} />, color: 'text-white' },
                { label: 'Open Rate', value: `${openRate}%`, icon: <TrendingUp size={16} />, color: 'text-[#39ff14]' },
                { label: 'Click Rate', value: `${clickRate}%`, icon: <CheckCircle size={16} />, color: 'text-blue-400' },
                { label: 'Bounces', value: totalBounces.toLocaleString(), icon: <XCircle size={16} />, color: 'text-red-400' },
              ].map(s => (
                <div key={s.label} className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4 flex items-center gap-3">
                  <div className={`${s.color} opacity-60`}>{s.icon}</div>
                  <div>
                    <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                    <div className="text-xs text-gray-600">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Per-account breakdown */}
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 px-1">Per Account</div>
            <div className="space-y-3">
              {brevoStats.map((acc, i) => (
                <div key={i} className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium truncate">{acc.email}</div>
                    {acc.error
                      ? <span className="text-xs text-red-400 bg-red-900/20 px-2 py-0.5 rounded-full">Error</span>
                      : <span className="text-xs text-[#39ff14] bg-green-900/20 px-2 py-0.5 rounded-full">Live</span>
                    }
                  </div>
                  {acc.error ? (
                    <div className="text-xs text-red-400 opacity-70">{acc.error}</div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[
                        { label: 'Sent', value: acc.sent.toLocaleString() },
                        { label: 'Opens', value: acc.opens.toLocaleString() },
                        { label: 'Clicks', value: acc.clicks.toLocaleString() },
                        { label: 'Delivered', value: acc.delivered.toLocaleString() },
                        { label: 'Bounces', value: acc.bounces.toLocaleString() },
                        { label: 'Spam', value: acc.spam.toLocaleString() },
                      ].map(stat => (
                        <div key={stat.label} className="bg-[#0d0d0d] rounded-xl p-2">
                          <div className="text-sm font-bold text-white">{stat.value}</div>
                          <div className="text-xs text-gray-600">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {loading && brevoStats.length === 0 && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[#111] border border-[#1e1e1e] rounded-2xl h-20 animate-pulse" />
          ))}
        </div>
      )}
    </div>
  )
}
