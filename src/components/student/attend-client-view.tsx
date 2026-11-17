"use client";

import { AttendMark } from "@/components/brand/attend-mark";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import LinkInactiveView from "@/components/student/link-inactive-view";
import {
  AlreadyCheckedIn,
  CheckInNotOpen,
  IdentityCheckFailed,
  OutsideClassArea,
} from "@/components/student/attend-results";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Camera,
  Check,
  CheckCircle2,
  Circle,
  Clock,
  Eye,
  FlipHorizontal2,
  HelpCircle,
  IdCard,
  Info,
  Lock,
  MapPin,
  Radio,
  RefreshCw,
  RotateCcw,
  School,
  Send,
  ShieldCheck,
  Sun,
  User,
  Wifi,
  X,
} from "lucide-react";

function readDeviceId() {
  const key = "attend-pal-device";
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const next = crypto.randomUUID().replace(/-/g, "");
  window.sessionStorage.setItem(key, next);
  return next;
}

export type AttendSession = {
  code: string;
  title: string;
  lecturer: string;
  venue: string;
  whenLabel: string;
  closesIn: string;
  windowClock: string;
  nowClock: string;
  radiusM: number;
};

type Step =
  | "landing"
  | "index"
  | "location"
  | "locating"
  | "located"
  | "selfie"
  | "review"
  | "verified"
  | "identity"
  | "flagged"
  | "bounds"
  | "imprecise"
  | "closed"
  | "not-open"
  | "already";

export default function AttendClientView({
  session,
  token,
  initialStep = "landing",
  detectedTime,
  detectedZone,
}: {
  session: AttendSession;
  token: string;
  initialStep?: Step;
  detectedTime: string;
  detectedZone: string;
}) {
  const [step, setStep] = useState<Step>(initialStep);
  const [indexNumber, setIndexNumber] = useState("");
  const [indexError, setIndexError] = useState<string | null>(null);
  const [humanChecked, setHumanChecked] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [frames, setFrames] = useState<string[]>([]);
  const [attempt, setAttempt] = useState(0);
  const [detail, setDetail] = useState<{ distanceM?: number; radiusM?: number; recordedAt?: string; reference?: string }>({});

  async function postCheck(body: Record<string, unknown>) {
    const response = await fetch("/api/attend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        indexNumber: indexNumber.trim(),
        deviceId: readDeviceId(),
        ...body,
      }),
    });
    const data = (await response.json()) as {
      code?: string;
      distanceM?: number;
      radiusM?: number;
      recordedAt?: string;
      reference?: string;
    };
    return {
      code: data.code ?? "error",
      distanceM: data.distanceM,
      radiusM: data.radiusM,
      recordedAt: data.recordedAt,
      reference: data.reference,
    };
  }

  function applyCode(result: {
    code: string;
    distanceM?: number;
    radiusM?: number;
    recordedAt?: string;
    reference?: string;
  }) {
    const code = result.code;
    if (result.distanceM != null || result.recordedAt || result.reference) {
      setDetail({
        distanceM: result.distanceM,
        radiusM: result.radiusM,
        recordedAt: result.recordedAt,
        reference: result.reference,
      });
    }
    if (code === "identity") setAttempt((current) => current + 1);
    if (code === "not_on_list") {
      setIndexError("We couldn't find that index number in this class.");
      setStep("index");
      return;
    }
    if (code === "turnstile") {
      setIndexError("Tap the box to verify attendance.");
      setStep("index");
      return;
    }
    const screens: Partial<Record<string, Step>> = {
      closed: "closed",
      not_open: "not-open",
      already: "already",
      bounds: "bounds",
      imprecise: "imprecise",
      identity: "identity",
      flagged: "flagged",
      verified: "verified",
    };
    const next = screens[code];
    if (!next) {
      setHelpOpen(true);
      if (step === "locating") setStep("location");
      return;
    }
    setStep(next);
  }

  async function continueFromIndex() {
    const value = indexNumber.trim();
    if (!value) {
      setIndexError("Enter your index number.");
      return;
    }
    if (!humanChecked) {
      setIndexError("Tap the box to verify attendance.");
      return;
    }
    setPending(true);
    setIndexError(null);
    try {
      const result = await postCheck({ phase: "index" });
      if (result.code === "ok") setStep("location");
      else applyCode(result);
    } catch {
      setIndexError("Ask your lecturer for help.");
    } finally {
      setPending(false);
    }
  }

  function shareLocation() {
    if (!navigator.geolocation) {
      setStep("imprecise");
      return;
    }
    setPending(true);
    setStep("locating");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const next = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        setCoords(next);
        try {
          const result = await postCheck({ phase: "location", ...next });
          if (result.code === "ok") setStep("located");
          else applyCode(result);
        } catch {
          setStep("imprecise");
        } finally {
          setPending(false);
        }
      },
      () => {
        setPending(false);
        setStep("imprecise");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  }

  async function submitSelfie() {
    if (!coords) {
      setStep("location");
      return;
    }
    if (frames.length < 3) {
      setStep("selfie");
      return;
    }
    setPending(true);
    try {
      const result = await postCheck({ phase: "submit", ...coords, frames });
      setFrames([]);
      applyCode(result);
    } catch {
      setFrames([]);
      setStep("identity");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-screen bg-surface text-on-surface">
      <div className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col">
        {step === "landing" && (
          <Landing
            session={session}
            onStart={() => setStep("index")}
            onHelp={() => setHelpOpen(true)}
          />
        )}
        {step === "index" && (
          <IndexStep
            session={session}
            value={indexNumber}
            error={indexError}
            humanChecked={humanChecked}
            onChange={(next) => {
              setIndexNumber(next);
              setIndexError(null);
            }}
            onToggleHuman={() => {
              setHumanChecked((current) => !current);
              setIndexError(null);
            }}
            onBack={() => setStep("landing")}
            onContinue={continueFromIndex}
            onHelp={() => setHelpOpen(true)}
            pending={pending}
          />
        )}
        {step === "location" && (
          <LocationPrompt
            session={session}
            onBack={() => setStep("index")}
            onShare={shareLocation}
            onWhy={() => setWhyOpen(true)}
            onHelp={() => setHelpOpen(true)}
            pending={pending}
          />
        )}
        {step === "locating" && (
          <Locating
            session={session}
            onCancel={() => setStep("landing")}
            onHelp={() => setHelpOpen(true)}
          />
        )}
        {step === "located" && (
          <Located
            session={session}
            onContinue={() => setStep("selfie")}
            onHelp={() => setHelpOpen(true)}
          />
        )}
        {step === "selfie" && (
          <SelfieCapture
            session={session}
            onBack={() => setStep("located")}
            onCapture={(shots) => {
              setFrames(shots);
              setStep("review");
            }}
            onHelp={() => setHelpOpen(true)}
          />
        )}
        {step === "review" && (
          <SelfieReview
            session={session}
            photo={frames[frames.length - 1] ?? ""}
            onRetake={() => setStep("selfie")}
            onUse={submitSelfie}
            onHelp={() => setHelpOpen(true)}
            pending={pending}
          />
        )}
        {step === "verified" && (
          <MarkedPresent
            session={session}
            indexNumber={indexNumber}
            token={token}
            onDone={() => setStep("landing")}
          />
        )}
        {step === "identity" && (
          <IdentityCheckFailed
            session={session}
            indexNumber={indexNumber}
            attempt={Math.max(attempt, 1)}
            onRetry={() => setStep("selfie")}
          />
        )}
        {step === "flagged" && (
          <Result
            title="Sent to your lecturer for review"
            body="Your check-in was not counted yet. Your lecturer can approve it."
          />
        )}
        {step === "bounds" && (
          <OutsideClassArea
            session={session}
            distanceM={detail.distanceM}
            radiusM={detail.radiusM}
            onRetry={() => setStep("location")}
            onHelp={() => setHelpOpen(true)}
          />
        )}
        {step === "imprecise" && (
          <Result
            title="Couldn't get a precise location"
            body="Stand near a window or step outside for a moment, then try again."
            actionLabel="Try again"
            onAction={() => setStep("location")}
          />
        )}
        {step === "not-open" && (
          <CheckInNotOpen session={session} onHome={() => setStep("landing")} onHelp={() => setHelpOpen(true)} />
        )}
        {step === "closed" && (
          <LinkInactiveView
            venue={session.venue}
            course={session.code ? `${session.code}${session.title ? ` (${session.title})` : ""}` : ""}
            sessionId={token ? `#${token.slice(0, 8).toUpperCase()}` : ""}
            kioskName={session.lecturer ? `${session.lecturer}'s Kiosk` : ""}
            detectedTime={detectedTime}
            detectedZone={detectedZone}
          />
        )}
        {step === "already" && (
          <AlreadyCheckedIn
            session={session}
            indexNumber={indexNumber}
            recordedAt={detail.recordedAt ?? ""}
            reference={detail.reference ?? ""}
            onHome={() => setStep("landing")}
            onHelp={() => setHelpOpen(true)}
          />
        )}
      </div>

      {helpOpen && (
        <Sheet title="Ask your lecturer for help" onClose={() => setHelpOpen(false)}>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Show them this screen. They can check that you are on the class list and that check-in is open.
          </p>
        </Sheet>
      )}
      {whyOpen && (
        <Sheet title="Why location is required" onClose={() => setWhyOpen(false)}>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Attend Pal checks that you are physically in {session.venue}. Your precise location is not stored. We only keep one result: in the room, or not.
          </p>
          <ul className="mt-3 space-y-2 font-caption text-caption text-on-surface-variant">
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary-container" />
              Your precise location is never stored.
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary-container" />
              We only record whether you are in {session.venue}.
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary-container" />
              The check stops as soon as attendance is marked.
            </li>
          </ul>
          <Link href="/privacy" className="mt-4 inline-flex min-h-11 items-center font-label-md text-label-md font-semibold text-primary">
            Privacy policy
          </Link>
        </Sheet>
      )}
    </main>
  );
}

