import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'
import { Upload, Loader2 } from 'lucide-react'

const BREVO_ACCOUNTS = [
  { key: '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', email: 'official.zmarketing@gmail.com' },
  { key: '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', email: 'z.advertisements.agency@gmail.com' },
  { key: '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', email: 'infozeta.digitalmarketing@gmail.com' },
]

interface Props { onCreated: () => void }

export default function CampaignCreate({ onCreated }: Props) {
  const [name, setName] = useState('')
  const [emailsRaw, setEmailsRaw] = useState('')
  const [loading, setLoading] = useState(false)

  function parseEmails(raw: string): string[] {
    return raw
      .split(/[\n,;]+/)
      .map(e => e.trim().toLowerCase())
      .filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
  }

  async function getNextSequenceIndex(): Promise<number> {
    const { count } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
    return (count || 0) % 10
  }

  async function getNextBrevoIndex(): Promise<number> {
    const { count } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
    return (count || 0) % 3
  }

  async function handleLaunch() {
    if (!name.trim()) { toast.error('Enter a campaign name'); return }
    const emails = parseEmails(emailsRaw)
    if (emails.length === 0) { toast.error('No valid emails found'); return }

    setLoading(true)
    try {
      // Create campaign
      const { data: campaign, error: campErr } = await supabase
        .from('campaigns')
        .insert({ name: name.trim(), total_leads: emails.length, status: 'active' })
        .select()
        .single()

      if (campErr) throw campErr

      // Get current counts for rotation
      const { count: totalLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })

      const baseCount = totalLeads || 0

      const now = new Date()
      const leadsToInsert = emails.map((email, i) => {
        const globalIndex = baseCount + i
        const sequenceId = (globalIndex % 10) + 1
        const brevoIndex = globalIndex % 3
        const brevo = BREVO_ACCOUNTS[brevoIndex]

        return {
          campaign_id: campaign.id,
          email,
          sequence_id: sequenceId,
          brevo_key: brevo.key,
          brevo_sender: brevo.email,
          status: 'pending',
          current_step: 0,
          next_send_at: now.toISOString(),
        }
      })

      const { error: leadsErr } = await supabase
        .from('leads')
        .insert(leadsToInsert)

      if (leadsErr) throw leadsErr

      toast.success(`Campaign created with ${emails.length} leads!`)
      onCreated()
    } catch (e: any) {
      toast.error(e.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const parsed = parseEmails(emailsRaw)

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">New Campaign</h1>
      <p className="text-gray-500 text-sm mb-8">Paste your leads, name your campaign, launch. That's it.</p>

      <div className="space-y-5">
        {/* Campaign name */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Campaign Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. April Outreach Batch 1"
            className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#39ff14] transition-colors"
          />
        </div>

        {/* Email paste */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Lead Emails
            <span className="ml-2 text-[#39ff14]">{parsed.length > 0 ? `${parsed.length} valid emails detected` : 'paste line by line or comma separated'}</span>
          </label>
          <textarea
            value={emailsRaw}
            onChange={e => setEmailsRaw(e.target.value)}
            placeholder={`john@company.com\njane@startup.io\nbob@agency.com\n\nor: john@company.com, jane@startup.io, bob@agency.com`}
            rows={12}
            className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#39ff14] transition-colors font-mono text-sm resize-none"
          />
        </div>

        {/* Info cards */}
        {parsed.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-[#39ff14]">{parsed.length}</div>
              <div className="text-xs text-gray-500 mt-1">Leads</div>
            </div>
            <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">{parsed.length * 6}</div>
              <div className="text-xs text-gray-500 mt-1">Total Emails</div>
            </div>
            <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">6d</div>
              <div className="text-xs text-gray-500 mt-1">Per Lead</div>
            </div>
          </div>
        )}

        <button
          onClick={handleLaunch}
          disabled={loading || parsed.length === 0 || !name.trim()}
          className="w-full py-4 rounded-xl font-bold text-black bg-[#39ff14] hover:bg-[#2de010] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-lg"
        >
          {loading ? <><Loader2 size={20} className="animate-spin" /> Launching...</> : <><Upload size={20} /> Launch Campaign</>}
        </button>

        <p className="text-center text-xs text-gray-600">
          Emails fire via Supabase 24/7 — safe to close this window after launching.
        </p>
      </div>
    </div>
  )
}
