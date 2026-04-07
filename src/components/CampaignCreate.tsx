import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { SEQUENCES } from '../lib/sequences'
import { toast } from 'react-hot-toast'
import { Rocket, Loader2, Users, Mail, Calendar } from 'lucide-react'

const BREVO_ACCOUNTS = [
  { key: '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', email: 'official.zmarketing@gmail.com' },
  { key: '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', email: 'z.advertisements.agency@gmail.com' },
  { key: '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', email: 'infozeta.digitalmarketing@gmail.com' },
]

// Send directly via Brevo API from browser
async function sendViaBrevo(brevoKey: string, fromEmail: string, toEmail: string, subject: string, body: string) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': brevoKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'Z', email: fromEmail },
      to: [{ email: toEmail }],
      subject,
      textContent: body,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Brevo: ${err}`)
  }
  return true
}

interface Props { onCreated: () => void }

export default function CampaignCreate({ onCreated }: Props) {
  const [name, setName] = useState('')
  const [emailsRaw, setEmailsRaw] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })

  function parseEmails(raw: string): string[] {
    return raw
      .split(/[\n,;]+/)
      .map(e => e.trim().toLowerCase())
      .filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
  }

  async function handleLaunch() {
    if (!name.trim()) { toast.error('Enter a campaign name'); return }
    const emails = parseEmails(emailsRaw)
    if (emails.length === 0) { toast.error('No valid emails found'); return }

    setLoading(true)
    setProgress({ current: 0, total: emails.length })

    try {
      // 1. Create campaign in DB
      const { data: campaign, error: campErr } = await supabase
        .from('campaigns')
        .insert({ name: name.trim(), total_leads: emails.length, status: 'active' })
        .select()
        .single()
      if (campErr) throw campErr

      // 2. Get current lead count for rotation
      const { count: totalLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })

      const baseCount = totalLeads || 0
      const now = new Date()
      const nextDay = new Date(now.getTime() + 24 * 60 * 60 * 1000)

      // 3. Build lead records
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
          next_send_at: nextDay.toISOString(), // follow-ups start tomorrow
        }
      })

      const { data: insertedLeads, error: leadsErr } = await supabase
        .from('leads')
        .insert(leadsToInsert)
        .select()
      if (leadsErr) throw leadsErr

      // 4. Fire main email immediately for each lead
      let sent = 0
      let failed = 0

      for (let i = 0; i < (insertedLeads || []).length; i++) {
        const lead = insertedLeads![i]
        const seq = SEQUENCES.find(s => s.id === lead.sequence_id)!
        const brevo = BREVO_ACCOUNTS[i % 3]

        try {
          await sendViaBrevo(lead.brevo_key, lead.brevo_sender, lead.email, seq.subject, seq.body)

          // Mark as active (step 1 = waiting for first follow-up)
          await supabase.from('leads').update({
            status: 'active',
            current_step: 1,
            next_send_at: nextDay.toISOString(),
          }).eq('id', lead.id)

          // Log it
          await supabase.from('email_logs').insert({
            lead_id: lead.id,
            step: 0,
            subject: seq.subject,
            sent_at: now.toISOString(),
            status: 'sent',
            brevo_sender: lead.brevo_sender,
          })

          sent++
        } catch (e) {
          failed++
          console.error(`Failed ${lead.email}:`, e)
        }

        setProgress({ current: i + 1, total: emails.length })
      }

      if (sent > 0) {
        toast.success(`🚀 ${sent} emails sent!${failed > 0 ? ` (${failed} failed)` : ''}`)
      } else {
        toast.error('All sends failed — check Brevo keys')
      }
      onCreated()
    } catch (e: any) {
      toast.error(e.message || 'Something went wrong')
    } finally {
      setLoading(false)
      setProgress({ current: 0, total: 0 })
    }
  }

  const parsed = parseEmails(emailsRaw)

  return (
    <div className="max-w-xl mx-auto px-1">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">New Campaign</h1>
        <p className="text-gray-500 text-sm mt-1">Emails fire instantly. 5 follow-ups over 5 days, fully automatic.</p>
      </div>

      <div className="space-y-4">
        <div className="bg-[#111] border border-[#222] rounded-2xl p-4">
          <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Campaign Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. April Outreach"
            className="w-full bg-transparent text-white text-lg font-medium placeholder-gray-700 focus:outline-none"
          />
        </div>

        <div className="bg-[#111] border border-[#222] rounded-2xl p-4">
          <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">
            Lead Emails
            {parsed.length > 0 && <span className="ml-2 text-[#39ff14] normal-case font-medium">{parsed.length} detected</span>}
          </label>
          <textarea
            value={emailsRaw}
            onChange={e => setEmailsRaw(e.target.value)}
            placeholder={"Paste emails here...\n\njohn@company.com\njane@startup.io"}
            rows={10}
            className="w-full bg-transparent text-white placeholder-gray-700 focus:outline-none font-mono text-sm resize-none leading-relaxed"
          />
        </div>

        {parsed.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <Users size={16} />, value: parsed.length, label: 'Leads' },
              { icon: <Mail size={16} />, value: parsed.length * 6, label: 'Emails' },
              { icon: <Calendar size={16} />, value: '6d', label: 'Duration' },
            ].map(s => (
              <div key={s.label} className="bg-[#111] border border-[#222] rounded-2xl p-3 text-center">
                <div className="text-gray-500 flex justify-center mb-1">{s.icon}</div>
                <div className="text-xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-gray-600">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Progress bar while sending */}
        {loading && progress.total > 0 && (
          <div className="bg-[#111] border border-[#222] rounded-2xl p-4">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>Sending emails...</span>
              <span>{progress.current}/{progress.total}</span>
            </div>
            <div className="w-full bg-[#1a1a1a] rounded-full h-2">
              <div
                className="bg-[#39ff14] h-2 rounded-full transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        <button
          onClick={handleLaunch}
          disabled={loading || parsed.length === 0 || !name.trim()}
          className="w-full py-4 rounded-2xl font-bold text-black bg-[#39ff14] hover:bg-[#2de010] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-base"
        >
          {loading ? (
            <><Loader2 size={18} className="animate-spin" /> Sending {progress.current}/{progress.total}...</>
          ) : (
            <><Rocket size={18} /> Launch &amp; Send Now</>
          )}
        </button>

        <p className="text-center text-xs text-gray-700 pb-2">
          Main email fires now · follow-ups auto-send daily for 5 days
        </p>
      </div>
    </div>
  )
}
