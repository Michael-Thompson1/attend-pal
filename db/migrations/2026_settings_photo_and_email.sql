-- Run this once in the Supabase SQL Editor if the project was created
-- before lecturer photos and per-alert email preferences existed.
-- Safe to run more than once.

alter table public.lecturers
  add column if not exists photo_path text;

alter table public.lecturer_settings
  add column if not exists email_fake_identity boolean not null default true,
  add column if not exists email_out_of_bounds boolean not null default false,
  add column if not exists email_shared_device boolean not null default true,
  add column if not exists email_session_summary boolean not null default true;

insert into storage.buckets (id, name, public)
values ('lecturer-photos', 'lecturer-photos', false)
on conflict (id) do nothing;

drop policy if exists "lecturer reads own profile photo" on storage.objects;
create policy "lecturer reads own profile photo"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'lecturer-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "lecturer uploads own profile photo" on storage.objects;
create policy "lecturer uploads own profile photo"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'lecturer-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "lecturer updates own profile photo" on storage.objects;
create policy "lecturer updates own profile photo"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'lecturer-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "lecturer deletes own profile photo" on storage.objects;
create policy "lecturer deletes own profile photo"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'lecturer-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
