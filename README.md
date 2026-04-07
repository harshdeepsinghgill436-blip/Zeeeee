# LeadSynth Mailer

## Deploy to Vercel
1. Push to GitHub
2. Import repo in Vercel
3. Deploy (no env vars needed — everything is hardcoded)

## Setup Supabase (ONE TIME)
1. Go to your Supabase project → SQL Editor
2. Paste and run the contents of `supabase/schema.sql`
3. Go to Edge Functions → Deploy `supabase/functions/send-emails/index.ts`
4. Go to Edge Functions → Schedules → Add cron: `0 * * * *` (every hour)

That's it. The scheduler runs every hour 24/7.
