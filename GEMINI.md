# Attend Pal: Project Rules (read before EVERY task)

## What this is
A web app that verifies student attendance. Lecturers create a class session and get a QR code/link. Students scan it on their phones, enter their index number and take a selfie. The check-in only counts if the student is inside the lecturer's time window AND inside the lecturer's radius AND their face matches the reference photo from the class list.

## Stack (do not change without asking)
- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase: Postgres, Auth (lecturers only), Storage, Realtime
- Hosting: Vercel
- Libraries: zod, qrcode, leaflet + react-leaflet (OpenStreetMap), papaparse, lucide-react, face-api.js fork (@vladmandic/face-api) for the prototype
- Database: use /db/attend_pal_schema.sql exactly as written. Do not invent tables or columns. If a change is needed, propose it and wait for approval.

## Users
- **Lecturers**: have accounts. Sign up with a SCHOOL email only (domain checked against an allow-list on the server) and confirm by email link. No staff ID field. Mostly use laptops. Lecturer pages are laptop-first and responsive.
- **Students**: NO accounts, no login. Mostly use phones. Student pages (/attend/[token]) are mobile-first, one task per screen, minimal code, big tap targets (44px+).

## Security rules (non-negotiable)
1. Students never read or write the database directly. Every student submission goes to ONE server route that runs all checks, using the service-role key.
2. The service-role key is used ONLY in server code. Never in client components, never in NEXT_PUBLIC_ variables, never committed.
3. All checks run on the server. Never trust a "verified" flag, distance, match result or timestamp sent from the browser. Use the server clock.
4. Row Level Security stays ON for every table. Lecturers only see their own data.
5. Verification order (stop at first failure): session token valid and open -> server time inside window -> rate limit + Cloudflare Turnstile -> location inside radius -> index number on class list -> not already checked in for this session -> live camera selfie passes liveness (blink) and matches the reference photo -> device check.
6. Location: the browser sends latitude, longitude and accuracy. Server calculates distance (Haversine). If accuracy is very poor (over about 100 m), return a RETRY message ("couldn't get a precise location"), NOT an out-of-bounds alert. Otherwise allow the radius plus a small accuracy allowance (capped at about 50 m).
7. One attendance per student per session (database unique constraint). Handle the duplicate error gracefully ("You've already checked in").
8. Selfies: verified selfies are NEVER stored. Failed-identity evidence may be stored in the private alert-evidence bucket for 7 days only, then deleted (file AND database columns). Camera capture only, no gallery upload.
9. Hash IP and device identifiers with a server-side secret before storing. Never store raw ones.
10. The QR code is a STATIC link (/attend/<token>), safe to print or share on WhatsApp. It is NOT rotating. Security comes from the checks above. Lecturers can regenerate the token or close the session.
11. Lecturers get alerts for: fake identity attempts, borderline face matches, out-of-bounds attempts, multiple index numbers from one device. Manual override by the lecturer requires a written reason.
12. Face scoring has three outcomes (thresholds are tuned later by testing with real photos, never hard-coded in the browser): clear match -> attendance row with status `verified`; borderline match -> NO attendance row, create a `low_match` alert (shown as "Flagged"), the student sees "Sent to your lecturer for review", and the lecturer can approve with a manual override; clear mismatch or failed liveness -> `fake_identity` alert (shown as "Rejected"), the student sees "Identity check failed".
13. Rejected, Flagged and Out of bounds are ALERTS, not attendance rows. "Pending" just means on the roster with no attendance row yet.

## Messages students see (keep these simple and kind)
Verified | Out of bounds | Check-in isn't open | Identity check failed (with tips) | Sent to your lecturer for review | Already checked in | Link no longer active | Couldn't get a precise location (retry)

## Design
- Follow /design/design.md and the screenshots in /design/screens/. Use design tokens and shared components in /components/ui. Never hard-code colours.
- Status is always icon + text, never colour alone. WCAG AA contrast, minimum 13px for captions.
- Stitch HTML is a reference only. Remove Tailwind CDN scripts and external font links. Use next/font and the project's Tailwind build.
- Use plain language in the UI. No developer jargon (no "telemetry", "WebSockets", "quorum", "biometrics").

## How to work
- One small task per prompt. Make a short plan first and wait for approval on anything touching security.
- Two passes per screen: (1) look only, with sample data; (2) wiring, in a separate task.
- Do not change files unrelated to the task. Do not rewrite working code.
- After each task: run build and lint, fix errors, then list the exact manual tests I should run.
- Remove all leftover sample data (names like "Dr. Mensah") when wiring a screen.
- Never put secrets in code. Use .env.local and confirm it is git-ignored.
- Suggest a git commit message after each finished task.
