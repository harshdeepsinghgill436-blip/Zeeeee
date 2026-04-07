-- Run this in Supabase SQL Editor

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

-- Enable RLS and allow all for anon (you can restrict later)
alter table campaigns enable row level security;
alter table leads enable row level security;
alter table email_logs enable row level security;

create policy "allow all campaigns" on campaigns for all using (true) with check (true);
create policy "allow all leads" on leads for all using (true) with check (true);
create policy "allow all logs" on email_logs for all using (true) with check (true);
