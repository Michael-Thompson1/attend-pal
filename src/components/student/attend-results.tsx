"use client";

import { AttendMark } from "@/components/brand/attend-mark";

import { useState, type ReactNode } from "react";
import {
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  Clock,
  DoorOpen,
  Headset,
  Landmark,
  Lightbulb,
  Lock,
  Mail,
  MapPin,
  Navigation,
  Receipt,
  RefreshCw,
  Satellite,
  Smartphone,
  Sun,
  Terminal,
  TimerOff,
  TriangleAlert,
  UserRound,
  Wifi,
  X,
} from "lucide-react";
import type { AttendSession } from "@/components/student/attend-client-view";

function KioskBar() {
  return (
    <header className="-mx-4 flex h-16 items-center justify-between px-4 shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
      <div className="flex items-center gap-2">
        <AttendMark className="h-9 w-9 rounded-xl" />
        <div>
          <p className="font-title-md text-title-md leading-none tracking-tight">Attend Pal</p>
          <p className="mt-0.5 font-caption text-caption leading-tight text-secondary">Campus Verification Kiosk</p>
        </div>
      </div>
      <div className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-low px-2.5 py-1">
        <span className="h-2 w-2 animate-pulse rounded-full bg-tertiary-container" />
        <span className="font-caption text-caption font-medium text-secondary">Online</span>
      </div>
    </header>
  );
}

function courseLine(session: AttendSession) {
  return [session.code, session.title].filter(Boolean).join(" ") || "—";
}

