-- Body profiles table definition for Supabase
-- Ejecuta este SQL en tu proyecto Supabase para crear la nueva tabla.

create table if not exists body_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  height_cm integer not null,
  weight_kg integer not null,
  shoulder_width_cm integer not null,
  chest_circumference_cm integer not null,
  waist_circumference_cm integer not null,
  hip_circumference_cm integer not null,
  arm_length_cm integer not null,
  leg_length_cm integer not null,
  body_shape text not null,
  body_type text not null,
  posture text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists body_profiles_user_id_idx on body_profiles (user_id);

-- Opcional: si quieres que Supabase actualice updated_at automáticamente,
-- agrega un trigger en tu proyecto Postgres.
