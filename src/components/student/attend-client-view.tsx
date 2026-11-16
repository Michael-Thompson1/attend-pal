"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Camera,
  CheckCircle2,
  Clock,
  HelpCircle,
  IdCard,
  MapPin,
  RefreshCw,
  School,
  ShieldCheck,
  User,
  X,
} from "lucide-react";

export type AttendSession = {
  code: string;
  title: string;
  lecturer: string;
  venue: string;
  whenLabel: string;
  closesIn: string;
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
}: {
  session: AttendSession;
  token: string;
}) {
  const [step, setStep] = useState<Step>("landing");
  const [indexNumber, setIndexNumber] = useState("");
  const [indexError, setIndexError] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [humanChecked, setHumanChecked] = useState(false);

  function continueFromIndex() {
    const value = indexNumber.trim().toUpperCase();
    if (!value) {
      setIndexError("Enter your index number.");
      return;
    }
    if (value === "UNKNOWN") {
      setIndexError("We couldn't find that index number in this class.");
      return;
    }
    setIndexError(null);
    if (value === "CLOSED") {
      setStep("closed");
      return;
    }
    if (value === "EARLY") {
      setStep("not-open");
      return;
    }
    if (value === "DONE") {
      setStep("already");
      return;
    }
    setStep("location");
  }

  function shareLocation() {
    const value = indexNumber.trim().toUpperCase();
    if (value === "BLUR") {
      setStep("imprecise");
      return;
    }
    if (value === "FAR") {
      setStep("bounds");
      return;
    }
    setStep("locating");
    window.setTimeout(() => setStep("located"), 900);
  }

  function submitSelfie() {
    const value = indexNumber.trim().toUpperCase();
    if (value === "NOMATCH") {
      setStep("identity");
      return;
    }
    if (value === "REVIEW") {
      setStep("flagged");
      return;
    }
    setStep("verified");
  }

  return (
    <main className="min-h-screen bg-surface text-on-surface">
      <div className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col px-4 pb-8">
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
            onToggleHuman={() => setHumanChecked((current) => !current)}
            onBack={() => setStep("landing")}
            onContinue={continueFromIndex}
            onHelp={() => setHelpOpen(true)}
          />
        )}
        {step === "location" && (
          <LocationPrompt
            session={session}
            onBack={() => setStep("index")}
            onShare={shareLocation}
          />
        )}
        {step === "locating" && <Locating />}
        {step === "located" && (
          <Located onContinue={() => setStep("selfie")} />
        )}
        {step === "selfie" && (
          <SelfieCapture
            onBack={() => setStep("located")}
            onCapture={() => setStep("review")}
          />
        )}
        {step === "review" && (
          <SelfieReview
            onRetake={() => setStep("selfie")}
            onUse={submitSelfie}
          />
        )}
        {step === "verified" && (
          <Result
            icon={CheckCircle2}
            tone="success"
            title="You're marked present"
            body={`You're checked in for ${session.code}. You can close this page.`}
          />
        )}
        {step === "identity" && (
          <Result
            icon={User}
            tone="error"
            title="Identity check failed"
            body="We couldn't match your photo to the class list. Use a bright room, face the camera, and blink once."
            actionLabel="Try again"
            onAction={() => setStep("selfie")}
          />
        )}
        {step === "flagged" && (
          <Result
            icon={ShieldCheck}
            tone="neutral"
            title="Sent to your lecturer for review"
            body="Your check-in was not counted yet. Your lecturer can approve it."
          />
        )}
        {step === "bounds" && (
          <Result
            icon={MapPin}
            tone="error"
            title="Out of bounds"
            body="You need to be inside the class area. Move closer to the room and try again."
            actionLabel="Try again"
            onAction={() => setStep("location")}
          />
        )}
        {step === "imprecise" && (
          <Result
            icon={MapPin}
            tone="neutral"
            title="Couldn't get a precise location"
            body="Stand near a window or step outside for a moment, then try again."
            actionLabel="Try again"
            onAction={() => setStep("location")}
          />
        )}
        {step === "not-open" && (
          <Result
            icon={Clock}
            tone="neutral"
            title="Check-in isn't open"
            body={`${session.code} is not taking attendance right now.`}
          />
        )}
        {step === "closed" && (
          <Result
            icon={X}
            tone="error"
            title="Link no longer active"
            body="Ask your lecturer for a new link or code."
          />
        )}
        {step === "already" && (
          <Result
            icon={BadgeCheck}
            tone="success"
            title="Already checked in"
            body={`You're already marked present for ${session.code}.`}
          />
        )}
      </div>

      {helpOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-inverse-surface/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
            className="w-full max-w-[420px] rounded-xl bg-surface-container-lowest p-5"
          >
            <h2 id="help-title" className="font-title-lg text-title-lg text-on-surface">
              Ask your lecturer for help
            </h2>
            <p className="mt-2 font-body-md text-body-md text-secondary">
              Show them this screen. They can check that you are on the class list and that check-in is open.
            </p>
            <button
              type="button"
              onClick={() => setHelpOpen(false)}
              className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary font-label-lg text-label-lg text-on-primary"
            >
              Close
            </button>
          </div>
        </div>
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
    <div className="flex flex-1 flex-col gap-4 pt-6">
      <header className="flex flex-col items-center gap-2 pb-1">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-on-primary">
          <BadgeCheck className="h-5 w-5" />
        </div>
        <span className="font-title-md text-title-md text-primary">Attend Pal</span>
      </header>

      <section className="space-y-4 rounded-xl bg-surface-container-lowest p-5 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-surface-container-high px-3 py-1.5 font-caption text-caption font-semibold text-on-surface">
            <Clock className="h-4 w-4 text-primary" />
            Check-in closes in {session.closesIn}
          </span>
        </div>
        <div>
          <p className="font-caption text-caption font-bold tracking-wide text-primary uppercase">
            {session.code}
          </p>
          <h1 className="font-headline-md text-headline-md text-on-surface">{session.title}</h1>
        </div>
        <InfoRow icon={School} label="Lecturer" value={session.lecturer} />
        <InfoRow icon={MapPin} label="Room" value={session.venue} />
        <InfoRow icon={Clock} label="Time" value={session.whenLabel} />
        <p className="inline-flex items-center gap-2 rounded-lg bg-secondary-container px-3 py-2 font-caption text-caption text-on-surface">
          <CheckCircle2 className="h-4 w-4 text-tertiary" />
          Check-in is open
        </p>
      </section>

      <section className="space-y-3 rounded-xl bg-surface-container-lowest p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-title-lg text-title-lg text-on-surface">What you&apos;ll do</h2>
          <span className="font-caption text-caption text-secondary">About 20 seconds</span>
        </div>
        <StepLine n={1} title="Enter your index number" detail="The number on your student ID" />
        <StepLine n={2} title="Confirm you're in class" detail="We'll check your location" />
        <StepLine n={3} title="Take a quick selfie" detail="Look at the camera and blink" />
      </section>

      <section className="flex items-start gap-3 rounded-xl bg-surface-container-low p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <p className="font-caption text-caption text-on-surface">
          Your selfie is used only to verify who you are. A successful photo is not kept.
        </p>
      </section>

      <div className="mt-auto space-y-3 pt-2">
        <button
          type="button"
          onClick={onStart}
          className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary font-title-md text-title-md text-on-primary"
        >
          Start check-in
          <ArrowRight className="h-5 w-5" />
        </button>
        <p className="text-center font-caption text-caption text-secondary">
          Having trouble?{" "}
          <button
            type="button"
            onClick={onHelp}
            className="inline-flex min-h-11 items-center justify-center font-medium text-primary underline"
          >
            Ask your lecturer for help
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
}) {
  return (
    <div className="flex flex-1 flex-col">
      <StepHeader step={1} label="Your index number" onBack={onBack} onHelp={onHelp} />
      <p className="mt-4 inline-flex items-center gap-2 self-start rounded-full bg-surface-container px-3 py-1 font-label-md text-label-md text-on-surface">
        <School className="h-4 w-4 text-primary" />
        {session.code} · {session.venue}
      </p>
      <h1 className="mt-3 font-headline-md text-headline-md text-on-surface">
        Enter your index number
      </h1>
      <p className="mt-1 font-body-md text-body-md text-secondary">
        Use the number on your student ID.
      </p>
      <label className="mt-6 flex h-16 items-center gap-3 rounded-xl bg-surface-container-lowest px-4 shadow-sm">
        <IdCard className="h-6 w-6 shrink-0 text-primary" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoCapitalize="characters"
          autoComplete="off"
          placeholder="Index number"
          className="h-full w-full bg-transparent font-title-lg text-title-lg tracking-wide text-on-surface placeholder:text-outline focus:outline-none"
        />
        {value && (
          <button
            type="button"
            aria-label="Clear index number"
            onClick={() => onChange("")}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-container text-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </label>
      {error && (
        <div className="mt-3 rounded-xl bg-error-container p-4 text-on-error-container">
          <p className="font-label-md text-label-md font-semibold">{error}</p>
          <p className="mt-1 font-caption text-caption">Check the number and try again.</p>
        </div>
      )}
      <button
        type="button"
        role="checkbox"
        aria-checked={humanChecked}
        onClick={onToggleHuman}
        className="mt-4 flex min-h-14 items-center gap-3 rounded-xl bg-surface-container-lowest p-4 text-left shadow-sm"
      >
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-lg ${
            humanChecked ? "bg-tertiary-container text-tertiary-fixed" : "bg-surface-container-high"
          }`}
        >
          {humanChecked && <CheckCircle2 className="h-4 w-4" />}
        </span>
        <span>
          <span className="block font-label-lg text-label-lg text-on-surface">I&apos;m a student in this class</span>
          <span className="block font-caption text-caption text-secondary">Tap to confirm</span>
        </span>
      </button>
      <div className="mt-auto space-y-2 pt-8">
        <button
          type="button"
          disabled={!humanChecked}
          onClick={onContinue}
          className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary font-label-lg text-label-lg text-on-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          Continue
          <ArrowRight className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-11 w-full items-center justify-center font-label-lg text-label-lg text-primary"
        >
          Back to class info
        </button>
      </div>
    </div>
  );
}

function LocationPrompt({
  session,
  onBack,
  onShare,
}: {
  session: AttendSession;
  onBack: () => void;
  onShare: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <StepHeader step={2} label="Your location" onBack={onBack} />
      <div className="mt-8 flex flex-1 flex-col items-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-fixed text-primary">
          <MapPin className="h-10 w-10" />
        </div>
        <h1 className="mt-6 font-headline-md text-headline-md text-on-surface">
          Confirm you&apos;re in class
        </h1>
        <p className="mt-2 font-body-md text-body-md text-secondary">
          Attend Pal needs your location to see that you are in {session.venue}. Your phone will ask for permission.
        </p>
      </div>
      <button
        type="button"
        onClick={onShare}
        className="inline-flex h-14 w-full items-center justify-center rounded-xl bg-primary font-label-lg text-label-lg text-on-primary"
      >
        Share location
      </button>
    </div>
  );
}

function Locating() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <RefreshCw className="h-10 w-10 animate-spin text-primary" />
      <h1 className="mt-6 font-headline-sm text-headline-sm text-on-surface">Checking your location</h1>
      <p className="mt-2 font-body-md text-body-md text-secondary">Stay on this page for a moment.</p>
    </div>
  );
}

function Located({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-tertiary-container text-tertiary-fixed">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h1 className="mt-6 font-headline-md text-headline-md text-on-surface">You&apos;re in the class area</h1>
        <p className="mt-2 font-body-md text-body-md text-secondary">Next, take a quick selfie.</p>
      </div>
      <button
        type="button"
        onClick={onContinue}
        className="inline-flex h-14 w-full items-center justify-center rounded-xl bg-primary font-label-lg text-label-lg text-on-primary"
      >
        Continue
      </button>
    </div>
  );
}

function SelfieCapture({ onBack, onCapture }: { onBack: () => void; onCapture: () => void }) {
  return (
    <div className="flex flex-1 flex-col">
      <StepHeader step={3} label="Your photo" onBack={onBack} />
      <h1 className="mt-4 font-headline-sm text-headline-sm text-on-surface">Look at the camera</h1>
      <p className="mt-1 font-body-md text-body-md text-secondary">Hold the phone at eye level and blink once.</p>
      <div className="my-6 flex flex-1 items-center justify-center">
        <div className="flex h-64 w-64 items-center justify-center rounded-full border-4 border-primary bg-surface-container-high text-primary">
          <User className="h-24 w-24" />
        </div>
      </div>
      <button
        type="button"
        onClick={onCapture}
        className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary font-label-lg text-label-lg text-on-primary"
      >
        <Camera className="h-5 w-5" />
        Take photo
      </button>
    </div>
  );
}

function SelfieReview({ onRetake, onUse }: { onRetake: () => void; onUse: () => void }) {
  return (
    <div className="flex flex-1 flex-col">
      <h1 className="mt-6 font-headline-sm text-headline-sm text-on-surface">Use this photo?</h1>
      <p className="mt-1 font-body-md text-body-md text-secondary">Your face should be clear and filling the circle.</p>
      <div className="my-6 flex flex-1 items-center justify-center">
        <div className="flex h-64 w-64 items-center justify-center rounded-full bg-surface-container-highest text-primary">
          <User className="h-24 w-24" />
        </div>
      </div>
      <div className="space-y-2">
        <button
          type="button"
          onClick={onUse}
          className="inline-flex h-14 w-full items-center justify-center rounded-xl bg-primary font-label-lg text-label-lg text-on-primary"
        >
          Use this photo
        </button>
        <button
          type="button"
          onClick={onRetake}
          className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-outline font-label-lg text-label-lg text-primary"
        >
          Retake
        </button>
      </div>
    </div>
  );
}

function Result({
  icon: Icon,
  tone,
  title,
  body,
  actionLabel,
  onAction,
}: {
  icon: typeof CheckCircle2;
  tone: "success" | "error" | "neutral";
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const toneClass =
    tone === "success"
      ? "bg-tertiary-container text-tertiary-fixed"
      : tone === "error"
        ? "bg-error-container text-error"
        : "bg-secondary-container text-on-surface";

  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <div className={`flex h-20 w-20 items-center justify-center rounded-full ${toneClass}`}>
        <Icon className="h-10 w-10" />
      </div>
      <h1 className="mt-6 font-headline-md text-headline-md text-on-surface">{title}</h1>
      <p className="mt-2 font-body-md text-body-md text-secondary">{body}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-8 inline-flex h-14 w-full items-center justify-center rounded-xl bg-primary font-label-lg text-label-lg text-on-primary"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function StepHeader({
  step,
  label,
  onBack,
  onHelp,
}: {
  step: 1 | 2 | 3;
  label: string;
  onBack: () => void;
  onHelp?: () => void;
}) {
  return (
    <div className="pt-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Go back"
          onClick={onBack}
          className="flex h-11 w-11 items-center justify-center rounded-full text-on-surface hover:bg-surface-container-high"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <span className="font-label-md text-label-md font-semibold text-primary">Attend Pal</span>
        {onHelp ? (
          <button
            type="button"
            aria-label="Help"
            onClick={onHelp}
            className="flex h-11 w-11 items-center justify-center rounded-full text-secondary"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
        ) : (
          <span className="h-11 w-11" />
        )}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="font-label-md text-label-md font-semibold text-primary">Step {step} of 3</span>
        <span className="font-caption text-caption text-secondary">{label}</span>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={`h-1.5 rounded-full ${n <= step ? "bg-primary-container" : "bg-surface-container-high"}`}
          />
        ))}
      </div>
    </div>
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
    <div className="flex items-start gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-fixed font-caption text-caption font-bold text-primary">
        {n}
      </span>
      <div>
        <p className="font-label-lg text-label-lg text-on-surface">{title}</p>
        <p className="font-caption text-caption text-secondary">{detail}</p>
      </div>
    </div>
  );
}
