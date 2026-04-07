import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { SEQUENCES } from '../lib/sequences'
import { toast } from 'react-hot-toast'
import { Rocket, Loader2, Users, Mail, Calendar, AlertTriangle, CheckCircle } from 'lucide-react'
import { loadBrevoAccounts } from './Settings'

const SUPABASE_URL = 'https://gnmqquorrhtnpmuzoitc.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdubXFxdW9ycmh0bnBtdXpvaXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NDA5MDIsImV4cCI6MjA5MTExNjkwMn0.5yONIzbbcHlT_RFm9DVk9FQ8bhJuofa28Q-A_P8nWxE'

interface Props { onCreated: () => void; onGoSettings: () => void }

// Handles ALL formats:
// line by line, comma separated, "email 1 foo@x.com", "Email 2: bar@y.com", mixed
function parseEmails(raw: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g
  const found = raw.match(emailRegex) || []
  const unique = [...new Set(found.map(e => e.trim().toLowerCase()))]
  return unique
}

export default function CampaignCreate({ onCreated, onGoSettings }: Props) {
  const [name, setName] = useState('')
  const [emailsRaw, setEmailsRaw] = useState('')
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState('')
  const [imported, setImported] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(false)

  // Live parse as user types
  const parsed = parseEmails(emailsRaw)
  const brevoOk = loadBrevoAccounts().filter(a => a.key && a.email).length > 0

  function handlePaste() {
    // After paste, show imported list
    setTimeout(() => {
      const emails = parseEmails(emailsRaw)
      if (emails.length > 0) setImported(emails)
    }, 50)
  }

  async function handleLaunch() {
    const brevoAccounts = loadBrevoAccounts().filter(a => a.key && a.email)
    if (brevoAccounts.length === 0) {
      toast.error('Add Brevo keys in Settings first')
      onGoSettings()
      return
    }
    if (!name.trim()) { toast.error('Enter a campaign name'); return }
    const emails = parseEmails(emailsRaw)
    if (emails.length === 0) { toast.error('No valid emails found'); return }

    setLoading(true)
    setPhase('Creating campaign...')

    try {
      const { data: campaign, error: campErr } = await supabase
        .from('campaigns')
        .insert({ name: name.trim(), total_leads: emails.length, status: 'active' })
        .select().single()
      if (campErr) throw campErr

      const { count: totalLeads } = await supabase
        .from('leads').select('*', { count: 'exact', head: true })

      const baseCount = totalLeads || 0
      const now = new Date()

      // 5-second gap between each lead's first send
      const leadsToInsert = emails.map((email, i) => {
        const globalIndex = baseCount + i
        const sequenceId = (globalIndex % 10) + 1
        const brevoIndex = globalIndex % brevoAccounts.length
        const brevo = brevoAccounts[brevoIndex]
        const sendAt = new Date(now.getTime() + i * 5000) // 5s gap per email
        return {
          campaign_id: campaign.id,
          email,
          sequence_id: sequenceId,
          brevo_key: brevo.key,
          brevo_sender: brevo.email,
          status: 'pending',
          current_step: 0,
          next_send_at: sendAt.toISOString(),
        }
      })

      setPhase(`Importing ${emails.length} leads...`)

      // Batch insert in chunks of 500 to handle 1M+ leads
      const CHUNK = 500
      for (let i = 0; i < leadsToInsert.length; i += CHUNK) {
        const chunk = leadsToInsert.slice(i, i + CHUNK)
        const { error: leadsErr } = await supabase.from('leads').insert(chunk)
        if (leadsErr) throw leadsErr
        if (leadsToInsert.length > CHUNK) {
          setPhase(`Importing... ${Math.min(i + CHUNK, leadsToInsert.length)}/${leadsToInsert.length}`)
        }
      }

      setPhase('Triggering send...')

      // Call edge function to start firing
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-emails`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'x-brevo-accounts': JSON.stringify(brevoAccounts),
        },
      })

      if (res.ok) {
        const data = await res.json()
        toast.success(`🚀 ${data.fired || 0} emails fired! Rest autopilot.`)
      } else {
        toast.success(`✅ ${emails.length} leads queued — autopilot running!`)
      }

      setImported([])
      setEmailsRaw('')
      setName('')
      onCreated()
    } catch (e: any) {
      toast.error(e.message || 'Something went wrong')
    } finally {
      setLoading(false)
      setPhase('')
    }
  }

  return (
    <div className="max-w-xl mx-auto px-1">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">New Campaign</h1>
        <p className="text-gray-500 text-sm mt-1">Paste any format. Emails fire with 5s gap. 5 follow-ups auto on autopilot.</p>
      </div>

      {!brevoOk && (
        <button
          onClick={onGoSettings}
          className="w-full mb-4 bg-yellow-900/20 border border-yellow-800/40 rounded-2xl px-4 py-3 flex items-center gap-2 text-yellow-400 text-sm hover:bg-yellow-900/30 transition-colors"
        >
          <AlertTriangle size={16} />
          No Brevo keys set — tap to add them in Settings
        </button>
      )}

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
            Paste Emails — any format
            {parsed.length > 0 && (
              <span className="ml-2 text-[#39ff14] normal-case font-medium">{parsed.length} found</span>
            )}
          </label>
          <textarea
            value={emailsRaw}
            onChange={e => { setEmailsRaw(e.target.value); setImported(parseEmails(e.target.value)) }}
            onPaste={handlePaste}
            placeholder={"Paste in any format:\n\njohn@company.com\nEmail 1 jane@startup.io\nemail 2: bob@agency.com\nfoo@x.com, bar@y.com"}
            rows={8}
            className="w-full bg-transparent text-white placeholder-gray-700 focus:outline-none font-mono text-sm resize-none leading-relaxed"
          />
        </div>

        {/* Imported preview */}
        {imported.length > 0 && (
          <div className="bg-[#0d150d] border border-[#1e2e1e] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-[#39ff14]" />
                <span className="text-sm font-medium text-[#39ff14]">{imported.length} emails ready to import</span>
              </div>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="text-xs text-gray-600 hover:text-gray-300"
              >
                {showPreview ? 'hide' : 'preview'}
              </button>
            </div>
            {showPreview && (
              <div className="max-h-32 overflow-y-auto space-y-1 mt-2">
                {imported.map((e, i) => (
                  <div key={i} className="text-xs font-mono text-gray-400">{e}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {parsed.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <Users size={16} />, value: parsed.length.toLocaleString(), label: 'Leads' },
              { icon: <Mail size={16} />, value: (parsed.length * 6).toLocaleString(), label: 'Emails' },
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

        <button
          onClick={handleLaunch}
          disabled={loading || parsed.length === 0 || !name.trim()}
          className="w-full py-4 rounded-2xl font-bold text-black bg-[#39ff14] hover:bg-[#2de010] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-base"
        >
          {loading
            ? <><Loader2 size={18} className="animate-spin" /> {phase}</>
            : <><Rocket size={18} /> Import &amp; Send</>
          }
        </button>

        <p className="text-center text-xs text-gray-700 pb-2">
          5s gap per email · follow-ups run server-side every 5 min · device can be off
        </p>
      </div>
    </div>
  )
}
