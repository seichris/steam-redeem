create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  steam_id text not null unique,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_type where typname = 'claim_status') then
    create type claim_status as enum (
      'created',
      'paid',
      'running',
      'letter_ready',
      'timer_running',
      'filing_ready',
      'closed'
    );
  end if;
end $$;

create table if not exists claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  steam_app_id integer not null,
  jurisdiction text not null,
  purchase_date date null,
  refund_denial_upload_path text null,
  status claim_status not null default 'created',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists progress_events (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references claims(id) on delete cascade,
  ts timestamptz not null default now(),
  phase text not null,
  message text not null
);

create table if not exists artifacts (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references claims(id) on delete cascade,
  kind text not null,
  storage_path text not null,
  sha256 text null,
  created_at timestamptz not null default now()
);