function Landing({
  session,
  onStart,
  onHelp,
}: {
  session: AttendSession;
  onStart: () => void;
  onHelp: () => void;
}) {
  return (
    <div className="flex flex-col space-y-4 px-4 pb-8">
      <header className="flex flex-col items-center pt-2 pb-1">
        <AttendMark />
        <span className="mt-2 font-title-md text-title-md text-primary">Attend Pal</span>
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-surface-container-high px-3 py-1">
          <span className="h-2 w-2 rounded-full bg-tertiary" />
          <span className="font-caption text-caption font-medium tracking-wide text-secondary">
            Campus Mesh Connected
          </span>
        </div>
      </header>

      <section className="space-y-4 rounded-xl bg-surface-container-lowest p-5 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-warning-container px-3 py-1.5 font-caption text-caption font-semibold text-on-warning-container">
            <span className="h-2 w-2 rounded-full bg-warning" />
            <Clock className="h-4 w-4" />
            Check-in closes in {session.closesIn}
          </span>
          <span className="rounded-full bg-surface-container px-2.5 py-1 font-caption text-caption font-medium text-secondary">
            QR Verified
          </span>
        </div>
        <div>
          <p className="font-caption text-caption font-bold tracking-wider text-primary uppercase">
            Fall 2024 • Verified Session
          </p>
          <h1 className="font-headline-md text-headline-md tracking-tight text-on-surface">
            {session.code} {session.title}
          </h1>
        </div>
        <InfoRow icon={School} label="Course Instructor" value={session.lecturer} />
        <InfoRow icon={MapPin} label="Class Location" value={session.venue} />
        <InfoRow icon={Clock} label="Scheduled Time" value={session.whenLabel} />
        <div className="flex items-center gap-2 rounded-lg bg-success-container px-3 py-2 font-caption text-caption font-medium text-success">
          <CheckCircle2 className="h-4 w-4" />
          Session Active • Geofenced Room B
        </div>
      </section>

      <section className="space-y-3.5 rounded-xl bg-surface-container-lowest p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-title-lg text-title-lg text-on-surface">What you&apos;ll do</h2>
          <span className="font-caption text-caption text-secondary">Takes ~20 seconds</span>
        </div>
        <StepLine n={1} title="Enter your index number" detail="Your official university student ID" />
        <StepLine n={2} title="Confirm you're in class" detail="Automatic campus beacon and location verification" />
        <StepLine n={3} title="Take a quick selfie" detail="Instant facial liveness check" />
      </section>

      <section className="rounded-xl bg-surface-container-low p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-container-highest text-primary">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <p className="font-caption text-caption leading-snug font-medium text-on-surface">
              Your selfie is used only to verify your identity and is deleted right after.
            </p>
            <p className="mt-1 inline-flex items-center gap-1 font-caption text-[11px] text-secondary">
              <Lock className="h-3 w-3 text-primary" />
              Encrypted &amp; Zero-Storage Retention Policy
            </p>
          </div>
        </div>
      </section>

      <div className="space-y-3 pt-2">
        <button
          type="button"
          onClick={onStart}
          className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary font-title-md text-title-md text-on-primary shadow-md"
        >
          Start check-in
          <ArrowRight className="h-5 w-5" />
        </button>
        <p className="text-center font-caption text-caption text-secondary">
          Having trouble?{" "}
          <button type="button" onClick={onHelp} className="font-medium text-primary underline">
            Ask your lecturer for help.
          </button>
        </p>
      </div>
    </div>
  );
}

