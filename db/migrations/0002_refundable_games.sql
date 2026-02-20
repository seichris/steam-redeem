create table if not exists refundable_games (
  app_id integer primary key,
  reason text not null check (length(trim(reason)) > 0),
  confidence double precision not null check (confidence >= 0 and confidence <= 1),
  source text not null check (length(trim(source)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists refundable_games_confidence_idx
  on refundable_games (confidence desc);
