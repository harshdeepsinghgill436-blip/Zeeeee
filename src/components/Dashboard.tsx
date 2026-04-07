import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'
import { Search, Trash2, RefreshCw, CheckCircle, Clock, ChevronDown, ChevronUp, Send, Zap } from 'lucide-react'
import { SEQUENCES } from '../lib/sequences'

interface Lead {
  id: string
  email: string
  sequence_id: number
  brevo_sender: string
  status: string
  current_step: number
  next_send_at: string
  campaign_id: string
  campaigns?: { name: string }
  email_logs?: EmailLog[]
}

interface EmailLog {
  id: string
  step: number
  subject: string
  sent_at: string
  status: string
}

interface Campaign {
  id: string
  name: string
  total_leads: number
  status: string
  created_at: string
}

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [search, setSearch] = useState('')
  const [expandedLead, setExpandedLead] = useState<string | null>(null)
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, active: 0, sent: 0, done: 0 })

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [{ data: c }, { data: l }] = await Promise.all([
      supabase.from('campaigns').select('*').order('created_at', { ascending: false }),
      supabase.from('leads').select('*, campaigns(name), email_logs(*)').order('created_at', { ascending: false }),
    ])
    setCampaigns(c || [])
    const allLeads = l || []
    setLeads(allLeads)
    setStats({
      total: allLeads.filter(x => x.status !== 'deleted').length,
      active: allLeads.filter(x => x.status === 'active').length,
      sent: allLeads.reduce((acc, x) => acc + (x.email_logs?.length || 0), 0),
      done: allLeads.filter(x => x.status === 'done').length,
    })
    setLoading(false)
  }

  async function deleteLead(id: string) {
    await supabase.from('leads').update({ status: 'deleted' }).eq('id', id)
    toast.success('Lead removed')
    fetchAll()
  }

  async function deleteCampaign(id: string) {
    await supabase.from('leads').update({ status: 'deleted' }).eq('campaign_id', id)
    await supabase.from('campaigns').update({ status: 'cancelled' }).eq('id', id)
    toast.success('Campaign cancelled')
    fetchAll()
  }

  const filtered = leads.filter(l =>
    l.status !== 'deleted' &&
    (search === '' ||
      l.email.toLowerCase().includes(search.toLowerCase()) ||
      l.campaigns?.name?.toLowerCase().includes(search.toLowerCase()))
  )

  function getStepLabel(step: number) {
    return step === 0 ? 'Main Email' : `Follow-up ${step}`
  }

  function getStatusColor(status: string) {
    if (status === 'done') return 'text-[#39ff14]'
    if (status === 'active') return 'text-blue-400'
    if (status === 'pending') return 'text-yellow-400'
    return 'text-gray-500'
  }

  function getStatusDot(status: string) {
    if (status === 'done') return 'bg-[#39ff14]'
    if (status === 'active') return 'bg-blue-400 animate-pulse'
    if (status === 'pending') return 'bg-yellow-400'
    return 'bg-gray-600'
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <Zap size={28} className="text-[#39ff14] animate-pulse" />
      <div className="text-gray-600 text-sm">Loading...</div>
    </div>
  )

  return (
    <div className="space-y-6 max-w-2xl mx-auto">

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Leads', value: stats.total, color: 'text-white' },
          { label: 'Active', value: stats.active, color: 'text-blue-400' },
          { label: 'Sent', value: stats.sent, color: 'text-[#39ff14]' },
          { label: 'Done', value: stats.done, color: 'text-gray-400' },
        ].map(s => (
          <div key={s.label} className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-3 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-600 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Campaigns */}
      {campaigns.filter(c => c.status !== 'cancelled').length > 0 && (
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 px-1">Campaigns</div>
          <div className="space-y-2">
            {campaigns.filter(c => c.status !== 'cancelled').map(c => (
              <div key={c.id} className="bg-[#111] border border-[#1e1e1e] rounded-2xl px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm">{c.name}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{c.total_leads} leads · {new Date(c.created_at).toLocaleDateString('en-GB')}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.status === 'active' ? 'bg-green-900/30 text-[#39ff14]' : 'bg-gray-800 text-gray-500'}`}>
                    {c.status}
                  </span>
                  <button onClick={() => deleteCampaign(c.id)} className="text-gray-700 hover:text-red-400 transition-colors p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leads */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search emails or campaigns..."
              className="w-full bg-[#111] border border-[#1e1e1e] rounded-xl pl-8 pr-4 py-2.5 text-white placeholder-gray-700 focus:outline-none focus:border-[#333] text-sm"
            />
          </div>
          <button onClick={fetchAll} className="p-2.5 bg-[#111] border border-[#1e1e1e] rounded-xl text-gray-500 hover:text-white transition-colors">
            <RefreshCw size={14} />
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-700">
            <Send size={32} className="mx-auto mb-3 opacity-20" />
            <div className="text-sm">No leads yet. Launch a campaign.</div>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(lead => {
              const seq = SEQUENCES.find(s => s.id === lead.sequence_id)
              const isExpanded = expandedLead === lead.id
              const logs = lead.email_logs || []

              // Build full sequence steps with subject + body
              const steps = seq ? [
                { step: 0, subject: seq.subject, body: seq.body, label: 'Main Email', delay: 'Immediately' },
                ...seq.followups.map((f, i) => ({
                  step: i + 1,
                  subject: f.subject,
                  body: f.body,
                  label: `Follow-up ${i + 1}`,
                  delay: `+${(i + 1) * 24}h`
                }))
              ] : []

              return (
                <div key={lead.id} className="bg-[#111] border border-[#1e1e1e] rounded-2xl overflow-hidden">
                  {/* Lead row */}
                  <div
                    className="px-4 py-3 flex items-center gap-3 cursor-pointer active:bg-[#161616]"
                    onClick={() => setExpandedLead(isExpanded ? null : lead.id)}
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusDot(lead.status)}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-mono truncate text-white">{lead.email}</div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-gray-600">{lead.campaigns?.name}</span>
                        <span className="text-xs text-gray-700">·</span>
                        <span className="text-xs text-gray-600">Copy #{lead.sequence_id}</span>
                        <span className="text-xs text-gray-700">·</span>
                        <span className={`text-xs font-medium ${getStatusColor(lead.status)}`}>
                          {lead.status === 'pending' ? getStepLabel(lead.current_step) : lead.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={e => { e.stopPropagation(); deleteLead(lead.id) }}
                        className="p-1.5 text-gray-700 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                      {isExpanded ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
                    </div>
                  </div>

                  {/* Expanded sequence */}
                  {isExpanded && (
                    <div className="border-t border-[#1a1a1a] px-4 pb-4 pt-3">
                      <div className="text-xs text-gray-600 uppercase tracking-wider mb-3">
                        Sequence #{lead.sequence_id} · {logs.length}/6 sent
                        {lead.next_send_at && lead.status !== 'done' && (
                          <span className="ml-2 text-yellow-600 normal-case">
                            · Next: {new Date(lead.next_send_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        {steps.map(item => {
                          const log = logs.find(l => l.step === item.step)
                          const isSent = !!log || lead.current_step > item.step
                          const isCurrent = lead.current_step === item.step && lead.status !== 'done'
                          const isEmailExpanded = expandedEmail === `${lead.id}-${item.step}`

                          return (
                            <div
                              key={item.step}
                              className={`rounded-xl border overflow-hidden transition-colors ${
                                isSent ? 'border-[#1e2e1e] bg-[#0d150d]' :
                                isCurrent ? 'border-yellow-900/50 bg-[#141108]' :
                                'border-[#1a1a1a] bg-[#0d0d0d]'
                              }`}
                            >
                              {/* Step header */}
                              <div
                                className="px-3 py-2.5 flex items-center justify-between cursor-pointer"
                                onClick={() => setExpandedEmail(isEmailExpanded ? null : `${lead.id}-${item.step}`)}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  {isSent
                                    ? <CheckCircle size={13} className="text-[#39ff14] flex-shrink-0" />
                                    : isCurrent
                                    ? <Clock size={13} className="text-yellow-500 flex-shrink-0" />
                                    : <div className="w-3 h-3 rounded-full border border-gray-700 flex-shrink-0" />
                                  }
                                  <div className="min-w-0">
                                    <div className="text-xs text-gray-500">{item.label} · {item.delay}</div>
                                    <div className="text-sm text-white truncate">{item.subject}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                  {log && (
                                    <span className="text-xs text-gray-600">
                                      {new Date(log.sent_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                    </span>
                                  )}
                                  {!isSent && (
                                    <span className={`text-xs font-medium ${isCurrent ? 'text-yellow-500' : 'text-gray-600'}`}>
                                      {isCurrent ? 'Pending' : 'Queued'}
                                    </span>
                                  )}
                                  {isEmailExpanded ? <ChevronUp size={12} className="text-gray-600" /> : <ChevronDown size={12} className="text-gray-600" />}
                                </div>
                              </div>

                              {/* Full email body */}
                              {isEmailExpanded && (
                                <div className="border-t border-[#1e1e1e] px-3 py-3">
                                  <div className="text-xs text-gray-500 mb-1 font-medium">Subject: <span className="text-gray-300">{item.subject}</span></div>
                                  <pre className="text-xs text-gray-400 whitespace-pre-wrap leading-relaxed font-sans">{item.body}</pre>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
