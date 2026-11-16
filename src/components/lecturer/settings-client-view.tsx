"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpen,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  EyeOff,
  GraduationCap,
  IdCard,
  Info,
  LayoutGrid,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Landmark,
  Save,
  Settings,
  Shield,
  SlidersHorizontal,
  Trash2,
  User,
  X,
} from "lucide-react";
import { signOutAction } from "@/app/auth/actions";
import HeaderSearch from "@/components/lecturer/header-search";
import {
  changePasswordAction,
  downloadMyDataAction,
  removeProfilePhotoAction,
  signOutOtherDevicesAction,
  updateNotificationPrefsAction,
  updateProfileAction,
  updateSessionDefaultsAction,
  uploadProfilePhotoAction,
} from "@/app/(lecturer)/settings/actions";

export type SettingsViewData = {
  fullName: string;
  email: string;
  institution: string;
  campus: string;
  photoUrl: string | null;
  radiusM: number;
  windowMinutes: 15 | 30 | 45 | 60;
  requireLiveness: boolean;
  allowSecondCheckin: boolean;
  emailFakeIdentity: boolean;
  emailOutOfBounds: boolean;
  emailSharedDevice: boolean;
  emailSessionSummary: boolean;
  updatedLabel: string;
};

type Panel = "profile" | "security" | "defaults" | "notifications" | "privacy";

const PANELS: { id: Panel; label: string; icon: typeof IdCard }[] = [
  { id: "profile", label: "Profile", icon: IdCard },
  { id: "security", label: "Security", icon: Shield },
  { id: "defaults", label: "Session defaults", icon: SlidersHorizontal },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "privacy", label: "Data and privacy", icon: Lock },
];

const WINDOWS = [
  { minutes: 15, hint: "Short class" },
  { minutes: 30, hint: "Standard lecture" },
  { minutes: 45, hint: "Long class" },
  { minutes: 60, hint: "Lab session" },
] as const;

const ALERT_ROWS = [
  {
    id: "fake",
    title: "Fake identity attempt",
    body: "A photo or face did not match the student on the class list.",
  },
  {
    id: "bounds",
    title: "Out of bounds attempt",
    body: "A student tried to check in from outside the class area.",
  },
  {
    id: "device",
    title: "Several index numbers on one phone",
    body: "More than one student tried to check in from the same phone.",
  },
] as const;

