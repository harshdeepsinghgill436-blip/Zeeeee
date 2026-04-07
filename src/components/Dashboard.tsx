import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'
import { Search, Trash2, Eye, ChevronDown, ChevronUp, RefreshCw, CheckCircle, Clock, XCircle, Send } from 'lucide-react'
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
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, sent: 0, pending: 0, done: 0 })

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [{ data: c }, { data: l }] = await Promise.all([
      supabase.from('campaigns').select('*').order('created_at', { ascending: false }),
      supabase.from('leads').select('*, campaigns(name), email_logs(*)').order('created_at', { ascending: false }),
    ])
    setCampaigns(c || [])
    setLeads(l || [])
    const allLeads = l || []
    setStats({
      total: allLeads.length,
      sent: allLeads.filter(x => x.current_step > 0).length,
      pending: allLeads.filter(x => x.status === 'pending' || x.status === 'active').length,
      done: allLeads.filter(x => x.status === 'done').length,
    })
    setLoading(false)
  }

  async function deleteLead(id: string) {
    await supabase.from('leads').update({ status: 'deleted' }).eq('id', id)
    toast.success('Lead removed — no more emails will be sent')
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

  function stepLabel(step: number) {
    if (step === 0) return 'Main Email'
    return `Follow-up ${step}`
  }

  function statusIcon(status: string) {
    if (status === 'done') return <CheckCircle size={14} className="text-[#39ff14]" />
    if (status === 'deleted') return <XCircle size={14} className="text-red-500" />
    return <Clock size={14} className="text-yellow-500" />
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <RefreshCw size={24} className="animate-spin text-[#39ff14]" />
    </div>
  )

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Leads', value: stats.total, color: 'text-white' },
          { label: 'Active', value: stats.pending, color: 'text-yellow-400' },
          { label: 'Started', value: stats.sent, color: 'text-blue-400' },
          { label: 'Completed', value: stats.done, color: 'text-[#39ff14]' },
        ].map(s => (
          <div key={s.label} className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5">
            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Campaigns */}
      {campaigns.filter(c => c.status !== 'cancelled').length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Campaigns</h2>
          <div className="space-y-2">
            {campaigns.filter(c => c.status !== 'cancelled').map(c => (
              <div key={c.id} className="bg-[#111] border border-[#1e1e1e] rounded-xl px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{c.total_leads} leads · {new Date(c.created_at).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${c.status === 'active' ? 'bg-green-900/40 text-green-400' : 'bg-gray-800 text-gray-400'}`}>
                    {c.status}
                  </span>
                  <button onClick={() => deleteCampaign(c.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search + Leads */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by email or campaign..."
              className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl pl-9 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#39ff14] transition-colors text-sm"
            />
          </div>
          <button onClick={fetchAll} className="p-3 bg-[#111] border border-[#2a2a2a] rounded-xl text-gray-400 hover:text-white transition-colors">
            <RefreshCw size={16} />
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-600">
            <Send size={40} className="mx-auto mb-3 opacity-30" />
            <div>No leads yet. Create a campaign to get started.</div>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(lead => {
              const seq = SEQUENCES.find(s => s.id === lead.sequence_id)
              const isExpanded = expandedLead === lead.id
              const logs = lead.email_logs || []

              return (
                <div key={lead.id} className="bg-[#111] border border-[#1e1e1e] rounded-xl overflow-hidden">
                  <div className="px-5 py-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {statusIcon(lead.status)}
                        <span className="font-mono text-sm truncate">{lead.email}</span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1 flex gap-3">
                        <span>Campaign: {lead.campaigns?.name || '—'}</span>
                        <span>Copy #{lead.sequence_id}</span>
                        <span>Step: {stepLabel(lead.current_step)}</span>
                        {lead.status !== 'done' && lead.next_send_at && (
                          <span>Next: {new Date(lead.next_send_at).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setExpandedLead(isExpanded ? null : lead.id)}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-white px-3 py-1.5 bg-[#1a1a1a] rounded-lg transition-colors"
                      >
                        <Eye size={13} />
                        View
                        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                      <button
                        onClick={() => deleteLead(lead.id)}
                        className="p-1.5 text-gray-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-[#1e1e1e] px-5 py-4 space-y-3">
                      <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Email Sequence — Copy #{lead.sequence_id}</div>
                      {seq && (
                        <div className="space-y-2">
                          {[{ step: 0, subject: seq.subject, label: 'Main Email', delay: 'Immediately' },
                            ...seq.followups.map((f, i) => ({ step: i + 1, subject: f.subject, label: `Follow-up ${i + 1}`, delay: `+${(i + 1) * 24}h` }))
                          ].map(item => {
                            const log = logs.find(l => l.step === item.step)
                            return (
                              <div key={item.step} className="flex items-center justify-between bg-[#0d0d0d] rounded-lg px-4 py-3">
                                <div>
                                  <div className="text-xs text-gray-500">{item.label} · {item.delay}</div>
                                  <div className="text-sm text-white mt-0.5">{item.subject}</div>
                                </div>
                                <div className="text-right">
                                  {log ? (
                                    <div className="flex items-center gap-1 text-[#39ff14] text-xs">
                                      <CheckCircle size={12} />
                                      {new Date(log.sent_at).toLocaleDateString()}
                                    </div>
                                  ) : (
                                    <div className="text-xs text-gray-600">
                                      {lead.current_step > item.step ? 'Sent' : lead.current_step === item.step ? <span className="text-yellow-500">Pending</span> : 'Queued'}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
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