function IndexStep({
  session,
  value,
  error,
  humanChecked,
  onChange,
  onToggleHuman,
  onBack,
  onContinue,
  onHelp,
  pending,
}: {
  session: AttendSession;
  value: string;
  error: string | null;
  humanChecked: boolean;
  onChange: (value: string) => void;
  onToggleHuman: () => void;
  onBack: () => void;
  onContinue: () => void;
  onHelp: () => void;
  pending: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col px-4 pt-4 pb-6">
      <div className="mb-2 flex items-center justify-between">
        <IconButton label="Go back" onClick={onBack}>
          <ArrowLeft className="h-6 w-6" />
        </IconButton>
        <div className="flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-1">
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
          <span className="font-label-md text-label-md font-semibold text-primary">Attend Pal</span>
          <span className="font-caption text-caption text-secondary">Kiosk</span>
        </div>
        <IconButton label="Help and Info" onClick={onHelp}>
          <HelpCircle className="h-5 w-5 text-secondary" />
        </IconButton>
      </div>
      <Progress step={1} label="Step 1 of 3" aside="Student Identification" />

      <div className="mt-4 inline-flex items-center gap-2 self-start rounded-full bg-surface-container px-3 py-1">
        <School className="h-4 w-4 text-primary" />
        <span className="font-label-md text-label-md font-medium text-on-surface">
          {session.code} · {session.venue}
        </span>
      </div>
      <h1 className="mt-2 font-headline-md text-headline-md tracking-tight text-on-surface">
        Enter your index number
      </h1>
      <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
        Use the 8-digit number on your official student ID card.
      </p>

      <label className="mt-6 flex h-16 items-center rounded-xl bg-surface-container-lowest shadow-md">
        <IdCard className="ml-4 h-6 w-6 shrink-0 text-primary" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          autoCapitalize="characters"
          autoComplete="off"
          inputMode="text"
          placeholder="AH/BMS/24/0024"
          className="h-full w-full bg-transparent px-3 font-mono text-[22px] font-semibold tracking-[0.12em] text-on-surface placeholder:text-outline focus:outline-none"
        />
        {value && (
          <button
            type="button"
            aria-label="Clear index number"
            onClick={() => onChange("")}
            className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-surface-container text-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </label>
      <div className="mt-2 flex items-center justify-between px-1.5 font-caption text-caption text-on-surface-variant">
        <span>Numeric keypad enabled</span>
        <span className="font-mono">{value.length}/14 chars</span>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-3 rounded-xl bg-error-container p-3.5 text-on-error-container shadow-sm">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-error" />
          <div>
            <p className="font-label-md text-label-md leading-tight font-semibold">{error}</p>
            <p className="mt-1 font-caption text-caption">Check your physical ID card digits and try again.</p>
            <button
              type="button"
              onClick={onHelp}
              className="mt-1 inline-flex min-h-11 items-center gap-1 font-label-md text-label-md font-semibold text-error"
            >
              Not registered for {session.code}?
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        role="checkbox"
        aria-checked={humanChecked}
        onClick={onToggleHuman}
        className="mt-6 flex items-center justify-between rounded-xl bg-surface-container-lowest p-3.5 text-left shadow-sm"
      >
        <span className="flex items-center gap-3.5">
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-lg ${
              humanChecked ? "bg-tertiary-fixed text-tertiary" : "bg-surface-container-high"
            }`}
          >
            {humanChecked && <Check className="h-4 w-4" />}
          </span>
          <span>
            <span className="block font-label-lg text-label-lg font-medium text-on-surface">
              Verify you are human
            </span>
            <span className={`block font-caption text-caption ${humanChecked ? "text-tertiary" : "text-on-surface-variant"}`}>
              {humanChecked ? "Verification successful" : "Tap the box to verify attendance"}
            </span>
          </span>
        </span>
        <span className="text-right">
          <span className="flex items-center justify-end gap-1 font-caption text-caption font-semibold text-secondary">
            <ShieldCheck className="h-4 w-4" />
            Turnstile
          </span>
          <span className="block text-[11px] text-on-surface-variant">Privacy · Terms</span>
        </span>
      </button>

      <div className="mt-auto space-y-2 pt-6">
        <button
          type="button"
          disabled={pending}
          onClick={onContinue}
          className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary-container font-label-lg text-label-lg font-semibold text-on-primary shadow-md disabled:opacity-60"
        >
          Continue
          <ArrowRight className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-11 w-full items-center justify-center font-label-lg text-label-lg font-medium text-primary"
        >
          ← Back to session info
        </button>
        <p className="pb-2 text-center font-caption text-caption text-on-surface-variant">
          Having trouble?{" "}
          <button type="button" onClick={onHelp} className="font-medium text-primary underline">
            Ask your lecturer for help
          </button>
        </p>
      </div>
    </div>
  );
}

function LocationPrompt({
  session,
  onBack,
  onShare,
  onWhy,
  onHelp,
  pending,
}: {
  session: AttendSession;
  onBack: () => void;
  onShare: () => void;
  onWhy: () => void;
  onHelp: () => void;
  pending: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col px-4 pt-2 pb-6">
      <div className="flex items-center justify-between rounded-full bg-surface-container p-1 shadow-sm">
        <span className="flex-1 rounded-full bg-primary-container py-1.5 text-center font-label-md text-label-md text-on-primary shadow-sm">
          1. Request
        </span>
        <span className="flex-1 py-1.5 text-center font-label-md text-label-md text-on-surface-variant">
          2. Checking
        </span>
        <span className="flex-1 py-1.5 text-center font-label-md text-label-md text-on-surface-variant">
          3. Confirmed
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <IconButton label="Go back" onClick={onBack} filled>
          <ArrowLeft className="h-5 w-5" />
        </IconButton>
        <div className="flex items-center gap-1.5 rounded-full bg-surface-container-lowest px-3 py-1 shadow-sm">
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary-container" />
          <span className="font-label-md text-label-md font-semibold text-primary">Attend Pal</span>
        </div>
        <IconButton label="Privacy Information" onClick={onWhy} filled>
          <Info className="h-5 w-5 text-secondary" />
        </IconButton>
      </div>
      <Progress step={2} label="STEP 2 OF 3" aside="Classroom Presence" />

      <div className="mt-4 inline-flex items-center gap-2 self-start rounded-full bg-surface-container-lowest px-3 py-1.5 shadow-sm">
        <School className="h-4 w-4 text-primary-container" />
        <span className="font-label-md text-label-md font-semibold">{session.code}</span>
        <span className="h-1 w-1 rounded-full bg-outline-variant" />
        <span className="font-label-md text-label-md text-on-surface-variant">{session.venue}</span>
      </div>

      <h1 className="mt-4 text-[26px] leading-[34px] font-bold tracking-tight text-on-surface">
        Confirm you&apos;re in class
      </h1>
      <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
        We need your location to check that you&apos;re in the classroom. We only check this once and don&apos;t track you.
      </p>

      <div className="relative mt-4 flex h-56 items-center justify-center overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
        <div className="absolute h-64 w-64 rounded-full bg-surface-container-low opacity-60" />
        <div className="absolute h-36 w-36 rounded-full bg-surface-container-high" />
        <div className="absolute inset-x-8 h-px bg-outline-variant/30" />
        <div className="absolute inset-y-8 w-px bg-outline-variant/30" />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary-container text-on-primary shadow-lg">
          <Radio className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-tertiary-fixed-dim" />
        </div>
        <div className="absolute bottom-3 inline-flex items-center gap-1.5 rounded-full bg-surface-container-lowest px-3 py-1 font-label-md text-caption font-semibold text-primary-container shadow-sm">
          <Radio className="h-3.5 w-3.5" />
          Geofence: {session.venue} ± 25m
        </div>
      </div>

      <section className="mt-4 flex flex-col gap-3 rounded-xl bg-surface-container-lowest p-4 shadow-sm">
        <div className="flex items-center gap-2 font-title-md text-title-md font-semibold text-primary">
          <ShieldCheck className="h-5 w-5 text-primary-container" />
          Institutional Trust &amp; Privacy
        </div>
        <TrustRow title="One-time verification only" detail="The sensor shuts off instantly after attendance is marked." />
        <TrustRow title="Campus perimeter precision" detail="Validated exclusively within the designated boundary." />
        <TrustRow title="No background location tracking" detail="No battery drain or off-campus trace logs are preserved." />
      </section>

      <button
        type="button"
        disabled={pending}
        onClick={onShare}
        className="mt-4 inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary-container font-label-lg text-label-lg font-semibold text-on-primary shadow-md disabled:opacity-60"
      >
        <MapPin className="h-5 w-5" />
        Allow location
      </button>
      <button
        type="button"
        onClick={onWhy}
        className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 font-label-md text-label-md font-medium text-secondary"
      >
        <HelpCircle className="h-4 w-4" />
        Why do you need this?
      </button>
      <button
        type="button"
        onClick={onHelp}
        className="text-center font-caption text-caption text-outline underline underline-offset-4"
      >
        Having trouble? Ask your lecturer for help
      </button>
    </div>
  );
}

function Locating({
  session,
  onCancel,
  onHelp,
}: {
  session: AttendSession;
  onCancel: () => void;
  onHelp: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col px-4 pt-3 pb-6">
      <Progress step={2} label="Step 2 of 3" aside="Classroom Presence" pulse />
      <div className="mt-4 flex items-center justify-between rounded-full bg-surface-container-low px-4 py-2.5 shadow-sm">
        <span className="inline-flex min-w-0 items-center gap-2 font-label-md text-label-md font-semibold">
          <span className="h-2 w-2 rounded-full bg-success" />
          <span className="truncate">
            {session.code} · {session.venue}
          </span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 font-caption text-caption text-on-surface-variant">
          <Wifi className="h-4 w-4" />
          Secured Kiosk
        </span>
      </div>

      <div className="relative my-4 flex h-64 items-center justify-center overflow-hidden rounded-2xl bg-surface-container-low shadow-sm">
        <div className="absolute h-52 w-52 rounded-full border border-dashed border-primary/25" />
        <div className="absolute h-32 w-32 rounded-full border border-primary-container/20" />
        <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-lg bg-surface-container-lowest/90 px-2.5 py-1 font-caption text-caption text-on-surface-variant">
          <Radio className="h-3.5 w-3.5 text-primary-container" />
          GPS Accuracy: ±2.4m
        </div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-lowest shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container text-on-primary">
              <Radio className="h-5 w-5" />
            </div>
          </div>
          <span className="mt-2 rounded-full bg-surface-container-highest px-2.5 py-0.5 font-caption text-[11px] font-semibold tracking-wider text-primary-container uppercase">
            Triangulating
          </span>
        </div>
        <div className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-lg bg-surface-container-lowest/90 px-2.5 py-1 font-caption text-caption text-on-surface-variant">
          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
          SSID: Campus-UltraMesh
        </div>
      </div>

      <h1 className="text-center font-headline-md text-headline-md font-bold tracking-tight text-on-surface">
        Checking your location...
      </h1>
      <p className="mt-1.5 text-center font-body-md text-body-md text-on-surface-variant">
        This takes a few seconds. Connecting to campus Wi-Fi beacon &amp; GPS triangulation...
      </p>

      <div className="my-4 flex flex-col gap-2.5">
        <StatusRow title="Device GPS ping acquired" detail="High precision coordinate lock" badge="Ready" tone="done" />
        <StatusRow title={`Verifying ${session.venue}`} detail="Validating perimeter boundary fence" badge="Matching" tone="active" />
        <StatusRow title="Beacon Handshake" detail="Bluetooth / Campus BLE terminal" badge="Queued" tone="wait" />
      </div>

      <div className="mb-4 flex items-start gap-3.5 rounded-2xl bg-surface-container-lowest p-4 shadow-sm">
        <div className="rounded-xl bg-surface-container-low p-2.5 text-primary-container">
          <Radio className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-title-md text-title-md font-semibold">{session.venue} Geofence</h2>
            <span className="rounded-full bg-surface-container-low px-2 py-0.5 font-caption text-caption font-semibold text-primary-container">
              45m Radius
            </span>
          </div>
          <p className="mt-1 font-caption text-caption text-on-surface-variant">
            Authorized boundary policy enforced by Registrar. Presence will be registered with microsecond precision upon completion.
          </p>
        </div>
      </div>

      <button
        type="button"
        disabled
        className="inline-flex h-14 w-full cursor-not-allowed items-center justify-center gap-3 rounded-xl bg-primary-container/70 font-label-lg text-label-lg font-semibold text-on-primary"
      >
        <RefreshCw className="h-5 w-5 animate-spin" />
        Verifying coordinates...
      </button>
      <div className="mt-2 flex items-center justify-between px-1">
        <button type="button" onClick={onCancel} className="min-h-11 font-label-md text-label-md text-secondary">
          Cancel check-in
        </button>
        <button
          type="button"
          onClick={onHelp}
          className="inline-flex min-h-11 items-center gap-1 font-label-md text-label-md text-primary-container"
        >
          <HelpCircle className="h-4 w-4" />
          Need lecturer help?
        </button>
      </div>
    </div>
  );
}

function Located({
  session,
  onContinue,
  onHelp,
}: {
  session: AttendSession;
  onContinue: () => void;
  onHelp: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col space-y-5 px-4 pb-8">
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <span className="font-label-md text-label-md font-medium text-on-surface-variant">
            Step 2 of 3 · Location Verified
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-container px-2.5 py-0.5 font-caption text-caption font-semibold text-primary-container">
            <Radio className="h-3.5 w-3.5" />
            Geo-Match
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <span className="h-1.5 rounded-full bg-primary-container" />
          <span className="h-1.5 rounded-full bg-primary-container" />
          <span className="h-1.5 rounded-full bg-surface-container-high" />
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-surface-container-low px-3 py-1.5 shadow-sm">
          <School className="h-4 w-4 text-primary" />
          <span className="font-label-md text-label-md font-semibold">
            {session.code} · {session.venue}
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-outline-variant" />
          <span className="font-caption text-caption text-on-surface-variant">Fall 2024</span>
        </div>
      </div>

      <div className="flex justify-center py-2">
        <div className="flex h-40 w-40 items-center justify-center rounded-full bg-surface-container-low">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-surface-container-lowest shadow-md">
            <MapPin className="h-12 w-12 text-tertiary-container" />
          </div>
        </div>
      </div>

      <div className="space-y-2.5 text-center">
        <h1 className="font-headline-md text-headline-md tracking-tight text-on-surface">Location confirmed</h1>
        <div className="inline-flex items-center gap-2 rounded-full bg-surface-container-low px-3.5 py-1.5 shadow-sm">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-tertiary-container text-on-tertiary">
            <Check className="h-3 w-3" />
          </span>
          <span className="font-label-md text-label-md font-semibold text-tertiary-container">
            Verified inside {session.venue}
          </span>
        </div>
      </div>

      <section className="space-y-3.5 rounded-xl bg-surface-container-lowest p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="font-label-md text-label-md font-semibold">Telemetry Report</span>
          <span className="inline-flex items-center gap-1 font-caption text-caption font-medium text-secondary">
            <span className="h-2 w-2 rounded-full bg-tertiary-container" />
            Encrypted Sync
          </span>
        </div>
        <Metric icon={MapPin} label="Zone Match" value="You're within proximity" extra={<CheckCircle2 className="h-4 w-4 text-tertiary-container" />} />
        <Metric icon={Clock} label="Timestamp" value="10:04 AM Local" extra={<span className="font-caption text-caption text-on-surface-variant">On time</span>} />
        <p className="flex items-start gap-2.5 px-1 font-caption text-caption text-on-surface-variant">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-primary-container" />
          <span>
            <strong className="font-semibold text-on-surface">Zero-Tracking Guarantee:</strong> Precise location coordinates are cryptographically hashed and immediately purged from device cache.
          </span>
        </p>
      </section>

      <button
        type="button"
        onClick={onContinue}
        className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary-container font-label-lg text-label-lg font-semibold text-on-primary shadow-md"
      >
        Continue to selfie check
        <ArrowRight className="h-5 w-5" />
      </button>
      <p className="flex items-center justify-center gap-1.5 font-caption text-caption text-on-surface-variant">
        <User className="h-4 w-4 text-primary-container" />
        Next: Step 3 of 3 (Quick facial liveness check)
      </p>
      <button
        type="button"
        onClick={onHelp}
        className="inline-flex items-center justify-center gap-1.5 font-label-md text-label-md text-secondary"
      >
        <HelpCircle className="h-4 w-4" />
        Having trouble? Ask your lecturer for help
      </button>
    </div>
  );
}

function SelfieCapture({
  session,
  onBack,
  onCapture,
  onHelp,
}: {
  session: AttendSession;
  onBack: () => void;
  onCapture: (frames: string[]) => void;
  onHelp: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const shots = useRef<string[]>([]);
  const [ready, setReady] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [facing, setFacing] = useState<"user" | "environment">("user");

  useEffect(() => {
    let stream: MediaStream | null = null;
    let timer = 0;
    let stopped = false;
    shots.current = [];

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: facing, width: { ideal: 640 }, height: { ideal: 800 } },
        });
        if (stopped) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        if (stopped) {
          window.clearInterval(timer);
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        timer = window.setInterval(() => {
          if (video.readyState < 2 || video.videoWidth === 0) return;
          const canvas = document.createElement("canvas");
          const scale = 480 / video.videoWidth;
          canvas.width = 480;
          canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
          const context = canvas.getContext("2d");
          if (!context) return;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          shots.current = [...shots.current, canvas.toDataURL("image/jpeg", 0.7)].slice(-5);
          if (shots.current.length >= 3) setReady(true);
        }, 150);
      } catch {
        if (!stopped) setBlocked(true);
      }
    }

    void start();
    return () => {
      stopped = true;
      window.clearInterval(timer);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [facing]);

  return (
    <div className="flex flex-col pb-6">
      <div className="flex flex-col gap-2 px-4 pt-2 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 rounded-full bg-surface-container-low px-2.5 py-1 shadow-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-tertiary-container" />
            <span className="font-label-md text-label-md font-semibold">{session.code}</span>
            <span className="font-caption text-caption text-on-surface-variant">· {session.venue}</span>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-surface-container-lowest px-2.5 py-1 shadow-sm">
            <ShieldCheck className="h-4 w-4 text-primary-container" />
            <span className="font-caption text-caption font-semibold text-primary-container">Secure Kiosk</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-label-md text-label-md font-semibold">Step 3 of 3 · Identity Verification</span>
          <span className="font-caption text-caption font-semibold text-primary-container">100%</span>
        </div>
        <div className="grid h-1.5 grid-cols-3 gap-1.5">
          <span className="rounded-full bg-primary-container" />
          <span className="rounded-full bg-primary-container" />
          <span className="rounded-full bg-primary-container" />
        </div>
      </div>

      <div className="px-4">
        <div className="relative flex aspect-[3/4] max-h-[460px] flex-col justify-between overflow-hidden rounded-2xl bg-inverse-surface shadow-md">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_55%)]" />
          <div className="relative z-10 flex items-center justify-between px-4 pt-3">
            <button type="button" aria-label="Go Back" onClick={onBack} className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-on-primary">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1">
              <span className="h-2 w-2 animate-ping rounded-full bg-tertiary-fixed-dim" />
              <span className="font-caption text-caption font-semibold tracking-wide text-on-primary uppercase">Live Feed</span>
            </div>
            <button type="button" aria-label="Toggle Torch" className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-on-primary">
              <Sun className="h-5 w-5" />
            </button>
          </div>
          <div className="relative z-10 flex flex-col items-center px-6">
            <div className="mb-3 rounded-full bg-black/60 px-4 py-1.5">
              <p className="font-label-md text-label-md font-medium text-on-primary">Centre your face in the oval</p>
            </div>
            <div className="relative flex h-56 w-44 items-center justify-center">
              <span className="absolute -top-2 -left-2 h-6 w-6 rounded-tl-lg border-t-2 border-l-2 border-tertiary-fixed-dim" />
              <span className="absolute -top-2 -right-2 h-6 w-6 rounded-tr-lg border-t-2 border-r-2 border-tertiary-fixed-dim" />
              <span className="absolute -bottom-2 -left-2 h-6 w-6 rounded-bl-lg border-b-2 border-l-2 border-tertiary-fixed-dim" />
              <span className="absolute -right-2 -bottom-2 h-6 w-6 rounded-br-lg border-r-2 border-b-2 border-tertiary-fixed-dim" />
              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[50%] border-2 border-dashed border-tertiary-fixed/90 bg-black/30 text-on-primary/40">
                <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
                {blocked && <User className="absolute h-24 w-24" />}
              </div>
            </div>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary-container px-4 py-2 text-on-primary shadow-lg">
              <Eye className="h-5 w-5 animate-pulse text-tertiary-fixed" />
              <span className="font-label-lg text-label-lg font-semibold">Now blink slowly</span>
              <span className="h-2 w-2 rounded-full bg-tertiary-fixed" />
            </div>
          </div>
          <div className="relative z-10 px-4 pb-3 font-mono font-caption text-caption tracking-wider text-on-primary/80">
            GEO-FENCE: OK
          </div>
        </div>
      </div>

      <div className="mt-3 flex gap-1.5 px-4">
        <Tip icon={Sun} label="Good lighting" />
        <Tip icon={Eye} label="Remove glasses" />
        <Tip icon={User} label="Look straight" />
      </div>

      <div className="mt-4 px-4">
        <div className="flex flex-col items-center rounded-2xl bg-surface-container-lowest p-4 shadow-sm">
          <div className="flex w-full items-center justify-around py-1">
            <button type="button" aria-label="Back to location check" onClick={onBack} className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container text-on-surface-variant">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Take verification selfie"
              disabled={!ready}
              onClick={() => onCapture(shots.current)}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-container p-1 shadow-md disabled:opacity-50"
            >
              <span className="flex h-full w-full items-center justify-center rounded-full bg-surface-container-lowest">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-container text-on-primary">
                  <Camera className="h-7 w-7" />
                </span>
              </span>
            </button>
            <button
              type="button"
              aria-label="Switch camera view"
              onClick={() => {
                shots.current = [];
                setReady(false);
                setFacing((current) => (current === "user" ? "environment" : "user"));
              }}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container text-on-surface-variant"
            >
              <FlipHorizontal2 className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-3 inline-flex items-center gap-1.5 text-center font-caption text-caption font-medium text-on-surface-variant">
            <Lock className="h-3.5 w-3.5 text-error" />
            {blocked ? "Allow the camera to take a live photo" : "Gallery upload disabled for secure kiosk attendance"}
          </p>
          <button type="button" onClick={onHelp} className="mt-1 font-label-md text-label-md font-semibold text-primary-container">
            Having trouble? Ask your lecturer for help
          </button>
        </div>
      </div>
    </div>
  );
}

function SelfieReview({
  session,
  photo,
  onRetake,
  onUse,
  onHelp,
  pending,
}: {
  session: AttendSession;
  photo: string;
  onRetake: () => void;
  onUse: () => void;
  onHelp: () => void;
  pending: boolean;
}) {
  return (
    <div className="flex flex-col px-4 pt-2 pb-6">
      <div className="flex gap-1">
        <span className="h-1.5 flex-1 rounded-full bg-primary-container" />
        <span className="h-1.5 flex-1 rounded-full bg-primary-container" />
        <span className="h-1.5 flex-1 rounded-full bg-primary-container" />
      </div>
      <div className="mt-2 flex items-start justify-between">
        <div>
          <p className="font-label-md text-label-md font-medium text-on-surface-variant">
            Step 3 of 3 · Identity Verification
          </p>
          <p className="mt-0.5 font-title-md text-title-md font-semibold">
            {session.code} <span className="font-label-md font-medium text-on-surface-variant">• {session.venue}</span>
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success-container px-3 py-1 font-label-md text-label-md font-semibold text-success shadow-sm">
          <CheckCircle2 className="h-4 w-4" />
          Photo Captured
        </span>
      </div>

      <section className="relative mt-4 flex flex-col items-center overflow-hidden rounded-xl bg-surface-container-lowest p-4 shadow-sm">
        <p className="font-title-md text-title-md font-semibold">Review Verification Selfie</p>
        <p className="mt-0.5 text-center font-caption text-caption text-on-surface-variant">
          Ensure face is centered with clear indoor classroom lighting
        </p>
        <div className="relative mt-4 flex h-80 w-64 items-center justify-center rounded-xl bg-surface-container-low p-3">
          <div className="absolute top-2.5 right-2.5 left-2.5 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 rounded-full bg-inverse-surface/85 px-2 py-0.5 font-caption text-[11px] text-inverse-on-surface">
              <Radio className="h-3 w-3 text-tertiary-fixed" />
              Terminal Beacon 04
            </span>
            <span className="rounded bg-surface-container-lowest/90 px-1.5 py-0.5 font-mono text-[11px] text-on-surface-variant">
              Captured
            </span>
          </div>
          <span className="absolute top-2 left-2 h-4 w-4 rounded-tl border-t-2 border-l-2 border-primary-container" />
          <span className="absolute top-2 right-2 h-4 w-4 rounded-tr border-t-2 border-r-2 border-primary-container" />
          <span className="absolute bottom-2 left-2 h-4 w-4 rounded-bl border-b-2 border-l-2 border-primary-container" />
          <span className="absolute right-2 bottom-2 h-4 w-4 rounded-br border-r-2 border-b-2 border-primary-container" />
          <div className="flex h-72 w-52 items-center justify-center rounded-[50%] border-2 border-success bg-success/20 p-1.5">
            <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[50%] bg-surface-container text-primary">
              {photo ? (
                // The capture is a short-lived data URL from the camera, not a remote host.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="Your verification selfie" className="h-full w-full object-cover" />
              ) : (
                <User className="h-24 w-24" />
              )}
            </div>
          </div>
          <div className="absolute -bottom-1 z-20 inline-flex items-center gap-1 rounded-full bg-success px-3 py-1 font-caption text-[11px] font-semibold tracking-wide text-on-primary uppercase shadow-md">
            <ShieldCheck className="h-3.5 w-3.5" />
            Liveness &amp; Face Detected
          </div>
        </div>
        <div className="mt-6 flex w-full items-center justify-between rounded-lg bg-surface-container-low p-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success-container text-success">
              <BadgeCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="font-label-md text-label-md font-semibold">Face &amp; Liveness Captured</p>
              <p className="font-caption text-caption text-on-surface-variant">Blink frames ready to submit</p>
            </div>
          </div>
          <span className="rounded-full bg-success-container px-2 py-0.5 font-label-md text-label-md font-bold text-success">
            Ready
          </span>
        </div>
        <p className="mt-2 inline-flex items-center gap-1.5 font-caption text-caption text-on-surface-variant">
          <Camera className="h-3.5 w-3.5" />
          Secured optical camera capture • Anti-spoof active
        </p>
      </section>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onRetake}
          className="inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-xl border border-primary-container bg-surface-container-lowest font-label-lg text-label-lg font-semibold text-primary-container shadow-sm"
        >
          <RotateCcw className="h-5 w-5" />
          Retake
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={onUse}
          className="inline-flex h-14 flex-[1.4] items-center justify-center gap-2 rounded-xl bg-primary-container font-label-lg text-label-lg font-semibold text-on-primary shadow-md disabled:opacity-60"
        >
          Submit Attendance
          <Send className="h-5 w-5" />
        </button>
      </div>
      <p className="mt-2 flex items-center justify-center gap-2 text-center font-caption text-caption text-on-surface-variant">
        <Lock className="h-4 w-4 text-tertiary" />
        Photo is deleted right after verification <strong className="font-medium text-on-surface">(Zero-storage policy)</strong>
      </p>
      <p className="mt-2 text-center font-caption text-caption text-on-surface-variant">
        Having trouble?{" "}
        <button type="button" onClick={onHelp} className="font-semibold text-primary-container underline">
          Ask your lecturer for help
        </button>
      </p>
    </div>
  );
}

function MarkedPresent({
  session,
  indexNumber,
  token,
  onDone,
}: {
  session: AttendSession;
  indexNumber: string;
  token: string;
  onDone: () => void;
}) {
  const shownIndex = indexNumber.trim() || "2024-CSC-4418";
  const attendanceId = token === "demo" ? "#AP-884920" : `#AP-${token.slice(0, 6).toUpperCase()}`;

  return (
    <div className="flex flex-col pb-8">
      <header className="flex h-16 items-center justify-between px-4">
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

      <div className="px-4">
        <div className="mb-6 flex items-center justify-between rounded-full bg-surface-container-low px-4 py-2.5 shadow-sm">
          <span className="inline-flex items-center gap-2 font-caption text-caption font-medium text-secondary">
            <span className="h-2.5 w-2.5 rounded-full bg-tertiary-container" />
            Perimeter: Science Quadrangle
          </span>
          <span className="inline-flex items-center gap-1 font-caption text-caption text-secondary">
            <Radio className="h-4 w-4" />
            Signal Locked
          </span>
        </div>

        <div className="flex flex-col items-center px-2 pb-4 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-success-container text-success shadow-md">
            <CheckCircle2 className="h-11 w-11" />
          </div>
          <h1 className="text-[26px] leading-[34px] font-bold tracking-tight">You&apos;re marked present</h1>
          <p className="mt-2 max-w-[280px] font-body-md text-body-md text-on-surface-variant">
            Your attendance has been recorded and submitted to your course record.
          </p>
        </div>

        <section className="mb-4 rounded-xl bg-surface-container-lowest p-4 shadow-sm">
          <div className="-mx-4 -mt-4 mb-3 flex items-start justify-between rounded-t-xl bg-surface-container-low/60 p-4">
            <div>
              <p className="font-caption text-caption font-medium tracking-wide text-secondary uppercase">Course Session</p>
              <p className="mt-0.5 font-title-lg text-title-lg font-semibold tracking-tight">
                {session.code} {session.title}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-success-container px-2.5 py-1 font-caption text-caption font-semibold text-success">
              <BadgeCheck className="h-4 w-4" />
              Recorded
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 pb-2">
            <MiniMeta icon={User} label="Lecturer" value={session.lecturer} />
            <MiniMeta icon={MapPin} label="Location" value={session.venue} />
          </div>
          <div className="mt-2 rounded-xl bg-surface-container-low/30 p-2">
            <div className="mb-2.5 flex items-center justify-between gap-2 font-caption text-caption font-medium text-secondary">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                Logged At: 10:04 AM
              </span>
              <span>Class Window: 10:00 - 11:30 AM</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success-container px-3 py-1.5 font-label-md text-label-md text-success">
                <MapPin className="h-4 w-4" />
                Geo-verified
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success-container px-3 py-1.5 font-label-md text-label-md text-success">
                <User className="h-4 w-4" />
                Face Verified
              </span>
            </div>
          </div>
        </section>

        <div className="mb-6 flex items-center justify-between rounded-xl bg-surface-container p-2 shadow-sm">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-dim font-label-md text-label-md font-semibold text-primary">
              SJ
            </div>
            <div className="min-w-0">
              <p className="truncate font-label-md text-label-md leading-tight font-semibold">Sarah Jenkins</p>
              <p className="mt-0.5 truncate font-caption text-caption text-secondary">ID: {shownIndex} · Year 2</p>
            </div>
          </div>
          <span className="shrink-0 rounded bg-surface-container-highest px-2 py-1 font-caption text-caption font-medium text-on-surface-variant">
            Seat 14B
          </span>
        </div>

        <button
          type="button"
          onClick={onDone}
          className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary-container font-label-lg text-label-lg font-semibold text-on-primary shadow-md"
        >
          Done
          <ArrowRight className="h-5 w-5" />
        </button>
        <div className="mt-4 flex flex-col items-center text-center">
          <p className="inline-flex items-center gap-1.5 font-caption text-caption text-secondary">
            <Lock className="h-3.5 w-3.5" />
            Attendance ID: <span className="font-mono font-medium text-on-surface-variant">{attendanceId}</span> · Stored securely on campus server
          </p>
          <p className="mt-1 font-caption text-[11px] text-outline">Autonomous Integrity Ledger · Station T-04</p>
        </div>
      </div>
    </div>
  );
}

function Result({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-error-container text-error">
        <Info className="h-10 w-10" />
      </div>
      <h1 className="mt-6 font-headline-md text-headline-md text-on-surface">{title}</h1>
      <p className="mt-2 font-body-md text-body-md text-secondary">{body}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-8 inline-flex h-14 w-full items-center justify-center rounded-xl bg-primary-container font-label-lg text-label-lg font-semibold text-on-primary"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-inverse-surface/40 p-4">
      <div role="dialog" aria-modal="true" className="w-full max-w-[420px] rounded-xl bg-surface-container-lowest p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-title-lg text-title-lg text-on-surface">{title}</h2>
          <button type="button" aria-label="Close dialog" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3">{children}</div>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary-container font-label-lg text-label-lg font-semibold text-on-primary"
        >
          Got it, continue
        </button>
      </div>
    </div>
  );
}

function Progress({
  step,
  label,
  aside,
  pulse,
}: {
  step: 1 | 2 | 3;
  label: string;
  aside: string;
  pulse?: boolean;
}) {
  return (
    <div className="mt-2 flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="font-label-md text-label-md font-semibold text-primary">{label}</span>
        <span className="font-caption text-caption font-medium text-on-surface-variant">{aside}</span>
      </div>
      <div className="grid h-1.5 grid-cols-3 gap-2">
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={`rounded-full ${n <= step ? "bg-primary-container" : "bg-surface-container-high"} ${
              pulse && n === step ? "animate-pulse" : ""
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  filled,
  children,
}: {
  label: string;
  onClick: () => void;
  filled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`flex h-11 w-11 items-center justify-center rounded-full ${
        filled ? "bg-surface-container-lowest shadow-sm" : "hover:bg-surface-container-high"
      }`}
    >
      {children}
    </button>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof School;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-surface-container-low px-3 py-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container-highest text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 text-left">
        <p className="font-caption text-caption leading-none text-secondary">{label}</p>
        <p className="truncate font-label-md text-label-md text-on-surface">{value}</p>
      </div>
    </div>
  );
}

function StepLine({ n, title, detail }: { n: number; title: string; detail: string }) {
  return (
    <div className="flex items-start gap-3.5">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-fixed font-caption text-caption font-bold text-primary">
        {n}
      </span>
      <div>
        <p className="font-label-lg text-label-lg text-on-surface">{title}</p>
        <p className="mt-0.5 font-caption text-caption text-on-surface-variant">{detail}</p>
      </div>
    </div>
  );
}

function TrustRow({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-container text-primary-container">
        <Lock className="h-3.5 w-3.5" />
      </div>
      <div>
        <p className="font-label-md text-label-md font-medium text-on-surface">{title}</p>
        <p className="font-caption text-caption text-on-surface-variant">{detail}</p>
      </div>
    </div>
  );
}

function StatusRow({
  title,
  detail,
  badge,
  tone,
}: {
  title: string;
  detail: string;
  badge: string;
  tone: "done" | "active" | "wait";
}) {
  const icon =
    tone === "done" ? (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-success-container text-success">
        <Check className="h-4 w-4" />
      </span>
    ) : tone === "active" ? (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-fixed text-primary-container">
        <RefreshCw className="h-4 w-4 animate-spin" />
      </span>
    ) : (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-container-high text-secondary">
        <Circle className="h-4 w-4" />
      </span>
    );
  const badgeClass =
    tone === "done"
      ? "bg-success-container text-success"
      : tone === "active"
        ? "bg-primary-fixed/60 text-primary-container"
        : "bg-surface-container-high text-secondary";

  return (
    <div className={`flex items-center justify-between rounded-xl bg-surface-container-lowest p-3.5 shadow-sm ${tone === "wait" ? "opacity-75" : ""} ${tone === "active" ? "border-l-4 border-primary-container bg-surface-container-low" : ""}`}>
      <div className="flex min-w-0 items-center gap-3">
        {icon}
        <div className="min-w-0">
          <p className={`truncate font-title-md text-title-md ${tone === "active" ? "font-semibold text-primary-container" : "text-on-surface"}`}>
            {title}
          </p>
          <p className="truncate font-caption text-caption text-on-surface-variant">{detail}</p>
        </div>
      </div>
      <span className={`shrink-0 rounded-full px-2 py-0.5 font-caption text-caption font-semibold ${badgeClass}`}>
        {badge}
      </span>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  extra,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
  extra: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-surface-container-low p-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container-lowest text-primary-container shadow-sm">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="font-caption text-caption text-on-surface-variant">{label}</p>
          <p className="truncate font-title-md text-title-md text-on-surface">{value}</p>
        </div>
      </div>
      {extra}
    </div>
  );
}

function MiniMeta({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg bg-surface-container-low/40 p-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary-container text-on-secondary-fixed">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="font-caption text-caption leading-none text-secondary">{label}</p>
        <p className="mt-1 truncate font-label-md text-label-md font-medium">{value}</p>
      </div>
    </div>
  );
}

function Tip({ icon: Icon, label }: { icon: typeof Sun; label: string }) {
  return (
    <div className="flex min-w-0 flex-1 items-center justify-center gap-1 rounded-full bg-surface-container-low px-2 py-1.5 shadow-sm">
      <Icon className="h-4 w-4 shrink-0 text-primary-container" />
      <span className="truncate font-caption text-caption font-medium text-on-surface-variant">{label}</span>
    </div>
  );
}
