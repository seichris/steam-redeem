create table if not exists refundable_catalog_games (
  id bigserial primary key,
  slug text not null unique check (length(trim(slug)) > 0),
  game text not null check (length(trim(game)) > 0),
  company text not null check (length(trim(company)) > 0),
  steam_app_id integer null,
  promise_summary text not null check (length(trim(promise_summary)) > 0),
  delivery_gap_summary text not null check (length(trim(delivery_gap_summary)) > 0),
  us_relevance text not null check (length(trim(us_relevance)) > 0),
  evidence_strength text not null check (length(trim(evidence_strength)) > 0),
  confidence double precision not null check (confidence >= 0 and confidence <= 1),
  status text not null check (length(trim(status)) > 0),
  refund_signal text[] not null default '{}',
  sources jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists refundable_catalog_games_steam_app_id_uidx
  on refundable_catalog_games (steam_app_id)
  where steam_app_id is not null;

create index if not exists refundable_catalog_games_confidence_idx
  on refundable_catalog_games (confidence desc);

create index if not exists refundable_catalog_games_status_idx
  on refundable_catalog_games (status);
