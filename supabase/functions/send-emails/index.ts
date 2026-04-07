import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// Brevo accounts loaded from request header (set in app Settings) or env secrets as fallback

const DAILY_LIMIT = 300

const SEQUENCES = [
  {
    id: 1,
    subject: "Your next client posted this morning",
    body: `Most founders pay for lists that are 6 months old and wonder why nobody replies.\n\nLeadSynth scans Reddit, LinkedIn, Upwork, and 40+ sources in real time — surfacing people actively posting right now asking for your exact service. Verified contact. Live intent. One click export.\n\nYou're reaching out after the deal is already gone.\n\nSee who's buying today — 10 leads free, no card needed.\n→ https://lead-synth-pro.vercel.app/`,
    followups: [
      { subject: "Still sending cold emails?", body: `LeadSynth shows you people who posted today asking for your service. Verified contact attached.\n\nEvery day you wait, someone else replies first.\n→ https://lead-synth-pro.vercel.app/` },
      { subject: "The deal you didn't know existed", body: `Someone in your niche posted on Reddit this morning looking for exactly what you sell. You didn't see it. Your competitor did.\n\n10 free leads. See what you're missing.\n→ https://lead-synth-pro.vercel.app/` },
      { subject: "Your pipeline is a graveyard", body: `Old data. Stale contacts. People who stopped caring months ago.\n\nLeadSynth surfaces buyers who are active right now — not six months ago.\n\nTest it free. No card.\n→ https://lead-synth-pro.vercel.app/` },
      { subject: "Last one from me", body: `I won't keep following up after this.\n\nBut if closing warm buyers instead of chasing cold lists sounds worth 2 minutes — try it free.\n→ https://lead-synth-pro.vercel.app/` },
      { subject: "One question before I go", body: `Are you still manually prospecting?\n\nBecause right now someone in your niche is actively looking for you. LeadSynth finds them. 10 free leads to prove it.\n→ https://lead-synth-pro.vercel.app/` },
    ]
  },
  { id: 2, subject: "Your competitor just closed your deal", body: `They didn't work harder. They just saw the signal first.\n\nLeadSynth tracks 40+ platforms in real time — Reddit posts, LinkedIn activity, hiring signals, tool switches — and hands you verified buyers before anyone else reaches out.\n\nWhile you're building lists, they're closing deals.\n\n10 free leads. No card. See the difference.\n→ https://lead-synth-pro.vercel.app/`, followups: [{ subject: "They're already using this", body: `Intent data isn't new. Your competitors are already on it.\n\nThe only question is whether you want to catch up or keep losing deals you never saw.\n→ https://lead-synth-pro.vercel.app/` }, { subject: "First mover wins every time", body: `The person who reaches out first to a warm buyer wins 80% of the time.\n\nLeadSynth puts you first. 10 free leads to see it live.\n→ https://lead-synth-pro.vercel.app/` }, { subject: "The edge you're missing", body: `Your offer is good. Your timing is off.\n\nLeadSynth fixes the timing. That's the whole game.\n→ https://lead-synth-pro.vercel.app/` }, { subject: "Still grinding cold outreach?", body: `There's a version of your business where every outreach lands because the person was already looking.\n\nLeadSynth builds that version. 10 free leads.\n→ https://lead-synth-pro.vercel.app/` }, { subject: "Before I stop following up", body: `Someone right now is posting about needing what you sell.\n\nLeadSynth shows you who. 10 leads free. No card.\n→ https://lead-synth-pro.vercel.app/` }] },
  { id: 3, subject: "You don't have a lead problem", body: `You have a timing problem.\n\nYou're reaching out too early — they're not ready. Too late — someone else already closed them.\n\nLeadSynth tracks real-time intent signals across 40+ platforms so you know exactly when someone is actively looking for what you sell.\n\nNot last month's data. Right now.\n\n10 free leads. No card needed.\n→ https://lead-synth-pro.vercel.app/`, followups: [{ subject: "The 72 hour window", body: `Most buying decisions happen in a 72 hour window.\n\nLeadSynth shows you who's in that window right now.\n\n10 free leads to see it.\n→ https://lead-synth-pro.vercel.app/` }, { subject: "Wrong time = no reply", body: `It's not your email. It's not your offer. It's your timing.\n\nLeadSynth fixes timing. That's it.\n→ https://lead-synth-pro.vercel.app/` }, { subject: "Real buyers. Right now.", body: `Not a scraped list. Not old data.\n\nPeople posting today on Reddit, LinkedIn, Upwork asking for your exact service.\n\nSee them free.\n→ https://lead-synth-pro.vercel.app/` }, { subject: "This is why cold email dies", body: `Cold email fails because you're sending to people who aren't thinking about buying.\n\nLeadSynth sends you to people who are.\n→ https://lead-synth-pro.vercel.app/` }, { subject: "Last nudge", body: `10 free leads. No card. 2 minutes.\n\nSee who's actively looking for you right now.\n→ https://lead-synth-pro.vercel.app/` }] },
  { id: 4, subject: "400M people post on Reddit every month", body: `Some of them are asking for exactly what you sell.\n\nRight now. Today.\n\nLeadSynth scans Reddit, LinkedIn, Upwork, Twitter, Facebook Groups, Quora, ProductHunt, Discord and 30+ more — extracts the ones asking for your service — and hands you their verified contact info.\n\nYou just show up at the right moment.\n\n10 free leads. No credit card.\n→ https://lead-synth-pro.vercel.app/`, followups: [{ subject: "They asked. Did you answer?", body: `Someone posted today asking for your exact service.\n\nLeadSynth found them. Did you reach out?\n\n10 free leads to start.\n→ https://lead-synth-pro.vercel.app/` }, { subject: "40+ platforms. One dashboard.", body: `Reddit. LinkedIn. Upwork. Twitter. Discord. Quora.\n\nLeadSynth watches all of them so you don't have to.\n\nTest it free.\n→ https://lead-synth-pro.vercel.app/` }, { subject: "The post that could close", body: `Every day there are posts out there that could turn into your next deal.\n\nLeadSynth finds them before they go cold.\n→ https://lead-synth-pro.vercel.app/` }, { subject: "Warm beats cold every time", body: `A warm lead who posted asking for help converts 5x better than a cold contact.\n\nLeadSynth gives you warm. Free to test.\n→ https://lead-synth-pro.vercel.app/` }, { subject: "Still here?", body: `10 leads. Free. No card. Takes 2 minutes.\n\nJust go see who's looking for you right now.\n→ https://lead-synth-pro.vercel.app/` }] },
  { id: 5, subject: "Stop paying for dead data", body: `Most lead databases are 6-12 months old.\n\nBy the time you buy the list, the companies have changed tools, hired someone else, or already signed a contract.\n\nLeadSynth tracks live signals — hiring activity, tool switches, funding rounds, real-time posts — so every lead you get is in motion right now.\n\nSee the difference yourself. 10 leads free.\n→ https://lead-synth-pro.vercel.app/`, followups: [{ subject: "Fresh vs stale", body: `Stale data = ignored emails.\nFresh signals = closed deals.\n\nLeadSynth gives you fresh. Always.\n→ https://lead-synth-pro.vercel.app/` }, { subject: "When did you last close from a list?", body: `Cold lists have a 1-3% reply rate on a good day.\n\nWarm intent leads? Completely different game.\n\nTest the difference free.\n→ https://lead-synth-pro.vercel.app/` }, { subject: "Live signals. Not old records.", body: `LeadSynth doesn't pull from a database.\n\nIt scans the internet live — right now — and finds people actively looking.\n\n10 free leads to see it.\n→ https://lead-synth-pro.vercel.app/` }, { subject: "Your next client is online right now", body: `Posting. Asking. Looking for exactly what you offer.\n\nLeadSynth finds them in real time.\n→ https://lead-synth-pro.vercel.app/` }, { subject: "Last one", body: `Dead data costs you deals you never knew you lost.\n\nLive intent data changes everything. See it free.\n→ https://lead-synth-pro.vercel.app/` }] },
  { id: 6, subject: "What if you only reached out to people already halfway to buying?", body: `No convincing. No nurturing. No cold shoulder.\n\nJust people who already know they have a problem — and are actively looking for someone like you to solve it.\n\nLeadSynth surfaces them from Reddit, LinkedIn, Upwork and 37 other platforms. Verified email. Pain point. Platform. All in one export.\n\n10 free leads. No card.\n→ https://lead-synth-pro.vercel.app/`, followups: [{ subject: "Halfway there already", body: `The hardest part of sales is creating desire.\n\nLeadSynth gives you people who already have it.\n\nTest free.\n→ https://lead-synth-pro.vercel.app/` }, { subject: "They're already looking", body: `You don't need to convince them they have a problem.\n\nThey already know. They already posted about it.\n\nYou just need to show up.\n→ https://lead-synth-pro.vercel.app/` }, { subject: "Pain point included", body: `Every warm lead comes with what they said, where they said it, and why they need help.\n\nYou walk in already knowing everything.\n→ https://lead-synth-pro.vercel.app/` }, { subject: "The easiest close you'll ever make", body: `When someone already wants what you sell — the close is just a conversation.\n\nLeadSynth finds those people. 10 free.\n→ https://lead-synth-pro.vercel.app/` }, { subject: "Still cold prospecting?", body: `There's a warmer way.\n\n10 leads free. No card.\n→ https://lead-synth-pro.vercel.app/` }] },
  { id: 7, subject: "Your outreach isn't bad. Your list is.", body: `Great copy. Perfect subject line. Solid offer.\n\nSent to someone who doesn't need what you sell right now.\n\nThat's the problem.\n\nLeadSynth gives you people actively looking for your service today. The same outreach hits completely different when the timing is right.\n\n10 free leads. See for yourself.\n→ https://lead-synth-pro.vercel.app/`, followups: [{ subject: "Same email. Different results.", body: `The email that gets ignored on a cold list gets replied to by a warm lead.\n\nSame words. Different timing.\n\nLeadSynth gives you the timing.\n→ https://lead-synth-pro.vercel.app/` }, { subject: "It's not your copy", body: `You've tested subject lines. You've A/B'd your CTA.\n\nThe problem was never the email. It was who you were sending it to.\n→ https://lead-synth-pro.vercel.app/` }, { subject: "Right person. Right time.", body: `That's the whole formula.\n\nLeadSynth handles both. 10 free leads.\n→ https://lead-synth-pro.vercel.app/` }, { subject: "Better list = better results", body: `Stop blaming the copy.\n\nStart with people who actually need you right now.\n\nTest free.\n→ https://lead-synth-pro.vercel.app/` }, { subject: "One last thing", body: `10 leads. Free. No card.\n\nJust try it and see if your results change.\n→ https://lead-synth-pro.vercel.app/` }] },
  { id: 8, subject: "Hiring signals. Funding rounds. Tool switches.", body: `These are the moments companies are most likely to buy.\n\nWhen a company just raised — they spend. When they're hiring fast — they need tools. When they switch tools — there's a gap.\n\nLeadSynth tracks all of it. In real time. Across thousands of companies.\n\nSo when you reach out, it's not random. It's perfectly timed.\n\n10 free leads. No card.\n→ https://lead-synth-pro.vercel.app/`, followups: [{ subject: "They just raised. Now what?", body: `Companies that just raised are 3x more likely to buy new tools in the next 90 days.\n\nLeadSynth tracks funding signals in real time.\n→ https://lead-synth-pro.vercel.app/` }, { subject: "Hiring = buying signal", body: `When a company posts a job — they're growing. Growing companies buy.\n\nLeadSynth catches this signal before anyone else.\n→ https://lead-synth-pro.vercel.app/` }, { subject: "The signals most people miss", body: `Tool switches. Team expansions. New hires in key roles.\n\nAll buying signals. All tracked by LeadSynth.\n\nTest free.\n→ https://lead-synth-pro.vercel.app/` }, { subject: "Not guesses. Signals.", body: `LeadSynth doesn't predict who might buy.\n\nIt shows you who's already moving. Real signals. Real timing.\n→ https://lead-synth-pro.vercel.app/` }, { subject: "Last signal from me", body: `10 free leads. No card. See the signals yourself.\n→ https://lead-synth-pro.vercel.app/` }] },
  { id: 9, subject: "1 credit. 1 verified founder. Direct contact.", body: `Name. Email. LinkedIn. Company. Phone.\n\nAll verified. All real. All decision makers.\n\nLeadSynth gives you B2B contacts that are LinkedIn-verified with direct email — not some generic info@ address that goes nowhere.\n\nYou tell us the niche, location, and service. We hand you the founder.\n\n10 free credits. No card needed.\n→ https://lead-synth-pro.vercel.app/`, followups: [{ subject: "Real decision makers only", body: `No gatekeepers. No info@ emails. No LinkedIn requests that go unanswered.\n\nDirect founder contacts. Verified.\n→ https://lead-synth-pro.vercel.app/` }, { subject: "Your niche. Your location. Your leads.", body: `LeadSynth doesn't give you a generic list.\n\nYou specify exactly who you want. We find them.\n\n10 free to test.\n→ https://lead-synth-pro.vercel.app/` }, { subject: "Verified email or it doesn't count", body: `Bounced emails kill your domain reputation.\n\nEvery LeadSynth contact is verified before it reaches you.\n→ https://lead-synth-pro.vercel.app/` }, { subject: "Founder name. Verified title. Direct line.", body: `That's what every cold lead from LeadSynth includes.\n\nNo guessing. No scraping. Real data.\n→ https://lead-synth-pro.vercel.app/` }, { subject: "Last one", body: `10 free verified founder contacts.\n\nNo card. Takes 2 minutes.\n→ https://lead-synth-pro.vercel.app/` }] },
  { id: 10, subject: "The leads that were going to buy anyway", body: `Some people are just ready.\n\nThey have the budget. They have the problem. They're actively looking.\n\nYou just never knew they existed.\n\nLeadSynth finds them — across Reddit, LinkedIn, Upwork, Discord, Quora and 35 more platforms — and hands you everything you need to close.\n\nThey were going to buy from someone. Make sure it's you.\n\n10 free leads. No card.\n→ https://lead-synth-pro.vercel.app/`, followups: [{ subject: "They were going to buy anyway", body: `The only question was who they'd buy from.\n\nLeadSynth makes sure it's you.\n\n10 free leads.\n→ https://lead-synth-pro.vercel.app/` }, { subject: "Budget. Problem. Looking.", body: `That's the perfect lead.\n\nLeadSynth finds them in real time across 40+ platforms.\n\nTest free.\n→ https://lead-synth-pro.vercel.app/` }, { subject: "Someone else is closing them", body: `Right now. While you're reading this.\n\nA warm lead just got claimed by someone who saw the signal first.\n\nDon't let that keep happening.\n→ https://lead-synth-pro.vercel.app/` }, { subject: "The easiest pipeline you'll ever build", body: `People already looking for what you sell.\n\nVerified contacts. Live signals. One click export.\n\nLeadSynth. Free to start.\n→ https://lead-synth-pro.vercel.app/` }, { subject: "Final email", body: `10 leads. Free. No card. 2 minutes.\n\nFind the buyers who were going to buy anyway.\n→ https://lead-synth-pro.vercel.app/` }] },
]

