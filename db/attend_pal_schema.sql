-- =====================================================================
-- Attend Pal: Finalized Database Schema for Supabase (Postgres)
-- Direct 1:1 Mapping to Stitch UI & Non-Negotiable Security Rules
-- =====================================================================

-- ---------------------------------------------------------------------
-- EXTENSIONS
-- ---------------------------------------------------------------------
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------
-- 1. INSTITUTIONAL EMAIL ALLOW-LIST
-- Validates that only verified school domains can register as lecturers.
-- ---------------------------------------------------------------------
create table public.allowed_domains (
  domain text primary key,
  institution_name text not null,
  created_at timestamptz not null default now()
);

-- Seed default university domains (UCC prioritised)
insert into public.allowed_domains (domain, institution_name) values
  ('ucc.edu.gh', 'University of Cape Coast (Faculty)'),
  ('stu.ucc.edu.gh', 'University of Cape Coast (Student / Dev)'),
  ('ug.edu.gh', 'University of Ghana (Faculty)'),
  ('st.ug.edu.gh', 'University of Ghana (Student Domain)'),
  ('knust.edu.gh', 'Kwame Nkrumah University of Science and Technology')
on conflict (domain) do nothing;

alter table public.allowed_domains enable row level security;
create policy "anyone can read allowed domains" on public.allowed_domains for select using (true);

-- ---------------------------------------------------------------------
-- 2. LECTURERS (Profile linked to Supabase Auth)
-- ---------------------------------------------------------------------
create table public.lecturers (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  institution text default 'Faculty of Science',
  campus text default 'Main Campus',
  photo_path text,                        -- Private storage path: {lecturer_id}/profile.jpg
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. LECTURER SETTINGS (Session Defaults from Stitch Settings)
-- ---------------------------------------------------------------------
create table public.lecturer_settings (
  lecturer_id uuid primary key references public.lecturers(id) on delete cascade,
  default_radius_m integer not null default 100 check (default_radius_m between 20 and 300),
  default_window_minutes integer not null default 15 check (default_window_minutes in (15, 30, 45, 60)),
  default_require_liveness boolean not null default true,
  default_allow_second_checkin boolean not null default false,
  notify_suspicious boolean not null default true,
  email_fake_identity boolean not null default true,
  email_out_of_bounds boolean not null default false,
  email_shared_device boolean not null default true,
  email_session_summary boolean not null default true,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- TRIGGER: Auto-create Profile, Settings & Enforce Institutional Email
-- ---------------------------------------------------------------------
create or replace function public.handle_new_lecturer()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_domain text;
  domain_valid boolean;
begin
  -- 1. Enforce School Email Domain Allow-list
  user_domain := lower(split_part(new.email, '@', 2));
  select exists(
    select 1 from public.allowed_domains where lower(domain) = user_domain
  ) into domain_valid;

  if not domain_valid then
    raise exception 'Registration permitted with approved institutional email addresses only (e.g., @ucc.edu.gh or @stu.ucc.edu.gh). Domain "%" is not authorized.', user_domain;
  end if;

  -- 2. Seed Lecturer Profile
  insert into public.lecturers (id, full_name, institution, campus)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'institution', 'Faculty of Science'),
    coalesce(new.raw_user_meta_data->>'campus', 'Main Campus')
  );

  -- 3. Seed Default Settings
  insert into public.lecturer_settings (lecturer_id)
  values (new.id);

  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_lecturer();

-- ---------------------------------------------------------------------
-- 4. CLASSES (Course Cohorts)
-- ---------------------------------------------------------------------
create table public.classes (
  id uuid primary key default gen_random_uuid(),
  lecturer_id uuid not null references public.lecturers(id) on delete cascade,
  code text not null,                     -- e.g. "INF212"
  title text not null,                    -- e.g. "Data Structures & Algorithms"
  semester text not null default 'Semester 1, 2024/2025',
  programme text default 'BSc Computer Science',
  default_venue text default 'Lecture Hall B',
  created_at timestamptz not null default now()
);
create index on public.classes (lecturer_id);

