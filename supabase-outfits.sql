-- Outfits table definition for Supabase
-- Ejecuta este SQL en tu proyecto Supabase para crear la nueva tabla.

create table if not exists outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  description text,
  item_ids jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists outfits_user_id_idx on outfits (user_id);
