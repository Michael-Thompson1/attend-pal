-- Saved class-center places for the lecturer who owns the settings row.
alter table public.lecturer_settings
  add column if not exists saved_places jsonb not null default '[]'::jsonb;