-- ---------------------------------------------------------------------
-- 5. STUDENTS (Class Roster with Biometric References)
-- ---------------------------------------------------------------------
create table public.students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  index_number text not null check (length(index_number) > 0 and index_number = btrim(index_number)),
  full_name text not null,
  email text,                             -- e.g. "s.mensah@st.ug.edu.gh"
  programme text,
  level text default 'Level 200',
  reference_photo_path text,              -- Private storage path: {class_id}/{index_number}.jpg
  created_at timestamptz not null default now(),
  unique (class_id, index_number)
);
create index on public.students (class_id, index_number);

-- ---------------------------------------------------------------------
-- 6. SESSIONS (Meetings & Static QR Passes)
-- ---------------------------------------------------------------------
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  lecturer_id uuid not null references public.lecturers(id) on delete cascade,
  title text not null,                    -- e.g. "Lecture 14: Binary Search Trees"
  token text not null unique default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  venue_name text default 'Lecture Hall B',
  center_lat double precision not null check (center_lat between -90 and 90),
  center_lng double precision not null check (center_lng between -180 and 180),
  radius_m integer not null check (radius_m between 20 and 300),
  require_liveness boolean not null default true,
  allow_second_checkin boolean not null default false,
  second_checkin_window_minutes integer not null default 10,
  notify_suspicious boolean not null default true,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now(),
  closed_at timestamptz,
  check (ends_at > starts_at)
);
create index on public.sessions (lecturer_id, starts_at desc);
create index on public.sessions (token);
create index on public.sessions (class_id);

-- ---------------------------------------------------------------------
-- 7. ATTENDANCE (Verified Check-ins & Manual Overrides)
-- ---------------------------------------------------------------------
create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  checkin_number smallint not null default 1 check (checkin_number in (1, 2)),
  status text not null check (status in ('verified', 'manual')),
  distance_m real,
  gps_accuracy_m real,
  match_score real check (match_score between 0 and 1),
  liveness_passed boolean default true,
  device_hash text,
  manual_reason text,                     -- Mandatory written justification (min 5 chars)
  created_at timestamptz not null default now(),
  unique (session_id, student_id, checkin_number),
  check (
    status <> 'manual' or 
    (manual_reason is not null and length(btrim(manual_reason)) >= 5)
  )
);
create index on public.attendance (session_id, student_id);