function Switch({
  checked,
  label,
  disabled,
  onChange,
}: {
  checked: boolean;
  label: string;
  disabled?: boolean;
  onChange?: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
        checked ? "bg-primary-container" : "bg-surface-container-highest"
      } ${disabled ? "cursor-not-allowed opacity-80" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-surface-container-lowest shadow transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default function SettingsClientView({ data }: { data: SettingsViewData }) {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [panel, setPanel] = useState<Panel>("profile");
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState(data.fullName);
  const [institution, setInstitution] = useState(data.institution);
  const [savedName, setSavedName] = useState(data.fullName);
  const [savedInstitution, setSavedInstitution] = useState(data.institution);
  const [photoUrl, setPhotoUrl] = useState(data.photoUrl);
  const [radius, setRadius] = useState(data.radiusM);
  const [windowMinutes, setWindowMinutes] = useState<(typeof WINDOWS)[number]["minutes"]>(
    data.windowMinutes
  );
  const [liveness, setLiveness] = useState(data.requireLiveness);
  const [secondCheckin, setSecondCheckin] = useState(data.allowSecondCheckin);
  const [emailAlerts, setEmailAlerts] = useState<Record<string, boolean>>({
    fake: data.emailFakeIdentity,
    bounds: data.emailOutOfBounds,
    device: data.emailSharedDevice,
  });
  const [summaryEmail, setSummaryEmail] = useState(data.emailSessionSummary);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [updatedLabel, setUpdatedLabel] = useState(data.updatedLabel);

  const profileDirty =
    fullName.trim() !== savedName || institution.trim() !== savedInstitution;
  const passwordsMismatch =
    confirmPassword.length > 0 && newPassword !== confirmPassword;

  function run(
    action: () => Promise<{ error?: string; success?: boolean; photoUrl?: string | null; json?: string; filename?: string }>,
    onSuccess: (result: { photoUrl?: string | null; json?: string; filename?: string }) => void,
    message: string
  ) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        setError(result.error);
        setToast(null);
        return;
      }
      onSuccess(result);
      setToast(message);
    });
  }
  const initials = fullName
    .split(" ")
    .filter((part) => part.length > 0)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="fixed left-0 top-0 z-50 hidden h-full w-72 flex-col justify-between border-r border-surface-container-high bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] md:flex">
        <div className="flex flex-col">
          <div className="flex h-16 items-center gap-3 border-b border-surface-container-high px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-on-primary shadow-sm">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-title-lg text-title-lg font-bold tracking-tight text-primary">
                Attend Pal
              </span>
              <span className="font-caption text-caption text-secondary">Lecturer Portal</span>
            </div>
          </div>

          <div className="px-4 pt-6">
            <nav className="flex flex-col gap-1">
              <NavLink href="/dashboard" icon={LayoutGrid} label="Dashboard" />
              <NavLink href="/classes" icon={BookOpen} label="Classes" />
              <NavLink href="/sessions" icon={Clock} label="Sessions" />
              <Link
                href="/alerts"
                className="flex items-center justify-between rounded-xl px-4 py-2.5 font-label-lg text-label-md font-medium text-on-surface-variant transition-all hover:bg-surface-container-high hover:text-on-surface"
              >
                <span className="flex items-center gap-3">
                  <Bell className="h-5 w-5" />
                  Alerts
                </span>
                <span className="rounded-full bg-error-container px-2 py-0.5 font-caption text-caption font-bold text-on-error-container">
                  3
                </span>
              </Link>
              <NavLink href="/reports" icon={BarChart3} label="Reports" />
              <Link
                href="/settings"
                aria-current="page"
                className="flex items-center gap-3 rounded-xl bg-primary-container px-4 py-2.5 font-semibold text-on-primary shadow-sm"
              >
                <Settings className="h-5 w-5" />
                Settings
              </Link>
            </nav>
          </div>
        </div>

        <div className="space-y-4 border-t border-surface-container-high p-4">
          <div className="rounded-xl border border-surface-container-high bg-surface-container-low p-3">
            <div className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
              <div className="flex min-w-0 flex-col">
                <span className="font-caption text-[11px] font-semibold uppercase tracking-wider text-secondary">
                  Faculty &amp; Campus
                </span>
                <span className="truncate font-label-md text-label-md font-semibold text-on-surface">
                  {data.institution}
                </span>
                <span className="truncate font-caption text-caption text-secondary">
                  {data.campus}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-container font-bold text-caption text-on-primary">
                {initials.charAt(0) || "L"}
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-label-md text-label-md font-semibold text-on-surface">
                  {fullName || data.fullName}
                </span>
                <span className="truncate font-caption text-[11px] text-secondary">
                  {data.email}
                </span>
              </div>
            </div>
            <form action={signOutAction}>
              <button
                type="submit"
                title="Sign out"
                className="cursor-pointer rounded-lg p-1.5 text-secondary transition-all hover:bg-error-container/20 hover:text-error"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col md:pl-72">
        <header className="fixed top-0 right-0 left-0 z-40 flex h-16 items-center justify-between border-b border-surface-container-high bg-surface-container-lowest/90 px-6 backdrop-blur-xl md:left-72 lg:px-10">
          <HeaderSearch />
          <div className="flex items-center gap-4">
            <Link
              href="/alerts"
              aria-label="Notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-error ring-2 ring-surface-container-lowest" />
            </Link>
            <div className="hidden h-8 w-px bg-surface-container-high sm:block" />
            <div className="hidden items-center gap-2.5 rounded-full bg-surface-container-low py-1.5 pr-3.5 pl-2 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-on-primary">
                <User className="h-4 w-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-label-md text-label-md leading-tight font-semibold text-on-surface">
                  {fullName || data.fullName}
                </span>
                <span className="font-caption text-caption leading-tight text-secondary">
                  Senior Lecturer
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex w-full flex-col gap-6 px-6 pt-20 pb-12 lg:px-10">
          {error && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-error/30 bg-error-container p-4">
              <div className="flex items-center gap-2 text-on-error-container">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <span className="font-label-md font-semibold">{error}</span>
              </div>
              <button
                type="button"
                aria-label="Dismiss error"
                onClick={() => setError(null)}
                className="rounded-lg p-1 text-on-error-container"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {toast && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-tertiary-container/30 bg-surface-container-lowest p-4 shadow-sm">
              <div className="flex items-center gap-2 text-tertiary">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span className="font-label-md font-semibold text-on-surface">{toast}</span>
              </div>
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => setToast(null)}
                className="rounded-lg p-1 text-secondary hover:text-on-surface"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <span className="font-caption text-caption font-semibold tracking-wide text-primary uppercase">
              Preferences
            </span>
            <h1 className="font-headline-md text-headline-md text-on-surface">Settings</h1>
            <p className="font-body-md text-body-md text-secondary">
              Manage your profile, session defaults and alerts.
            </p>
          </div>

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            <nav
              aria-label="Settings sections"
              className="flex gap-1 overflow-x-auto rounded-xl bg-surface-container-lowest p-2 shadow-sm lg:col-span-3 lg:flex-col"
            >
              {PANELS.map((item) => {
                const Icon = item.icon;
                const active = panel === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-current={active ? "page" : undefined}
                    onClick={() => setPanel(item.id)}
                    className={`flex min-h-11 shrink-0 items-center gap-3 rounded-lg px-4 py-2.5 text-left font-label-lg text-label-lg transition-colors ${
                      active
                        ? "bg-surface-container-high font-semibold text-primary"
                        : "text-secondary hover:bg-surface-container hover:text-on-surface"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="flex flex-col gap-6 lg:col-span-9">
              {panel === "profile" && (
                <section className="flex flex-col gap-6 rounded-xl bg-surface-container-lowest p-6 shadow-sm sm:p-8">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-title-lg text-title-lg font-semibold text-on-surface">
                        Lecturer profile
                      </h2>
                      <p className="mt-1 font-body-md text-body-md text-secondary">
                        Students see your name and faculty on the check-in page.
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-1 font-label-md text-label-md text-on-surface-variant">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary-container" />
                      Faculty member
                    </span>
                  </div>

                  <div className="flex flex-col justify-between gap-4 rounded-xl bg-surface-container-low px-5 py-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-4">
                      {photoUrl ? (
                        // Signed photo URLs expire and are not a fixed image host.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={photoUrl}
                          alt={`${fullName || "Lecturer"} profile photo`}
                          className="h-20 w-20 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-fixed font-title-lg text-title-lg text-primary">
                          {initials || "L"}
                        </div>
                      )}
                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          event.target.value = "";
                          if (!file) return;
                          const formData = new FormData();
                          formData.set("photo", file);
                          run(
                            () => uploadProfilePhotoAction(formData),
                            (result) => setPhotoUrl(result.photoUrl ?? null),
                            "Profile photo saved"
                          );
                        }}
                      />
                      <div className="flex flex-col">
                        <span className="font-title-md text-title-md text-on-surface">
                          Profile picture
                        </span>
                        <span className="font-caption text-caption text-secondary">
                          JPG, PNG or WEBP, up to 4MB
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => photoInputRef.current?.click()}
                        className="inline-flex h-11 items-center gap-2 rounded-xl bg-surface-container-lowest px-4 font-label-lg text-label-lg text-on-surface shadow-sm hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Camera className="h-4 w-4" />
                        Change photo
                      </button>
                      <button
                        type="button"
                        aria-label="Remove picture"
                        disabled={isPending || !photoUrl}
                        onClick={() =>
                          run(
                            () => removeProfilePhotoAction(),
                            () => setPhotoUrl(null),
                            "Profile photo removed"
                          )
                        }
                        className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-secondary hover:bg-error-container/40 hover:text-error"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <label className="flex flex-col gap-1.5">
                    <span className="font-label-lg text-label-lg font-semibold text-on-surface">
                      Full name <span className="text-error">*</span>
                    </span>
                    <span className="relative">
                      <User className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-on-surface-variant" />
                      <input
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                        className="h-12 w-full rounded-xl border border-outline bg-surface-container-high pr-4 pl-11 font-body-md text-body-md text-on-surface focus:border-primary focus:outline-none"
                      />
                    </span>
                    <span className="font-caption text-caption text-secondary">
                      Shown on the check-in page and on attendance reports.
                    </span>
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="flex items-center justify-between font-label-lg text-label-lg font-semibold text-on-surface">
                      School email
                      <span className="inline-flex items-center gap-1 font-caption text-caption font-medium text-secondary">
                        <Lock className="h-3.5 w-3.5" />
                        Locked
                      </span>
                    </span>
                    <span className="relative">
                      <Mail className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-outline" />
                      <input
                        value={data.email}
                        readOnly
                        className="h-12 w-full cursor-not-allowed rounded-xl border border-outline-variant bg-surface-container pr-11 pl-11 font-body-md text-body-md text-secondary"
                      />
                      <Lock className="absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-outline" />
                    </span>
                    <span className="inline-flex items-center gap-1 font-caption text-caption text-outline">
                      <Info className="h-4 w-4" />
                      Your school email can&apos;t be changed here.
                    </span>
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="font-label-lg text-label-lg font-semibold text-on-surface">
                      Institution
                    </span>
                    <span className="relative">
                      <Landmark className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-on-surface-variant" />
                      <input
                        value={institution}
                        onChange={(event) => setInstitution(event.target.value)}
                        className="h-12 w-full rounded-xl border border-outline bg-surface-container-high pr-4 pl-11 font-body-md text-body-md text-on-surface focus:border-primary focus:outline-none"
                      />
                    </span>
                    <span className="font-caption text-caption text-secondary">
                      Students see this on the check-in page.
                    </span>
                  </label>

                  <div className="rounded-xl bg-surface-container-high/60 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-label-md text-label-md text-on-surface-variant">
                        How students see you
                      </span>
                      <span className="font-caption text-caption font-semibold text-primary">
                        Preview
                      </span>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg bg-surface-container-lowest p-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-fixed font-title-md text-title-md text-primary">
                        {initials || "L"}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-title-md text-title-md text-on-surface">
                          {fullName || "Your name"}
                        </span>
                        <span className="font-caption text-caption text-secondary">
                          {institution || "Your faculty"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                    <span className="font-caption text-caption text-secondary">
                      Last updated: {updatedLabel} UTC
                    </span>
                    <button
                      type="button"
                      disabled={isPending || !profileDirty || fullName.trim().length === 0}
                      onClick={() =>
                        run(
                          () =>
                            updateProfileAction({
                              fullName,
                              institution,
                            }),
                          () => {
                            setSavedName(fullName.trim());
                            setSavedInstitution(institution.trim());
                            setFullName(fullName.trim());
                            setInstitution(institution.trim());
                          },
                          "Profile saved"
                        )
                      }
                      className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-6 font-label-lg text-label-lg text-on-primary disabled:cursor-not-allowed disabled:bg-surface-container-highest disabled:text-outline disabled:opacity-60"
                    >
                      <Check className="h-4 w-4" />
                      Save changes
                    </button>
                  </div>
                </section>
              )}

              {panel === "security" && (
                <div className="flex flex-col gap-6">
                  <section className="flex flex-col gap-6 rounded-xl bg-surface-container-lowest p-6 shadow-sm sm:p-8">
                    <div>
                      <h2 className="font-title-lg text-title-lg text-on-surface">Change password</h2>
                      <p className="mt-1 font-body-md text-body-md text-secondary">
                        Use a password you don&apos;t use anywhere else.
                      </p>
                    </div>
                    <PasswordField
                      id="current-password"
                      label="Current password"
                      value={currentPassword}
                      shown={showCurrent}
                      onToggle={() => setShowCurrent((value) => !value)}
                      onChange={setCurrentPassword}
                    />
                    <PasswordField
                      id="new-password"
                      label="New password"
                      value={newPassword}
                      shown={showNew}
                      onToggle={() => setShowNew((value) => !value)}
                      onChange={setNewPassword}
                    />
                    <div className="grid max-w-lg grid-cols-1 gap-2 rounded-xl bg-surface-container-low p-4 sm:grid-cols-3">
                      <Rule met={newPassword.length >= 10} text="At least 10 characters" />
                      <Rule met={/[A-Z]/.test(newPassword) && /\d/.test(newPassword)} text="Uppercase and a number" />
                      <Rule met={/[^A-Za-z0-9]/.test(newPassword)} text="Includes a symbol" />
                    </div>
                    <PasswordField
                      id="confirm-password"
                      label="Confirm new password"
                      value={confirmPassword}
                      shown={showConfirm}
                      onToggle={() => setShowConfirm((value) => !value)}
                      onChange={setConfirmPassword}
                      invalid={passwordsMismatch}
                    />
                    {passwordsMismatch && (
                      <p className="inline-flex items-center gap-1.5 font-caption text-caption text-error">
                        <AlertTriangle className="h-4 w-4" />
                        Passwords must match.
                      </p>
                    )}
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          run(
                            () =>
                              changePasswordAction({
                                currentPassword,
                                newPassword,
                                confirmPassword,
                              }),
                            () => {
                              setCurrentPassword("");
                              setNewPassword("");
                              setConfirmPassword("");
                            },
                            "Password updated"
                          )
                        }
                        className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary-container px-5 font-label-lg text-label-lg text-on-primary hover:bg-primary disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Save className="h-5 w-5" />
                        Update password
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentPassword("");
                          setNewPassword("");
                          setConfirmPassword("");
                        }}
                        className="inline-flex h-12 items-center rounded-xl px-4 font-label-lg text-label-lg text-secondary hover:bg-surface-container-high hover:text-on-surface"
                      >
                        Discard changes
                      </button>
                    </div>
                  </section>

                  <section className="flex flex-col gap-4 rounded-xl bg-surface-container-lowest p-6 shadow-sm sm:p-8">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div>
                        <h2 className="font-title-lg text-title-lg text-on-surface">
                          Signed-in devices
                        </h2>
                        <p className="mt-1 font-body-md text-body-md text-secondary">
                          This device stays signed in. Other phones and computers will be signed out.
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          run(
                            () => signOutOtherDevicesAction(),
                            () => undefined,
                            "Other devices signed out"
                          )
                        }
                        className="inline-flex h-11 items-center gap-2 self-start rounded-xl border border-outline px-4 font-label-lg text-label-lg text-error hover:bg-error-container disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out of other devices
                      </button>
                    </div>
                  </section>
                </div>
              )}

              {panel === "defaults" && (
                <section className="flex flex-col gap-8 rounded-xl bg-surface-container-lowest p-6 shadow-sm sm:p-8">
                  <div className="flex items-start gap-3 rounded-xl bg-secondary-container/60 p-4">
                    <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <p className="font-body-md text-body-md text-on-surface">
                      New sessions start with these values. You can still change them for a single session.
                    </p>
                  </div>
                  <div>
                    <h2 className="font-headline-sm text-headline-sm text-on-surface">
                      Default check-in rules
                    </h2>
                    <p className="mt-1 font-caption text-caption text-secondary">
                      Used the next time you start a session.
                    </p>
                  </div>

                  <div className="flex flex-col gap-4 rounded-xl bg-surface-container-low p-5">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <div>
                        <p className="font-title-md text-title-md text-on-surface">Class area radius</p>
                        <p className="font-caption text-caption text-secondary">
                          Students outside this distance are marked out of bounds.
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary-container px-4 py-1.5 font-label-lg text-label-lg font-bold text-on-primary">
                        {radius} m
                      </span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={300}
                      step={5}
                      value={radius}
                      aria-label="Class area radius"
                      onChange={(event) => setRadius(Number(event.target.value))}
                      className="w-full accent-primary"
                    />
                    <div className="flex justify-between font-caption text-caption text-secondary">
                      {[20, 50, 100, 200, 300].map((mark) => (
                        <button
                          key={mark}
                          type="button"
                          onClick={() => setRadius(mark)}
                          className={mark === radius ? "font-semibold text-primary" : "hover:text-primary"}
                        >
                          {mark} m
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <p className="font-title-md text-title-md text-on-surface">
                      How long check-in stays open
                    </p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {WINDOWS.map((option) => {
                        const active = windowMinutes === option.minutes;
                        return (
                          <button
                            key={option.minutes}
                            type="button"
                            onClick={() => setWindowMinutes(option.minutes)}
                            className={`flex min-h-16 flex-col items-center justify-center rounded-xl px-3 py-3 ${
                              active
                                ? "bg-primary-container text-on-primary shadow-sm"
                                : "bg-surface-container-low text-secondary hover:bg-surface-container-high"
                            }`}
                          >
                            <span className="font-label-lg text-label-lg font-bold">
                              {option.minutes} min
                            </span>
                            <span className="font-caption text-caption">{option.hint}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <ToggleRow
                      icon={User}
                      title="Require a live selfie"
                      body="Students blink so a printed photo or a screen cannot be used."
                      checked={liveness}
                      onChange={() => setLiveness((value) => !value)}
                    />
                    <ToggleRow
                      icon={Clock}
                      title="Allow a second check-in near the end of class"
                      body="Students can check in again in the last 10 minutes."
                      checked={secondCheckin}
                      onChange={() => setSecondCheckin((value) => !value)}
                    />
                  </div>

                  <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
                    <span className="font-caption text-caption text-secondary">
                      Last changed: {updatedLabel} UTC
                    </span>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => {
                          setRadius(100);
                          setWindowMinutes(15);
                          setLiveness(true);
                          setSecondCheckin(false);
                        }}
                        className="inline-flex h-12 items-center justify-center rounded-xl bg-surface-container-low px-5 font-label-lg text-label-lg text-secondary hover:bg-surface-container-high hover:text-on-surface"
                      >
                        Reset to recommended
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          run(
                            () =>
                              updateSessionDefaultsAction({
                                radiusM: radius,
                                windowMinutes,
                                requireLiveness: liveness,
                                allowSecondCheckin: secondCheckin,
                              }),
                            () => setUpdatedLabel("just now"),
                            "Session defaults saved"
                          )
                        }
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary-container px-6 font-label-lg text-label-lg font-bold text-on-primary hover:bg-primary disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Save className="h-5 w-5" />
                        Save defaults
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {panel === "notifications" && (
                <section className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
                  <div className="p-6 sm:p-8">
                    <h2 className="font-headline-sm text-headline-sm text-on-surface">Alerts</h2>
                    <p className="mt-1 max-w-2xl font-body-md text-body-md text-secondary">
                      Choose how you hear about problems during a session. Alerts in Attend Pal stay on.
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-surface-container-low font-label-md text-label-md text-secondary">
                          <th className="px-6 py-4 font-medium">Alert</th>
                          <th className="px-4 py-4 text-center font-medium">In Attend Pal</th>
                          <th className="px-6 py-4 text-center font-medium">Email</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ALERT_ROWS.map((row) => (
                          <tr key={row.id} className="border-t border-surface-container">
                            <td className="px-6 py-5">
                              <p className="font-title-md text-title-md font-semibold text-on-surface">
                                {row.title}
                              </p>
                              <p className="mt-1 max-w-md font-caption text-caption text-secondary">
                                {row.body}
                              </p>
                            </td>
                            <td className="px-4 py-5 text-center">
                              <div className="inline-flex flex-col items-center gap-1">
                                <Switch checked disabled label={`${row.title} in Attend Pal`} />
                                <span className="inline-flex items-center gap-1 font-caption text-caption text-secondary">
                                  <Lock className="h-3 w-3" />
                                  Always on
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-5 text-center">
                              <Switch
                                checked={emailAlerts[row.id]}
                                label={`${row.title} by email`}
                                onChange={() =>
                                  setEmailAlerts((current) => ({
                                    ...current,
                                    [row.id]: !current[row.id],
                                  }))
                                }
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex flex-col justify-between gap-4 border-t border-surface-container p-6 sm:flex-row sm:items-center sm:p-8">
                    <div>
                      <p className="font-title-lg text-title-lg font-semibold text-on-surface">
                        Session summary email
                      </p>
                      <p className="mt-1 font-body-md text-body-md text-secondary">
                        Get a short report when a session closes.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-label-md text-label-md font-semibold text-on-surface">
                        {summaryEmail ? "On" : "Off"}
                      </span>
                      <Switch
                        checked={summaryEmail}
                        label="Session summary email"
                        onChange={() => setSummaryEmail((value) => !value)}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end px-6 pb-6 sm:px-8">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() =>
                        run(
                          () =>
                            updateNotificationPrefsAction({
                              emailFakeIdentity: emailAlerts.fake,
                              emailOutOfBounds: emailAlerts.bounds,
                              emailSharedDevice: emailAlerts.device,
                              emailSessionSummary: summaryEmail,
                            }),
                          () => setUpdatedLabel("just now"),
                          "Notification preferences saved"
                        )
                      }
                      className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary-container px-6 font-label-lg text-label-lg text-on-primary hover:bg-primary"
                    >
                      <Save className="h-5 w-5" />
                      Save notification preferences
                    </button>
                  </div>
                </section>
              )}

              {panel === "privacy" && (
                <div className="flex flex-col gap-6">
                  <section className="rounded-xl bg-surface-container-lowest p-6 shadow-sm sm:p-8">
                    <h2 className="font-headline-sm text-headline-sm text-on-surface">
                      How student photos are handled
                    </h2>
                    <p className="mt-1 max-w-2xl font-body-md text-body-md text-secondary">
                      Attend Pal keeps only what a lecturer needs to review a problem.
                    </p>
                    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                      <PrivacyCard
                        title="Verified check-ins"
                        body="Selfies from a successful check-in are never stored."
                      />
                      <PrivacyCard
                        title="Failed identity checks"
                        body="Those photos are kept for 7 days so you can review them, then deleted."
                      />
                      <PrivacyCard
                        title="Class list photos"
                        body="Reference photos are used only to match the student in front of the camera."
                      />
                    </div>
                    <div className="mt-6 flex justify-end">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          run(
                            () => downloadMyDataAction(),
                            (result) => {
                              if (!result.json || !result.filename) return;
                              const blob = new Blob([result.json], { type: "application/json" });
                              const url = URL.createObjectURL(blob);
                              const link = document.createElement("a");
                              link.href = url;
                              link.download = result.filename;
                              link.click();
                              URL.revokeObjectURL(url);
                            },
                            "Your data downloaded"
                          )
                        }
                        className="inline-flex h-12 items-center gap-2 rounded-xl border border-outline bg-surface-container-lowest px-5 font-label-lg text-label-lg text-on-surface hover:bg-surface-container-high"
                      >
                        <Download className="h-5 w-5 text-primary" />
                        Download my data
                      </button>
                    </div>
                  </section>

                  <section className="rounded-xl bg-error-container/30 p-6 sm:p-8">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-on-error-container" />
                      <h2 className="font-headline-sm text-headline-sm text-on-error-container">
                        Delete account
                      </h2>
                    </div>
                    <div className="mt-4 flex flex-col justify-between gap-4 rounded-xl bg-surface-container-lowest p-4 sm:flex-row sm:items-center">
                      <p className="font-body-md text-body-md text-error">
                        This permanently deletes your classes, sessions and attendance records.
                      </p>
                      <button
                        type="button"
                        onClick={() => setDeleteOpen(true)}
                        className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-error-container px-5 font-label-lg text-label-lg text-on-error-container"
                      >
                        <Trash2 className="h-5 w-5" />
                        Delete my account
                      </button>
                    </div>
                  </section>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            className="w-full max-w-md rounded-xl bg-surface-container-lowest p-6 shadow-xl"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-error-container text-on-error-container">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 id="delete-title" className="font-headline-sm text-headline-sm text-on-surface">
              Delete your account?
            </h3>
            <p className="mt-2 font-body-md text-body-md text-secondary">
              This removes your classes, sessions and attendance records. You can&apos;t undo it.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                className="inline-flex h-11 items-center rounded-xl bg-surface-container-high px-4 font-label-lg text-label-lg text-on-surface"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setDeleteOpen(false);
                  setError(null);
                  setToast("Account deletion isn't available yet");
                }}
                className="inline-flex h-11 items-center rounded-xl bg-error-container px-4 font-label-lg text-label-lg text-on-error-container"
              >
                Permanently delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NavLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof LayoutGrid;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl px-4 py-2.5 font-label-lg text-label-md font-medium text-on-surface-variant transition-all hover:bg-surface-container-high hover:text-on-surface"
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </Link>
  );
}

function PasswordField({
  id,
  label,
  value,
  shown,
  invalid,
  onToggle,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  shown: boolean;
  invalid?: boolean;
  onToggle: () => void;
  onChange: (value: string) => void;
}) {
  return (
    <label htmlFor={id} className="flex max-w-lg flex-col gap-1.5">
      <span className="font-label-lg text-label-lg font-medium text-on-surface">{label}</span>
      <span className="relative">
        <input
          id={id}
          type={shown ? "text" : "password"}
          value={value}
          autoComplete="off"
          onChange={(event) => onChange(event.target.value)}
          className={`h-12 w-full rounded-xl border bg-surface-container-high pr-12 pl-4 font-body-md text-body-md text-on-surface focus:outline-none ${
            invalid ? "border-error" : "border-outline focus:border-primary"
          }`}
        />
        <button
          type="button"
          aria-label={shown ? `Hide ${label}` : `Show ${label}`}
          onClick={onToggle}
          className="absolute top-0 right-0 flex h-12 w-12 items-center justify-center text-secondary hover:text-on-surface"
        >
          {shown ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </span>
    </label>
  );
}

function Rule({ met, text }: { met: boolean; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-caption text-caption text-on-surface">
      <CheckCircle2 className={`h-4 w-4 ${met ? "text-tertiary" : "text-outline"}`} />
      {text}
    </span>
  );
}

function ToggleRow({
  icon: Icon,
  title,
  body,
  checked,
  onChange,
}: {
  icon: typeof User;
  title: string;
  body: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl bg-surface-container-low p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-fixed text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-label-lg text-label-lg font-semibold text-on-surface">{title}</p>
          <p className="mt-0.5 font-body-md text-body-md text-secondary">{body}</p>
        </div>
      </div>
      <Switch checked={checked} label={title} onChange={onChange} />
    </div>
  );
}

function PrivacyCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl bg-surface-container-low p-4">
      <div className="mb-2 flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-tertiary" />
        <span className="font-title-md text-title-md text-on-surface">{title}</span>
      </div>
      <p className="font-body-md text-body-md text-on-surface-variant">{body}</p>
    </div>
  );
}
