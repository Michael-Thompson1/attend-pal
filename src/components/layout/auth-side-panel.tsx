import { AttendMark } from "@/components/brand/attend-mark";
import React from "react";
import { MapPin, Smile, AlertTriangle } from "lucide-react";

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
          <AttendMark className="h-12 w-12 rounded-xl shadow-md" iconClassName="h-7 w-7" tone="inverse" />
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
                A student&apos;s phone has to be inside the class area you set.
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
      </div>
    </section>
  );
}