-- ---------------------------------------------------------------------
-- 8. ALERTS (Incident Feed & Detail Drawer)
-- ---------------------------------------------------------------------
create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  type text not null check (type in (
    'fake_identity',        -- Spoof or mismatch (<50%)
    'low_match',            -- Borderline match (50-69%) sent to lecturer
    'out_of_bounds',        -- GPS outside radius
    'multi_index_device',   -- 2+ student indices from single hardware signature
    'window_cutoff'         -- Attempt logged after active window expired
  )),
  severity text not null default 'high' check (severity in ('high', 'medium', 'low')),
  claimed_index text,
  student_id uuid references public.students(id) on delete set null,
  distance_m real,
  match_score real,
  device_hash text,
  ip_hash text,
  details jsonb not null default '{}'::jsonb, -- Hardware info, iOS/Android version, vector variance
  evidence_photo_path text,                   -- Stored ONLY for failed identity/low match
  evidence_expires_at timestamptz default (now() + interval '7 days'), -- 7-day statutory retention
  status text not null default 'new' check (status in ('new', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now()
);
create index on public.alerts (session_id, created_at desc);
create index on public.alerts (evidence_expires_at) where evidence_photo_path is not null;

-- ---------------------------------------------------------------------
-- 9. ATTEMPTS (Server Audit Log for Rate Limiting & Proxy Detection)
-- ---------------------------------------------------------------------
create table public.attempts (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.sessions(id) on delete cascade,
  device_hash text,
  ip_hash text,
  claimed_index text,
  outcome text not null,  -- 'verified', 'out_of_bounds', 'failed_identity', 'blocked_rate_limit'
  created_at timestamptz not null default now()
);
create index on public.attempts (session_id, device_hash);
create index on public.attempts (session_id, ip_hash, created_at);

-- ---------------------------------------------------------------------
-- 10. EVIDENCE AUTO-PURGE FUNCTION (Cron Sweeper)
-- Wipes expired evidence photo paths after the 7-day retention window.
-- ---------------------------------------------------------------------
create or replace function public.purge_expired_alert_evidence()
returns table(purged_path text)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Returns all paths about to be cleared so the edge function/cron can purge from Storage
  return query
  select evidence_photo_path
  from public.alerts
  where evidence_expires_at <= now()
    and evidence_photo_path is not null;

  -- Clear the evidence columns from the database rows
  update public.alerts
  set evidence_photo_path = null
  where evidence_expires_at <= now()
    and evidence_photo_path is not null;
end;
$$;

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict isolation: Lecturers only manage their own classes and sessions.
-- Students possess NO direct database credentials.
-- =====================================================================
alter table public.lecturers         enable row level security;
alter table public.lecturer_settings enable row level security;
alter table public.classes           enable row level security;
alter table public.students          enable row level security;
alter table public.sessions          enable row level security;
alter table public.attendance        enable row level security;
alter table public.alerts            enable row level security;
alter table public.attempts          enable row level security; -- Server-role only

-- Lecturer Profile & Settings Policies
create policy "lecturer reads own profile"
  on public.lecturers for select
  using (id = auth.uid());

create policy "lecturer updates own profile"
  on public.lecturers for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "lecturer manages own settings"
  on public.lecturer_settings for all
  using (lecturer_id = auth.uid())
  with check (lecturer_id = auth.uid());

-- Class & Roster Policies
create policy "lecturer manages own classes"
  on public.classes for all
  using (lecturer_id = auth.uid())
  with check (lecturer_id = auth.uid());

create policy "lecturer manages students of own classes"
  on public.students for all
  using (exists (
    select 1 from public.classes c
    where c.id = students.class_id and c.lecturer_id = auth.uid()))
  with check (exists (
    select 1 from public.classes c
    where c.id = students.class_id and c.lecturer_id = auth.uid()));

-- Session Policies
create policy "lecturer manages own sessions"
  on public.sessions for all
  using (lecturer_id = auth.uid())
  with check (
    lecturer_id = auth.uid()
    and exists (
      select 1 from public.classes c
      where c.id = sessions.class_id and c.lecturer_id = auth.uid())
  );

-- Attendance Policies
create policy "lecturer views attendance of own sessions"
  on public.attendance for select
  using (exists (
    select 1 from public.sessions s
    where s.id = attendance.session_id and s.lecturer_id = auth.uid()));

create policy "lecturer adds or updates manual attendance"
  on public.attendance for insert
  with check (
    status = 'manual'
    and exists (
      select 1 from public.sessions s
      where s.id = attendance.session_id and s.lecturer_id = auth.uid())
  );

-- Alert Policies
create policy "lecturer reads alerts of own sessions"
  on public.alerts for select
  using (exists (
    select 1 from public.sessions s
    where s.id = alerts.session_id and s.lecturer_id = auth.uid()));

create policy "lecturer reviews alerts of own sessions"
  on public.alerts for update
  using (exists (
    select 1 from public.sessions s
    where s.id = alerts.session_id and s.lecturer_id = auth.uid()))
  with check (exists (
    select 1 from public.sessions s
    where s.id = alerts.session_id and s.lecturer_id = auth.uid()));

-- =====================================================================
-- REALTIME SUBSCRIPTIONS
-- Powers the Live Session Monitor counter and the Alert Feed.
-- =====================================================================
alter publication supabase_realtime add table public.attendance, public.alerts;

-- =====================================================================
-- STORAGE BUCKETS (private):
--   1. 'reference-photos' : {class_id}/{index_number}.jpg
--   2. 'alert-evidence'   : {session_id}/{alert_id}.jpg (Purged after 7 days)
--   3. 'lecturer-photos'  : {lecturer_id}/profile.jpg
-- =====================================================================
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
