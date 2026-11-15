# Attend Pal — Setup Guide

## Prerequisites
- Node.js 20+
- A Supabase account (free tier is fine)
- A Cloudflare account (for Turnstile — free)
- A Vercel account (for deployment — free)

---

## 1. Clone & Install

```bash
cd attend-pal
npm install
```

---

## 2. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Choose your organisation, give it a name (e.g. `attend-pal`), set a strong database password, pick a region close to Ghana (e.g. `eu-west-2 London` or `us-east-1`)
3. Wait for the project to provision (~1 min)
4. Go to **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ Keep this secret

---

## 3. Run the Schema

1. In Supabase dashboard → **SQL Editor → New query**
2. Paste the entire contents of `db/attend_pal_schema.sql`
3. Click **Run**
4. Confirm all 9 tables appear in **Table Editor**

---

## 4. Configure Supabase Auth

In Supabase dashboard → **Authentication → Providers**:
- **Email**: enabled, confirm email = ON, secure email change = ON
- All other providers: OFF (lecturers use email only)

In **Authentication → Email Templates**, update the confirmation email:
- Subject: `Confirm your Attend Pal account`
- Body: plain language — "Click the link to confirm your Attend Pal account."

In **Authentication → URL Configuration**:
- Site URL: `http://localhost:3000` (dev) / your Vercel URL (prod)
- Redirect URLs: add `http://localhost:3000/auth/callback` and `https://your-app.vercel.app/auth/callback`

---

## 5. Configure Supabase Storage

In **Storage → New bucket**:
- Name: `alert-evidence`
- **Private** (not public)
- Apply this policy (paste in SQL Editor):

```sql
-- Only the service role can upload to alert-evidence
create policy "Service role only" on storage.objects
  for all using (auth.role() = 'service_role');
```

---

## 6. Enable Realtime

In **Database → Replication**, enable replication for:
- `attendance` table
- `alerts` table

---

## 7. Generate TypeScript Types

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase/types.ts
```

Replace `YOUR_PROJECT_ID` with the ID from your Supabase project URL (the part between `https://` and `.supabase.co`).

---

## 8. Set Up Cloudflare Turnstile

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Turnstile → Add site**
2. Name: `Attend Pal`
3. Domains: `localhost`, `your-app.vercel.app`
4. Widget type: **Managed** (recommended)
5. Copy **Site Key** → `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
6. Copy **Secret Key** → `TURNSTILE_SECRET_KEY`

---

## 9. Fill in .env.local

Copy `.env.example` to `.env.local` and fill in every value:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DEVICE_PEPPER_SECRET=<openssl rand -base64 32>
ALLOWED_DOMAINS=st.ug.edu.gh,ug.edu.gh
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x...
TURNSTILE_SECRET_KEY=0x...
```

---

## 10. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 11. Deploy to Vercel

```bash
npx vercel
```

Add all `.env.local` values as Environment Variables in the Vercel project settings.

---

## Schedule the Evidence Purge Cron

In Supabase dashboard → **Database → Extensions**, enable `pg_cron`.

Then in SQL Editor:
```sql
select cron.schedule(
  'purge-alert-evidence',
  '0 3 * * *',  -- 3am daily
  $$ select purge_expired_alert_evidence(); $$
);
```

This deletes alert evidence files and clears the database columns 7 days after they were stored.