export function AlreadyCheckedIn({
  session,
  indexNumber,
  recordedAt,
  reference,
  onHome,
  onHelp,
}: {
  session: AttendSession;
  indexNumber: string;
  recordedAt: string;
  reference: string;
  onHome: () => void;
  onHelp: () => void;
}) {
  const [slipOpen, setSlipOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const indexLabel = indexNumber.trim() || "—";
  const recorded = recordedAt.trim() || "—";
  const checksum = reference.trim() || "—";

  function leave() {
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(() => {
      setLeaving(false);
      onHome();
    }, 1200);
  }

  return (
    <div className="flex flex-col px-4 pb-8">
      <KioskBar />
      <div className="mb-6 flex items-center justify-between rounded-xl bg-surface-container-low px-4 py-2.5 shadow-sm">
        <span className="inline-flex min-w-0 items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-tertiary-container" />
          <span className="truncate font-caption text-caption text-secondary">{session.venue || "Classroom"}</span>
        </span>
        <span className="shrink-0 rounded-full bg-secondary-container px-2 py-0.5 font-caption text-caption font-medium text-on-secondary-container">
          Session Locked
        </span>
      </div>

      <div className="mb-6 flex flex-col items-center px-2 text-center">
        <div className="relative mb-5">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-secondary-container shadow-md">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-container text-on-primary shadow-sm">
              <BadgeCheck className="h-9 w-9" />
            </div>
          </div>
          <div className="absolute -right-1 -bottom-1 flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-lowest text-primary-container shadow-md">
            <CheckCircle2 className="h-[18px] w-[18px]" />
          </div>
        </div>
        <h1 className="mb-2 text-[26px] leading-[34px] font-bold tracking-tight">You&apos;ve already checked in</h1>
        <p className="max-w-xs font-body-md text-body-md leading-relaxed text-secondary">
          Your attendance for this session was already recorded earlier. You&apos;re all set for class!
        </p>
      </div>

      <section className="mb-5 flex flex-col gap-4 rounded-xl bg-surface-container-lowest p-5 shadow-md">
        <div className="flex items-start justify-between gap-3 pb-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-primary">
              <Terminal className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="mb-1 font-caption text-caption leading-none text-secondary">Enrolled Course</p>
              <h2 className="truncate font-title-lg text-title-lg leading-tight">{courseLine(session)}</h2>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-tertiary-fixed px-2.5 py-1 font-label-md text-label-md font-medium text-tertiary">
            <BadgeCheck className="h-4 w-4" />
            Verified Present
          </span>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-surface-container-low p-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-container text-primary">
            <UserRound className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-caption text-caption tracking-wider text-secondary uppercase">Student Index</p>
            <p className="truncate font-title-md text-title-md tracking-wide">{indexLabel}</p>
          </div>
          <BadgeCheck className="h-5 w-5 shrink-0 text-secondary" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-surface-container p-3">
            <p className="mb-1 inline-flex items-center gap-1.5 font-caption text-caption text-secondary">
              <Clock className="h-4 w-4" />
              Recorded at
            </p>
            <p className="font-label-lg text-label-lg font-semibold">{recorded}</p>
          </div>
          <div className="rounded-lg bg-surface-container p-3">
            <p className="mb-1 inline-flex items-center gap-1.5 font-caption text-caption text-secondary">
              <MapPin className="h-4 w-4" />
              Verification Mode
            </p>
            <p className="font-label-lg text-label-lg font-semibold">Kiosk Terminal</p>
          </div>
        </div>
        <div className="flex items-center justify-between px-2 text-on-surface-variant">
          <span className="font-caption text-caption">Checksum Reference</span>
          <span className="font-mono font-caption text-caption">{checksum}</span>
        </div>
      </section>

      <div className="mb-6 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setSlipOpen(true)}
          className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary-container font-label-lg text-label-lg font-semibold text-on-primary shadow-md active:scale-[0.98]"
        >
          <Receipt className="h-5 w-5" />
          View Attendance Slip
        </button>
        <button
          type="button"
          onClick={leave}
          className="inline-flex h-12 w-full items-center justify-center gap-1 rounded-xl bg-surface-container-high font-label-lg text-label-lg font-medium text-primary"
        >
          {leaving ? "Exiting..." : "Done & Return to Home"}
        </button>
      </div>

      <div className="flex flex-col items-center gap-1 text-center">
        <button type="button" onClick={onHelp} className="inline-flex items-center gap-1.5 font-caption text-caption text-secondary">
          <Headset className="h-4 w-4" />
          Having trouble? Ask your lecturer for help.
        </button>
        <span className="font-caption text-[11px] text-on-surface-variant">System ID: KIOSK-LH-B-04 • Firmware 4.8.2</span>
      </div>

      {slipOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-inverse-surface/40 p-4 backdrop-blur-sm">
          <div className="flex w-full max-w-md flex-col gap-4 rounded-xl bg-surface-container-lowest p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary-container" />
                <h3 className="font-title-lg text-title-lg">Digital Attendance Slip</h3>
              </div>
              <button
                type="button"
                onClick={() => setSlipOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container text-secondary"
              >
                <X className="h-[18px] w-[18px]" />
              </button>
            </div>
            <div className="flex flex-col gap-2 rounded-xl bg-surface-container-low p-4 font-caption text-caption text-secondary">
              <div className="flex justify-between gap-3">
                <span>Student:</span>
                <span className="font-medium text-on-surface">{indexLabel}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Session:</span>
                <span className="font-medium text-on-surface">{courseLine(session)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Entry Method:</span>
                <span className="font-medium text-on-surface">Kiosk Terminal</span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Timestamp:</span>
                <span className="font-medium text-on-surface">{recorded}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSlipOpen(false)}
              className="h-12 w-full rounded-xl bg-primary-container font-label-lg text-label-lg font-medium text-on-primary shadow-sm"
            >
              Close Slip
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function CheckInNotOpen({
  session,
  onHome,
  onHelp,
}: {
  session: AttendSession;
  onHome: () => void;
  onHelp: () => void;
}) {
  const [toast, setToast] = useState<string | null>(null);
  const lecturer = session.lecturer.trim() || "your lecturer";

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 3500);
  }

  return (
    <div className="flex flex-col px-4 pb-8">
      <KioskBar />
      <div className="mb-4 flex items-center justify-between rounded-xl bg-surface-container-low px-4 py-2 shadow-sm">
        <span className="inline-flex min-w-0 items-center gap-1 font-caption text-caption font-medium text-secondary">
          <Navigation className="h-[18px] w-[18px] shrink-0" />
          <span className="truncate">{session.venue || "Classroom"}</span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-surface-container-highest px-2 py-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
          <span className="font-caption text-caption font-medium text-on-secondary-container">Auto-lock active</span>
        </span>
      </div>

      <section className="relative flex flex-col items-center overflow-hidden rounded-xl bg-surface-container-lowest p-4 text-center shadow-md">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-surface-container-high" />
        <div className="relative mt-2 mb-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-warning-container text-warning">
            <TimerOff className="h-10 w-10" />
          </div>
          <div className="absolute -right-1 -bottom-1 flex h-7 w-7 items-center justify-center rounded-full bg-surface-container-lowest text-warning shadow-sm">
            <AlertCircle className="h-[18px] w-[18px]" />
          </div>
        </div>
        <h1 className="mb-1 text-[26px] leading-[34px] font-bold tracking-tight">Check-in isn&apos;t open</h1>
        <p className="mb-4 max-w-[280px] font-body-md text-body-md leading-snug text-on-surface-variant">
          This session&apos;s check-in window has ended. Your timestamp could not be validated.
        </p>
        <div className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-warning-container px-3 py-1 text-on-warning-container">
          <Clock className="h-4 w-4" />
          <span className="font-label-md text-label-md font-medium">Window Expired</span>
        </div>

        <div className="mb-6 flex w-full flex-col gap-2 rounded-xl bg-surface-container-low p-4 text-left">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-caption text-caption font-semibold tracking-wider text-secondary uppercase">
                Course & Module
              </span>
              <p className="mt-0.5 font-title-lg text-title-lg leading-tight">{courseLine(session)}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-container-high text-primary">
              <Landmark className="h-5 w-5" />
            </div>
          </div>
          <p className="inline-flex items-center gap-2 font-body-md text-body-md font-medium">
            <MapPin className="h-[18px] w-[18px] text-secondary" />
            {session.venue || "Classroom"}
          </p>
          <div className="mt-1 flex flex-col gap-2">
            <div className="flex items-center justify-between rounded-lg bg-surface-container-lowest px-3 py-2.5 shadow-sm">
              <span className="inline-flex items-center gap-2 font-caption text-caption text-secondary">
                <Lock className="h-[18px] w-[18px]" />
                Window was open
              </span>
              <span className="font-label-lg text-label-lg font-semibold">{session.windowClock || "—"}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-surface-container-lowest px-3 py-2.5 shadow-sm">
              <span className="inline-flex items-center gap-2 font-caption text-caption text-secondary">
                <Clock className="h-[18px] w-[18px] text-warning" />
                Current kiosk time
              </span>
              <span className="font-label-lg text-label-lg font-bold text-on-warning-container">
                {session.nowClock || "—"}
              </span>
            </div>
          </div>
        </div>

        <div className="mb-6 flex w-full items-center gap-3 rounded-xl bg-surface-container-high p-3 text-left">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-surface-container text-primary">
            <UserRound className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-label-md text-label-md font-semibold">{lecturer}</p>
            <p className="truncate font-caption text-caption text-secondary">
              Instructor present in {session.venue || "the classroom"}
            </p>
          </div>
          <BadgeCheck className="h-5 w-5 shrink-0 text-secondary" />
        </div>

        <div className="flex w-full flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              showToast("Returning to kiosk landing...");
              window.setTimeout(onHome, 700);
            }}
            className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary-container font-label-lg text-label-lg text-on-primary shadow-sm active:scale-[0.98]"
          >
            Back to Home
          </button>
          <button
            type="button"
            onClick={() => showToast(`Late attendance request sent to ${lecturer}`)}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-surface-container-lowest font-label-lg text-label-lg text-on-secondary-container active:scale-[0.98]"
          >
            <Mail className="h-[18px] w-[18px] text-primary" />
            Request late check-in pass
          </button>
          <button
            type="button"
            onClick={() => {
              showToast(`Please present your physical campus ID to ${lecturer}`);
              onHelp();
            }}
            className="inline-flex w-full items-center justify-center gap-1.5 py-2 font-caption text-caption text-secondary"
          >
            <Headset className="h-4 w-4" />
            Ask your lecturer for manual sign-in
          </button>
        </div>
      </section>

      {toast && (
        <div className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-center justify-between rounded-xl bg-inverse-surface p-3.5 text-inverse-on-surface shadow-xl">
          <span className="font-label-md text-label-md">{toast}</span>
          <button type="button" onClick={() => setToast(null)} className="p-1">
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>
      )}
    </div>
  );
}

export function OutsideClassArea({
  session,
  distanceM,
  radiusM,
  onRetry,
  onHelp,
}: {
  session: AttendSession;
  distanceM?: number;
  radiusM?: number;
  onRetry: () => void;
  onHelp: () => void;
}) {
  const [retrying, setRetrying] = useState(false);
  const radius = radiusM || session.radiusM;
  const past = distanceM != null && radius ? Math.max(0, distanceM - radius) : null;
  const lecturer = session.lecturer.trim();

  function retry() {
    if (retrying) return;
    setRetrying(true);
    window.setTimeout(() => {
      setRetrying(false);
      onRetry();
    }, 1200);
  }

  return (
    <div className="flex flex-col px-4 pb-8">
      <KioskBar />
      <div className="pt-2 pb-4">
        <div className="flex items-center justify-between rounded-xl bg-surface-container-low p-3 shadow-sm">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-error opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-error" />
            </span>
            <div className="min-w-0">
              <p className="font-caption text-caption font-semibold tracking-wider text-secondary uppercase">Perimeter Guard</p>
              <p className="truncate font-label-md text-label-md">Geofence Out-of-Range</p>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-surface-container px-2.5 py-1 text-error">
            <Satellite className="h-4 w-4" />
            <span className="font-caption text-caption font-medium">GPS Lock</span>
          </span>
        </div>
      </div>

      <div className="mt-2 flex flex-col items-center px-1 text-center">
        <div className="relative my-3 flex h-20 w-20 items-center justify-center rounded-full bg-error-container shadow-md">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error text-on-error shadow-sm">
            <MapPin className="h-7 w-7" />
          </div>
        </div>
        <h1 className="mt-2 text-[26px] leading-[34px] font-bold tracking-tight">You&apos;re outside the class area</h1>
        <p className="mt-2 max-w-xs font-body-md text-body-md leading-relaxed text-secondary">
          Check-ins are only accepted inside the classroom. Move closer and try again.
        </p>
      </div>

      <section className="mt-6 flex flex-col gap-4 rounded-xl bg-surface-container-lowest p-4 shadow-md">
        <div className="relative h-36 overflow-hidden rounded-lg bg-surface-container-high">
          <div className="absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-full bg-surface-container-lowest/90 px-2.5 py-1 shadow-sm">
            <span className="h-2 w-2 animate-ping rounded-full bg-error" />
            <span className="font-caption text-caption font-semibold">
              {past != null ? `${past}m past boundary` : "Outside the boundary"}
            </span>
          </div>
          <div className="absolute inset-x-2.5 bottom-2.5 flex items-center justify-between text-on-surface">
            <span className="font-caption text-caption font-medium">Campus Beacons: Inactive</span>
            <span className="font-caption text-caption font-semibold tracking-wide">{session.code || "—"}</span>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg bg-surface-container-low p-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-container-highest text-primary">
            <DoorOpen className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-caption text-caption font-medium tracking-wide text-secondary uppercase">Required Zone</span>
              <span className="rounded-full bg-surface-container-highest px-2 py-0.5 font-caption text-caption font-semibold text-primary">
                {radius ? `±${radius}m Target` : "Class area"}
              </span>
            </div>
            <p className="mt-0.5 truncate font-title-md text-title-md font-semibold">{session.venue || "Classroom"}</p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg bg-error-container/40 p-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-error-container text-error">
            <MapPin className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-caption text-caption font-medium tracking-wide text-error uppercase">Detected Position</span>
              <span className="rounded-full bg-error-container px-2 py-0.5 font-caption text-caption font-bold text-on-error-container">
                {distanceM != null ? `~${distanceM}m away` : "Out of range"}
              </span>
            </div>
            <p className="mt-0.5 truncate font-title-md text-title-md font-semibold">Outside the classroom</p>
            <p className="font-caption text-caption text-on-surface-variant">Outside geofence radius</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-lg bg-surface-container px-3 py-2.5 text-secondary">
          <Wifi className="h-5 w-5 shrink-0 text-primary" />
          <span className="font-caption text-caption leading-snug">
            We recommend your phone’s Wi-Fi is switched ON to improve indoor positioning accuracy.
          </span>
        </div>
      </section>

      <div className="mt-4 flex items-center gap-3 rounded-xl bg-surface-container-low p-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-primary">
          <UserRound className="h-6 w-6" />
        </div>
        <p className="min-w-0 flex-1 truncate font-title-md text-title-md font-semibold">
          {lecturer || "Your lecturer"}
        </p>
        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-tertiary-container" />
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <button
          type="button"
          onClick={retry}
          disabled={retrying}
          className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary font-label-lg text-label-lg font-semibold text-on-primary shadow-md active:scale-[0.98] disabled:opacity-70"
        >
          <RefreshCw className={`h-5 w-5 ${retrying ? "animate-spin" : ""}`} />
          {retrying ? "Recalibrating GPS..." : "Try again"}
        </button>
        <button
          type="button"
          onClick={onHelp}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-surface-container-lowest font-label-lg text-label-lg font-medium text-secondary shadow-sm"
        >
          <Headset className="h-5 w-5" />
          Contact lecturer
        </button>
      </div>

      <div className="mt-5 px-4 text-center">
        <p className="font-caption text-caption text-secondary">
          Need help? Speak with <span className="font-medium text-on-surface">{lecturer || "your lecturer"}</span> at the podium.
        </p>
        {session.closesIn && (
          <p className="mt-1.5 inline-flex items-center gap-1.5 font-caption text-caption text-secondary">
            <Lock className="h-3.5 w-3.5" />
            Session closes automatically in {session.closesIn}
          </p>
        )}
      </div>
    </div>
  );
}

export function IdentityCheckFailed({
  session,
  indexNumber,
  attempt,
  onRetry,
}: {
  session: AttendSession;
  indexNumber: string;
  attempt: number;
  onRetry: () => void;
}) {
  const [manualOpen, setManualOpen] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const lecturer = session.lecturer.trim() || "your lecturer";
  const banner = [session.code, session.title].filter(Boolean).join(": ");
  const place = session.venue ? ` • ${session.venue}` : "";

  function retry() {
    if (retrying) return;
    setRetrying(true);
    window.setTimeout(() => {
      setRetrying(false);
      onRetry();
    }, 1200);
  }

  return (
    <div className="flex flex-col px-4 pb-8">
      <KioskBar />
      <div className="mb-4 flex items-center justify-between rounded-xl bg-surface-container-low px-4 py-2.5 shadow-sm">
        <span className="min-w-0 truncate font-caption text-caption font-medium tracking-tight text-secondary">
          {banner ? `${banner}${place}` : session.venue || "Classroom"}
        </span>
        <span className="shrink-0 rounded-full bg-surface-container-highest px-2 py-0.5 font-caption text-caption font-medium text-on-surface-variant">
          Attempt {attempt} of 3
        </span>
      </div>

      <section className="flex flex-col items-center rounded-2xl bg-surface-container-lowest p-6 text-center shadow-sm">
        <div className="relative mt-1 mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-error-container">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error text-on-error shadow-md">
            <UserRound className="h-8 w-8" />
          </div>
          <div className="absolute -right-1 -bottom-1 rounded-full bg-surface-container-lowest p-1 shadow-sm">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-error text-on-error">
              <X className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
        <h1 className="mb-2 text-[26px] leading-[34px] font-bold">We couldn&apos;t verify your face</h1>
        <p className="mb-1 max-w-xs font-body-md text-body-md leading-relaxed text-secondary">
          Your selfie did not match your student profile or liveness could not be confirmed.
        </p>
        <div className="mt-4 flex w-full items-center justify-between rounded-xl bg-surface-container-low p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-surface-container-highest text-secondary">
              <UserRound className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="font-label-md text-label-md leading-tight font-semibold">{indexNumber.trim() || "Student"}</p>
              <p className="font-caption text-caption text-secondary">Index on this check-in</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-error-container px-2 py-1 font-caption text-caption font-semibold text-on-error-container">
            Not verified
          </span>
        </div>
      </section>

      <section className="mt-3 flex flex-col rounded-2xl bg-surface-container-lowest p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-fixed text-primary">
            <Lightbulb className="h-[17px] w-[17px]" />
          </div>
          <h2 className="font-title-md text-title-md">Tips for accurate verification</h2>
        </div>
        <div className="flex flex-col gap-2.5">
          <Tip icon={<UserRound className="h-[18px] w-[18px]" />} title="Remove hats or tinted glasses" body="Hair and eye accessories can obscure distinctive facial landmarks." />
          <Tip icon={<Sun className="h-[18px] w-[18px]" />} title="Face the light directly" body="Avoid heavy backlighting from windows or bright lecture projector beams." />
          <Tip icon={<Smartphone className="h-[18px] w-[18px]" />} title="Hold the camera at eye level" body="Align your face inside the oval frame and blink naturally when prompted." />
        </div>
      </section>

      <div className="mt-3 flex items-start gap-3 rounded-2xl bg-error-container/40 p-4 shadow-sm">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-error-container text-on-error-container">
          <TriangleAlert className="h-[18px] w-[18px]" />
        </div>
        <div>
          <p className="font-label-md text-label-md font-semibold">Show this screen to your lecturer</p>
          <p className="mt-0.5 font-caption text-caption leading-snug text-on-surface-variant">
            Your lecturer now has an alert for this failed check-in and can mark you present if you are in class. If the
            camera cannot verify you, keep this screen open instead of retrying.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={retry}
          className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary-container font-label-lg text-label-lg font-medium text-on-primary shadow-sm active:scale-[0.98]"
        >
          <RefreshCw className={`h-5 w-5 ${retrying ? "animate-spin" : ""}`} />
          {retrying ? "Aligning camera..." : "Try again"}
        </button>
        <button
          type="button"
          onClick={() => setManualOpen(true)}
          className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl py-2 font-label-md text-label-md font-semibold text-primary"
        >
          Ask lecturer for manual verification
        </button>
      </div>

      {manualOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-inverse-surface/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="faculty-passcode-title"
            className="flex w-full max-w-[420px] flex-col rounded-xl bg-surface-container-low p-4 shadow-sm"
          >
            <div className="mb-1.5 flex items-center justify-between">
              <p id="faculty-passcode-title" className="font-title-md text-title-md">Faculty Passcode Ready</p>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setManualOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-full text-secondary"
              >
                <X className="h-[18px] w-[18px]" />
              </button>
            </div>
            <p className="mb-3 font-caption text-caption text-secondary">
              Present this terminal to {lecturer} or your Teaching Assistant to enter their 4-digit faculty pin.
            </p>
            <div className="flex justify-center gap-2">
              {["a", "b", "c", "d"].map((dot) => (
                <div
                  key={dot}
                  className="flex h-12 w-11 items-center justify-center rounded-xl bg-surface-container-lowest font-title-lg text-title-lg shadow-sm"
                >
                  •
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Tip({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-surface-container-low p-2.5">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container-highest text-secondary">
        {icon}
      </div>
      <div>
        <p className="font-label-md text-label-md font-medium">{title}</p>
        <p className="font-caption text-caption text-secondary">{body}</p>
      </div>
    </div>
  );
}