async function sendEmail(brevoKey: string, fromEmail: string, toEmail: string, subject: string, body: string) {
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

serve(async (req) => {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { ...headers, 'Access-Control-Allow-Headers': 'authorization, content-type, x-brevo-accounts' } })
  }

  // Load Brevo accounts from request header (passed from app) or env secrets
  let BREVO_ACCOUNTS: { key: string, email: string }[] = []
  const headerAccounts = req.headers.get('x-brevo-accounts')
  if (headerAccounts) {
    try { BREVO_ACCOUNTS = JSON.parse(headerAccounts).filter((a: any) => a.key && a.email) } catch (_) {}
  }
  if (BREVO_ACCOUNTS.length === 0) {
    BREVO_ACCOUNTS = [
      { key: Deno.env.get('BREVO_KEY_1') || '', email: Deno.env.get('BREVO_EMAIL_1') || '' },
      { key: Deno.env.get('BREVO_KEY_2') || '', email: Deno.env.get('BREVO_EMAIL_2') || '' },
      { key: Deno.env.get('BREVO_KEY_3') || '', email: Deno.env.get('BREVO_EMAIL_3') || '' },
    ].filter(a => a.key && a.email)
  }

  if (BREVO_ACCOUNTS.length === 0) {
    return new Response(JSON.stringify({ ok: false, error: 'No Brevo accounts configured' }), { status: 400, headers })
  }

  try {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const fired: string[] = []

    // Track daily count per sender
    const dailyCounts: Record<string, number> = {}
    for (const acc of BREVO_ACCOUNTS) {
      const { count } = await supabase.from('email_logs').select('*', { count: 'exact', head: true })
        .eq('brevo_sender', acc.email).gte('sent_at', `${today}T00:00:00`)
      dailyCounts[acc.email] = count || 0
    }

    // STEP 1: Fire follow-ups that are due
    const { data: followupLeads } = await supabase.from('leads').select('*')
      .eq('status', 'active').gt('current_step', 0)
      .lte('next_send_at', now.toISOString())
      .order('next_send_at', { ascending: true }).limit(500)

    for (const lead of (followupLeads || [])) {
      const sender = lead.brevo_sender
      if ((dailyCounts[sender] || 0) >= DAILY_LIMIT) continue
      const seq = SEQUENCES.find(s => s.id === lead.sequence_id)
      if (!seq) continue
      const followup = seq.followups[lead.current_step - 1]
      if (!followup) continue
      try {
        await sendEmail(lead.brevo_key, sender, lead.email, followup.subject, followup.body)
        const nextStep = lead.current_step + 1
        const isDone = nextStep > seq.followups.length
        await supabase.from('email_logs').insert({ lead_id: lead.id, step: lead.current_step, subject: followup.subject, sent_at: now.toISOString(), status: 'sent', brevo_sender: sender })
        await supabase.from('leads').update({ current_step: isDone ? lead.current_step : nextStep, status: isDone ? 'done' : 'active', next_send_at: isDone ? null : new Date(now.getTime() + 86400000).toISOString() }).eq('id', lead.id)
        dailyCounts[sender] = (dailyCounts[sender] || 0) + 1
        fired.push(lead.email)
      } catch (e) { console.error(`Followup failed ${lead.email}:`, e) }
    }

    // STEP 2: Fire pending main emails
    const { data: newLeads } = await supabase.from('leads').select('*')
      .eq('status', 'pending').eq('current_step', 0)
      .lte('next_send_at', now.toISOString())
      .order('created_at', { ascending: true }).limit(500)

    for (const lead of (newLeads || [])) {
      const sender = lead.brevo_sender
      if ((dailyCounts[sender] || 0) >= DAILY_LIMIT) continue
      const seq = SEQUENCES.find(s => s.id === lead.sequence_id)
      if (!seq) continue
      try {
        await sendEmail(lead.brevo_key, sender, lead.email, seq.subject, seq.body)
        await supabase.from('email_logs').insert({ lead_id: lead.id, step: 0, subject: seq.subject, sent_at: now.toISOString(), status: 'sent', brevo_sender: sender })
        await supabase.from('leads').update({ current_step: 1, status: 'active', next_send_at: new Date(now.getTime() + 86400000).toISOString() }).eq('id', lead.id)
        dailyCounts[sender] = (dailyCounts[sender] || 0) + 1
        fired.push(lead.email)
      } catch (e) { console.error(`Main email failed ${lead.email}:`, e) }
    }

    return new Response(JSON.stringify({ ok: true, fired: fired.length, emails: fired }), { headers })
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers })
  }
})
