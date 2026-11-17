import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeCheck,
  Bell,
  Camera,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  KeyRound,
  MapPin,
  Plus,
  QrCode,
  Radio,
  ScanFace,
  Shield,
  UserCheck,
} from "lucide-react";
import { AttendMark } from "@/components/brand/attend-mark";

export const metadata: Metadata = {
  title: "Attend Pal - Academic Attendance Verification",
  description:
    "Open a class session, let students scan a QR code in the room, and confirm they are there with a location check and a face photo.",
};

const primaryButton =
  "inline-flex min-h-12 items-center justify-center rounded-xl bg-primary-container px-6 font-label-lg text-label-lg font-semibold text-on-primary shadow-sm transition-all hover:bg-primary active:scale-95";
const secondaryButton =
  "inline-flex min-h-12 items-center justify-center rounded-xl border border-outline-variant bg-surface-container-lowest px-6 font-label-lg text-label-lg font-semibold text-secondary transition-colors hover:bg-surface-container-low hover:text-on-surface active:scale-95";

const qrCells = [
  "bg-primary",
  "bg-primary",
  "bg-primary",
  "bg-surface-variant",
  "bg-primary",
  "bg-surface-container-lowest",
  "bg-primary",
  "bg-primary",
  "bg-primary",
  "bg-surface-variant",
  "bg-primary",
  "bg-surface-container-lowest",
  "bg-surface-variant",
  "bg-primary",
  "bg-primary",
  "bg-primary",
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-surface text-on-surface">
      <header className="sticky top-0 z-50 w-full border-b border-outline-variant/30 bg-surface-container-lowest shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <AttendMark />
            <span className="font-headline-sm text-headline-sm font-bold tracking-tight text-primary">
              Attend Pal
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className={`${secondaryButton} px-4`}>
              Lecturer log in
            </Link>
            <Link href="/register" className={`${primaryButton} px-5`}>
              Create account
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="border-b border-outline-variant/30 bg-surface py-16 md:py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-12">
            <div className="flex flex-col items-start gap-6 lg:col-span-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-outline-variant/40 bg-surface-container-low px-3 py-1.5 font-caption text-caption text-secondary">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                Verified institutional attendance system
              </div>
              <h1 className="font-display-lg text-display-lg font-bold tracking-tight text-primary">
                Attendance you can trust.
              </h1>
              <p className="max-w-xl font-body-lg text-body-lg leading-relaxed text-secondary">
                Open a class session, let students scan a QR code in the room, and confirm they are there with a location check and a face photo.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link href="/login" className={primaryButton}>
                  Lecturer log in
                </Link>
                <Link href="/register" className={secondaryButton}>
                  Create account
                </Link>
              </div>
              <div className="flex flex-wrap items-center gap-6 pt-2 font-caption text-caption text-secondary">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Physical room verification
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Instant identity check
                </span>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative overflow-hidden rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-8 shadow-sm">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(var(--color-surface-variant)_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
                <div className="relative z-10 flex flex-col gap-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/30 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-outline-variant" />
                      <span className="h-3 w-3 rounded-full bg-outline-variant" />
                      <span className="h-3 w-3 rounded-full bg-outline-variant" />
                      <span className="ml-2 font-caption text-caption font-medium text-secondary">
                        Active Session Terminal
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-2.5 py-1 font-caption text-caption font-medium text-primary">
                      <MapPin className="h-3.5 w-3.5" />
                      Lecture Hall Room 104
                    </span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col justify-between rounded-2xl border border-outline-variant/40 bg-surface-container-low p-5">
                      <div className="mb-4 flex items-center justify-between">
                        <span className="font-title-md text-title-md font-semibold text-on-surface">
                          Dynamic QR Pass
                        </span>
                        <QrCode className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex aspect-square items-center justify-center rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-4 shadow-inner">
                        <div className="grid h-28 w-28 grid-cols-4 gap-1 rounded-lg border-2 border-primary bg-surface-container-lowest p-1">
                          {qrCells.map((tone, index) => (
                            <div key={index} className={`rounded-sm ${tone}`} />
                          ))}
                        </div>
                      </div>
                      <p className="mt-3 text-center font-caption text-caption text-secondary">
                        Changes dynamically each cycle
                      </p>
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="flex items-start gap-3.5 rounded-2xl border border-outline-variant/40 bg-surface-container-low p-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-outline-variant/40 bg-surface-container-lowest text-primary">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-title-md text-title-md font-semibold text-on-surface">
                            Perimeter Bound
                          </div>
                          <p className="mt-0.5 font-caption text-caption text-secondary">
                            Physical lecture hall zone verified via device sensors
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3.5 rounded-2xl border border-outline-variant/40 bg-surface-container-low p-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-outline-variant/40 bg-surface-container-lowest text-primary">
                          <ScanFace className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-title-md text-title-md font-semibold text-on-surface">
                            Instant Photo Match
                          </div>
                          <p className="mt-0.5 font-caption text-caption text-secondary">
                            Direct device camera selfie confirms genuine in-room identity
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl border border-primary/20 bg-surface-container p-3.5">
                        <span className="inline-flex items-center gap-2 font-label-md text-label-md font-semibold text-primary">
                          <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                          Active Integrity Channel
                        </span>
                        <Shield className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/30 pt-4 font-caption text-caption text-secondary">
                    <span>Lecture Hall Station Status: Ready</span>
                    <span>Verification Method: Geo-fence + Visual Token</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-surface-container-lowest py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-14 max-w-2xl">
              <h2 className="font-headline-lg text-headline-lg font-bold tracking-tight text-primary">
                Academic precision at every desk.
              </h2>
              <p className="mt-3 font-body-md text-body-md text-secondary">
                Designed specifically for lecture halls and university auditoriums where traditional roll call and static attendance sheets fail.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <article className="flex flex-col justify-between rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-8 shadow-sm">
                <div>
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-outline-variant/30 bg-surface-container-low text-primary">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <h3 className="mb-3 font-headline-sm text-headline-sm font-semibold text-on-surface">
                    Classroom location
                  </h3>
                  <p className="font-body-md text-body-md leading-relaxed text-secondary">
                    Students must be physically present inside the designated lecture hall or room perimeter. Attempts from outside the authorized boundaries cannot complete verification.
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-2 border-t border-outline-variant/20 pt-6 font-caption text-caption font-medium text-primary">
                  <Radio className="h-4 w-4" />
                  Sub-meter classroom boundary enforcement
                </div>
              </article>
              <article className="flex flex-col justify-between rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-8 shadow-sm">
                <div>
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-outline-variant/30 bg-surface-container-low text-primary">
                    <Camera className="h-6 w-6" />
                  </div>
                  <h3 className="mb-3 font-headline-sm text-headline-sm font-semibold text-on-surface">
                    Face check
                  </h3>
                  <p className="font-body-md text-body-md leading-relaxed text-secondary">
                    Live instant photo verification on the student&apos;s own device confirms real-time presence. The snapshot validates the student identity directly on their phone screen.
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-2 border-t border-outline-variant/20 pt-6 font-caption text-caption font-medium text-primary">
                  <BadgeCheck className="h-4 w-4" />
                  Immediate student identity confirmation
                </div>
              </article>
              <article className="flex flex-col justify-between rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-8 shadow-sm">
                <div>
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-outline-variant/30 bg-surface-container-low text-primary">
                    <Bell className="h-6 w-6" />
                  </div>
                  <h3 className="mb-3 font-headline-sm text-headline-sm font-semibold text-on-surface">
                    Alerts for review
                  </h3>
                  <p className="font-body-md text-body-md leading-relaxed text-secondary">
                    Out-of-bounds or suspicious check-in attempts are highlighted for the lecturer to review. Irregular signals are segregated automatically into a separate confirmation panel.
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-2 border-t border-outline-variant/20 pt-6 font-caption text-caption font-medium text-primary">
                  <ClipboardList className="h-4 w-4" />
                  Full lecturer discretion and oversight
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="border-y border-outline-variant/30 bg-surface-container-low py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <span className="font-caption text-caption font-semibold tracking-wider text-primary">
                STRUCTURED WORKFLOW
              </span>
              <h2 className="mt-2 font-headline-lg text-headline-lg font-bold tracking-tight text-primary">
                How a lecture works
              </h2>
              <p className="mt-2 font-body-md text-body-md text-secondary">
                A three-step verification cycle designed to take under two minutes of total lecture time.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <article className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-8 shadow-sm">
                <div className="mb-6 flex items-center justify-between">
                  <span className="font-headline-md text-headline-md font-bold text-primary/40">01</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container text-primary">
                    <Plus className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="mb-2 font-title-lg text-title-lg font-semibold text-on-surface">Create a class</h3>
                <p className="font-body-md text-body-md leading-relaxed text-secondary">
                  Add course code, lecture hall room, and student list once.
                </p>
              </article>
              <article className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-8 shadow-sm">
                <div className="mb-6 flex items-center justify-between">
                  <span className="font-headline-md text-headline-md font-bold text-primary/40">02</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container text-primary">
                    <KeyRound className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="mb-2 font-title-lg text-title-lg font-semibold text-on-surface">Open a session</h3>
                <p className="font-body-md text-body-md leading-relaxed text-secondary">
                  Generate a fresh dynamic QR pass on the screen when lecture starts.
                </p>
              </article>
              <article className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-8 shadow-sm">
                <div className="mb-6 flex items-center justify-between">
                  <span className="font-headline-md text-headline-md font-bold text-primary/40">03</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container text-primary">
                    <UserCheck className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="mb-2 font-title-lg text-title-lg font-semibold text-on-surface">Students check in</h3>
                <p className="font-body-md text-body-md leading-relaxed text-secondary">
                  Students scan and confirm presence in seconds without passing roll sheets.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="bg-surface py-20">
          <div className="mx-auto max-w-4xl px-6">
            <div className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-10 text-center shadow-sm md:p-14">
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container-low text-primary">
                <GraduationCap className="h-7 w-7" />
              </div>
              <h2 className="mb-4 font-headline-lg text-headline-lg font-bold tracking-tight text-primary">
                Reliable lecture verification for every course.
              </h2>
              <p className="mx-auto mb-8 max-w-xl font-body-lg text-body-lg text-secondary">
                Empower your faculty with reliable classroom presence verification. Set up your first class in minutes.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link href="/register" className={primaryButton}>
                  Create account
                </Link>
                <Link href="/login" className={secondaryButton}>
                  Lecturer log in
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-outline-variant/30 bg-surface-container-low py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <div className="flex items-center gap-2.5">
              <AttendMark className="h-8 w-8 rounded-lg" iconClassName="h-4 w-4" />
              <span className="font-title-md text-title-md font-bold text-primary">Attend Pal</span>
            </div>
            <span className="hidden text-outline-variant sm:inline">|</span>
            <p className="font-caption text-caption text-secondary">
              © 2025 Attend Pal Inc. Academic precision in student attendance.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="font-label-md text-label-md text-secondary hover:text-primary">
              Lecturer log in
            </Link>
            <Link href="/register" className={`${primaryButton} min-h-10 px-4 text-label-md`}>
              Create account
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
