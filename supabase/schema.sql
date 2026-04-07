-- ============================================================
-- Run this ONCE in Supabase SQL Editor
-- ============================================================

-- Tables
create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  total_leads int default 0,
  status text default 'active',
  created_at timestamptz default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id),
  email text not null,
  sequence_id int not null,
  brevo_key text not null,
  brevo_sender text not null,
  status text default 'pending',
  current_step int default 0,
  next_send_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists email_logs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  step int not null,
  subject text,
  sent_at timestamptz default now(),
  status text default 'sent',
  brevo_sender text
);

-- Indexes for performance at scale (1M+ leads)
create index if not exists leads_status_step_idx on leads(status, current_step);
create index if not exists leads_next_send_idx on leads(next_send_at) where status in ('active','pending');
create index if not exists leads_campaign_idx on leads(campaign_id);
create index if not exists email_logs_sender_sent_idx on email_logs(brevo_sender, sent_at);
create index if not exists email_logs_lead_idx on email_logs(lead_id);

-- RLS
alter table campaigns enable row level security;
alter table leads enable row level security;
alter table email_logs enable row level security;

create policy "allow all campaigns" on campaigns for all using (true) with check (true);
create policy "allow all leads" on leads for all using (true) with check (true);
create policy "allow all logs" on email_logs for all using (true) with check (true);

-- ============================================================
-- AUTOPILOT: pg_cron fires edge function every 5 minutes
-- Emails send even when device/tab is closed
-- ============================================================

-- Enable pg_cron extension (must be done in Supabase Dashboard:
--   Database → Extensions → search "pg_cron" → Enable)
-- Then run the lines below:

select cron.schedule(
  'send-emails-every-5-min',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://gnmqquorrhtnpmuzoitc.supabase.co/functions/v1/send-emails',
    headers := '{"Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdubXFxdW9ycmh0bnBtdXpvaXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NDA5MDIsImV4cCI6MjA5MTExNjkwMn0.5yONIzbbcHlT_RFm9DVk9FQ8bhJuofa28Q-A_P8nWxE","Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
