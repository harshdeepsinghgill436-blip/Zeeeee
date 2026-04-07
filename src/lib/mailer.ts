import { supabase } from './supabase'
import { loadBrevoAccounts } from '../components/Settings'

const SUPABASE_URL = 'https://gnmqquorrhtnpmuzoitc.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdubXFxdW9ycmh0bnBtdXpvaXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NDA5MDIsImV4cCI6MjA5MTExNjkwMn0.5yONIzbbcHlT_RFm9DVk9FQ8bhJuofa28Q-A_P8nWxE'

export async function processDueFollowups(): Promise<number> {
  const brevoAccounts = loadBrevoAccounts().filter(a => a.key && a.email)
  if (brevoAccounts.length === 0) return 0

  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-emails`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'x-brevo-accounts': JSON.stringify(brevoAccounts),
    },
  })

  if (!res.ok) return 0
  const data = await res.json()
  return data.fired || 0
}
