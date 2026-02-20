-- Supabase schema (planned; Phase 2)
-- Not legal advice. Data minimization recommended.

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  steam_id text not null unique,
  created_at timestamptz not null default now()
);

create type public.claim_status as enum (
  'created',
  'paid',
  'running',
  'letter_ready',
  'timer_running',
  'filing_ready',
  'closed'
);

create table if not exists public.claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  steam_app_id integer not null,
  jurisdiction text not null,
  purchase_date date null,
  refund_denial_upload_path text null,
  status public.claim_status not null default 'created',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.progress_events (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims(id) on delete cascade,
  ts timestamptz not null default now(),
  phase text not null,
  message text not null
);

create table if not exists public.artifacts (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims(id) on delete cascade,
  kind text not null,
  storage_path text not null,
  sha256 text null,
  created_at timestamptz not null default now()
);

