import React from "react";
import {
  ShieldCheck,
  MapPin,
  Smile,
  AlertTriangle,
  Lock,
  GraduationCap,
  FileCheck,
} from "lucide-react";

export function AuthSidePanel() {
  return (
    <section className="relative flex flex-col justify-between overflow-hidden bg-primary-container p-8 text-on-primary lg:w-1/2 lg:p-16">
      {/* Subtle ambient graphic pattern overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-10">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="auth-grid-pattern"
              width="48"
              height="48"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 48 0 L 0 0 0 48"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <circle cx="24" cy="24" r="1.5" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#auth-grid-pattern)" />
        </svg>
      </div>

      {/* Subtle radial glow */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-primary-fixed opacity-15 blur-3xl" />

      {/* Top Header & Brand Identity */}
      <div className="relative z-10 space-y-6">
        <div className="flex items-center space-x-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container-lowest text-primary shadow-md">
            <GraduationCap className="h-7 w-7 text-primary" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-headline-sm text-headline-sm font-bold tracking-tight text-on-primary">
                Attend Pal
              </span>
              <span className="rounded-full bg-tertiary-container px-2.5 py-0.5 font-label-md text-caption font-semibold uppercase tracking-wider text-tertiary-fixed">
                Faculty
              </span>
            </div>
            <p className="font-caption text-caption text-on-primary-container">
              Academic Verification Infrastructure
            </p>
          </div>
        </div>

        {/* Campus Gateway Live Status Badge */}
        <div className="inline-flex items-center space-x-3 rounded-full bg-on-primary/10 px-4 py-2 shadow-sm backdrop-blur-md">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tertiary-fixed opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-tertiary-fixed" />
          </span>
          <span className="font-label-md text-label-md font-medium tracking-wide text-on-primary">
            Campus Gateway Node 04 · Operational
          </span>
          <span className="text-on-primary-container opacity-60">•</span>
          <span className="font-caption text-caption font-medium text-on-primary-container">
            Latency 14ms
          </span>
        </div>
      </div>

      {/* Middle Value Anchor */}
      <div className="relative z-10 max-w-xl space-y-8 py-10 lg:py-0">
        <div className="space-y-3">
          <p className="font-label-lg text-label-lg font-semibold uppercase tracking-widest text-on-primary-container">
            Zero-Fraud Roll Call
          </p>
          <h1 className="font-display-lg text-display-lg font-bold leading-tight text-on-primary">
            Attendance you can trust.
          </h1>
          <p className="font-body-lg text-body-lg text-on-primary-container">
            Smart location checking, face verification, and secure tracking
            built for classrooms and labs.
          </p>
        </div>

        {/* Key Pillars */}
        <div className="space-y-4 pt-2">
          <div className="flex items-start space-x-3.5">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-on-primary/15 text-tertiary-fixed">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <p className="font-title-md text-title-md font-semibold text-on-primary">
                Time and location verified
              </p>
              <p className="font-caption text-caption text-on-primary-container">
                Multi-beacon GPS coordinates ensure students are physically inside
                the lecture hall.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-on-primary/15 text-tertiary-fixed">
              <Smile className="h-4 w-4" />
            </div>
            <div>
              <p className="font-title-md text-title-md font-semibold text-on-primary">
                Face-checked identity
              </p>
              <p className="font-caption text-caption text-on-primary-container">
                Fast camera selfie check authenticates genuine student presence in
                seconds.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-on-primary/15 text-tertiary-fixed">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <p className="font-title-md text-title-md font-semibold text-on-primary">
                Instant alerts for suspicious attempts
              </p>
              <p className="font-caption text-caption text-on-primary-container">
                Real-time flags for proxy sign-ins, device swaps, and anomalous
                locations.
              </p>
            </div>
          </div>
        </div>

        {/* Active Lecture Verification Widget */}
        <div className="flex items-center justify-between rounded-xl bg-on-primary/10 p-4 shadow-sm backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-lowest/15 text-on-primary">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <span className="block font-label-md text-label-md font-semibold text-on-primary">
                Active Session Roster
              </span>
              <span className="font-caption text-caption text-on-primary-container">
                CS-402: Distributed Systems (Hall 3B)
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="block font-headline-sm text-headline-sm font-bold leading-none text-tertiary-fixed">
              148 / 152
            </span>
            <span className="font-caption text-caption text-on-primary-container">
              97.3% present
            </span>
          </div>
        </div>
      </div>

      {/* Institutional Compliance Footer */}
      <div className="relative z-10 mt-auto flex flex-wrap items-center justify-between gap-4 pt-8 font-caption text-caption text-on-primary-container">
        <div className="flex items-center space-x-4">
          <span className="inline-flex items-center space-x-1.5 font-medium text-on-primary">
            <FileCheck className="h-4 w-4 text-tertiary-fixed" />
            <span>FERPA Compliant</span>
          </span>
          <span className="opacity-40">•</span>
          <span className="inline-flex items-center space-x-1.5 font-medium text-on-primary">
            <ShieldCheck className="h-4 w-4 text-tertiary-fixed" />
            <span>SOC2 Type II</span>
          </span>
          <span className="opacity-40">•</span>
          <span className="inline-flex items-center space-x-1.5 font-medium text-on-primary">
            <Lock className="h-4 w-4 text-tertiary-fixed" />
            <span>256-Bit Encrypted</span>
          </span>
        </div>
        <div className="opacity-80">v4.8.2-prod</div>
      </div>
    </section>
  );
}
