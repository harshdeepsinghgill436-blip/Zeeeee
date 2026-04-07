import { supabase } from './supabase'
import { SEQUENCES } from './sequences'

const BREVO_ACCOUNTS = [
  { key: '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', email: 'official.zmarketing@gmail.com' },
  { key: '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', email: 'z.advertisements.agency@gmail.com' },
  { key: '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', email: 'infozeta.digitalmarketing@gmail.com' },
]

const DAILY_LIMIT = 300

export async function sendViaBrevo(brevoKey: string, fromEmail: string, toEmail: string, subject: string, body: string) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': brevoKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender: { name: 'Z', email: fromEmail },
      to: [{ email: toEmail }],
      subject,
      textContent: body,
    }),
  })
  if (!res.ok) throw new Error(await res.text())
  return true
}

// Run this whenever the app is open — fires any due follow-ups
export async function processDueFollowups(): Promise<number> {
  const now = new Date()
  const today = now.toISOString().split('T')[0]

  // Get daily sent counts per sender
  const dailyCounts: Record<string, number> = {}
  for (const acc of BREVO_ACCOUNTS) {
    const { count } = await supabase
      .from('email_logs')
      .select('*', { count: 'exact', head: true })
      .eq('brevo_sender', acc.email)
      .gte('sent_at', `${today}T00:00:00`)
    dailyCounts[acc.email] = count || 0
  }

  // Get all leads with due follow-ups
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .eq('status', 'active')
    .lte('next_send_at', now.toISOString())
    .order('next_send_at', { ascending: true })
    .limit(500)

  let fired = 0

  for (const lead of (leads || [])) {
    const sender = lead.brevo_sender
    if ((dailyCounts[sender] || 0) >= DAILY_LIMIT) continue

    const seq = SEQUENCES.find(s => s.id === lead.sequence_id)
    if (!seq) continue

    const followup = seq.followups[lead.current_step - 1]
    if (!followup) continue

    try {
      await sendViaBrevo(lead.brevo_key, sender, lead.email, followup.subject, followup.body)

      const nextStep = lead.current_step + 1
      const isDone = nextStep > seq.followups.length
      const nextSendAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()

      await supabase.from('email_logs').insert({
        lead_id: lead.id,
        step: lead.current_step,
        subject: followup.subject,
        sent_at: now.toISOString(),
        status: 'sent',
        brevo_sender: sender,
      })

      await supabase.from('leads').update({
        current_step: isDone ? lead.current_step : nextStep,
        status: isDone ? 'done' : 'active',
        next_send_at: isDone ? null : nextSendAt,
      }).eq('id', lead.id)

      dailyCounts[sender] = (dailyCounts[sender] || 0) + 1
      fired++
    } catch (e) {
      console.error(`Follow-up failed for ${lead.email}:`, e)
    }
  }

  return fired
}
