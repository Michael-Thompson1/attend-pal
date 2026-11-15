"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Edit2,
  ShieldCheck,
  Check,
  RotateCcw,
  LogIn,
  UserPlus,
  Loader2,
} from "lucide-react";
import { AuthSidePanel } from "@/components/layout/auth-side-panel";
import { signUpAction, resendVerificationEmailAction } from "@/app/auth/actions";

type RegistrationViewMode = "form" | "error_state" | "check_inbox";

export default function RegisterPage() {
  const [viewMode, setViewMode] = useState<RegistrationViewMode>("form");
  const [isPending, startTransition] = useTransition();

  // Form states
  const [fullName, setFullName] = useState("");
  const [schoolEmail, setSchoolEmail] = useState("");
  const [institution, setInstitution] = useState("ucc");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Error feedback state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check inbox resend countdown state
  const [resendCountdown, setResendCountdown] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Password strength calculation
  const getPasswordStrength = (val: string) => {
    const len = val.length;
    if (len === 0) return { score: 0, label: "Empty", color: "bg-surface-container" };
    if (len < 6) return { score: 1, label: "Weak", color: "bg-error" };
    if (len < 10) return { score: 2, label: "Moderate", color: "bg-amber-500" };
    return { score: 4, label: "Strong", color: "bg-tertiary" };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("fullName", fullName);
    formData.append("email", schoolEmail);
    formData.append("institution", institution);
    formData.append("password", password);
    formData.append("confirmPassword", confirmPassword);

    startTransition(async () => {
      const result = await signUpAction(formData);

      if (result.error) {
        setErrorMessage(result.error);
        if (result.field === "email") {
          setViewMode("error_state");
        }
      } else if (result.success) {
        setViewMode("check_inbox");
      }
    });
  };

  const handleResendEmail = () => {
    if (resendCountdown > 0 || !schoolEmail) return;
    startTransition(async () => {
      const result = await resendVerificationEmailAction(schoolEmail);
      if (result.error) {
        setToastMessage(`Error: ${result.error}`);
      } else {
        setResendCountdown(45);
        setToastMessage(`Verification link re-sent to ${schoolEmail}.`);
      }
      setTimeout(() => setToastMessage(null), 4000);
    });
  };

  const handleChangeEmail = () => {
    const updated = prompt("Enter your institutional faculty email:", schoolEmail);
    if (updated && updated.includes("@")) {
      setSchoolEmail(updated);
      setViewMode("form");
      setErrorMessage(null);
    }
  };

  return (
    <main className="flex min-h-screen w-full flex-col lg:flex-row bg-surface">
      {/* LEFT: Institutional Authority Panel */}
      <AuthSidePanel />

      {/* RIGHT: Registration Card Area */}
      <section className="flex flex-1 items-center justify-center p-6 sm:p-10 lg:p-16">
        <div className="flex w-full max-w-[620px] flex-col justify-between rounded-2xl bg-surface-container-lowest p-6 shadow-xl sm:p-10">
          <div>
            {/* Segmented Auth Navigation Tabs */}
            <div className="mb-8 flex w-full items-center rounded-xl bg-surface-container-low p-1.5">
              <Link
                href="/login"
                className="flex flex-1 items-center justify-center space-x-2 rounded-lg px-4 py-2.5 font-label-lg text-label-lg font-medium text-on-surface-variant transition-all hover:text-on-surface"
              >
                <LogIn className="h-4 w-4" />
                <span>Log in</span>
              </Link>
              <button
                type="button"
                className="flex flex-1 items-center justify-center space-x-2 rounded-lg bg-primary-container px-4 py-2.5 font-label-lg text-label-lg font-semibold text-on-primary shadow-sm transition-all"
              >
                <UserPlus className="h-4 w-4" />
                <span>Create account</span>
              </button>
            </div>

            {/* VIEW MODE 1 & 2: REGISTRATION FORM */}
            {(viewMode === "form" || viewMode === "error_state") && (
              <>
                <div className="mb-6">
                  <h2 className="font-headline-md text-headline-md font-bold tracking-tight text-on-surface">
                    Lecturer Registration
                  </h2>
                  <p className="mt-1 font-body-md text-body-md text-secondary">
                    Set up your verified university teaching credentials.
                  </p>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                  {/* Field 1: Full Name */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="fullName"
                        className="font-label-md text-label-md font-semibold text-on-surface"
                      >
                        Full Name & Title
                      </label>
                      <span className="font-caption text-caption text-secondary">
                        Official institutional name
                      </span>
                    </div>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-secondary">
                        <User className="h-5 w-5" />
                      </div>
                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Dr. Kwame Mensah"
                        className="h-12 w-full rounded-xl bg-surface-container-lowest pl-11 pr-10 font-body-md text-body-md text-on-surface ring-1 ring-outline-variant focus:ring-2 focus:ring-primary-container focus:outline-none"
                      />
                      {fullName.trim().length > 2 && (
                        <CheckCircle2 className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-tertiary" />
                      )}
                    </div>
                  </div>

                  {/* Field 2: School Email Address */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="schoolEmail"
                        className={`font-label-md text-label-md font-semibold ${
                          viewMode === "error_state" ? "text-error" : "text-on-surface"
                        }`}
                      >
                        School Email Address *
                      </label>
                      {viewMode === "error_state" && (
                        <span className="font-caption text-caption font-medium text-error">
                          Domain verification required
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <div
                        className={`pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 ${
                          viewMode === "error_state" ? "text-error" : "text-secondary"
                        }`}
                      >
                        <Mail className="h-5 w-5" />
                      </div>
                      <input
                        id="schoolEmail"
                        name="email"
                        type="email"
                        required
                        value={schoolEmail}
                        onChange={(e) => {
                          setSchoolEmail(e.target.value);
                          if (viewMode === "error_state") {
                            setViewMode("form");
                            setErrorMessage(null);
                          }
                        }}
                        placeholder="name@stu.ucc.edu.gh"
                        className={`h-12 w-full rounded-xl pl-11 pr-10 font-body-md text-body-md text-on-surface transition-all focus:outline-none ${
                          viewMode === "error_state"
                            ? "bg-error-container/20 ring-2 ring-error"
                            : "bg-surface-container-lowest ring-1 ring-outline-variant focus:ring-2 focus:ring-primary-container"
                        }`}
                      />
                      {viewMode === "error_state" && (
                        <AlertCircle className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-error" />
                      )}
                    </div>

                    {/* Error Banner when in Error State */}
                    {viewMode === "error_state" && (
                      <div className="flex items-center gap-2 rounded-lg bg-error-container/40 p-2.5 text-error">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <p className="font-label-md text-label-md font-medium text-on-error-container">
                          {errorMessage || "Please use your school email address."}
                        </p>
                      </div>
                    )}

                    <p className="pl-1 font-caption text-caption text-secondary">
                      Use your school email (for example{" "}
                      <span className="font-mono text-on-surface">name@stu.ucc.edu.gh</span>
                      ). We&apos;ll send a confirmation link.
                    </p>
                  </div>

                  {/* Field 3: Institution or University */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="institution"
                      className="font-label-md text-label-md font-semibold text-on-surface"
                    >
                      Institution or University
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-secondary">
                        <Building className="h-5 w-5" />
                      </div>
                      <select
                        id="institution"
                        name="institution"
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        className="h-12 w-full cursor-pointer appearance-none rounded-xl bg-surface-container-lowest pl-11 pr-10 font-body-md text-body-md text-on-surface ring-1 ring-outline-variant focus:ring-2 focus:ring-primary-container focus:outline-none"
                      >
                        <option value="ucc">University of Cape Coast (UCC)</option>
                        <option value="ug">University of Ghana (UG)</option>
                        <option value="knust">
                          Kwame Nkrumah Univ. of Science and Technology (KNUST)
                        </option>
                        <option value="ashesi">Ashesi University</option>
                        <option value="gimpa">GIMPA</option>
                        <option value="other">Other Accredited Institution</option>
                      </select>
                    </div>
                    <p className="pl-1 font-caption text-caption text-secondary">
                      Students will see this on the check-in page.
                    </p>
                  </div>

                  {/* Field 4 & 5: Password and Confirm Password Row */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* Password Field with Strength Indicator */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="password"
                          className="font-label-md text-label-md font-semibold text-on-surface"
                        >
                          Password
                        </label>
                        <span className="font-caption text-caption font-semibold text-tertiary">
                          {strength.label}
                        </span>
                      </div>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-secondary">
                          <Lock className="h-5 w-5" />
                        </div>
                        <input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Create password"
                          className="h-12 w-full rounded-xl bg-surface-container-lowest pl-11 pr-10 font-body-md text-body-md text-on-surface ring-1 ring-outline-variant focus:ring-2 focus:ring-primary-container focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-secondary hover:text-on-surface focus:outline-none"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>

                      {/* 4 Strength Bars */}
                      <div className="grid grid-cols-4 gap-1.5 pt-1">
                        <div
                          className={`h-1.5 rounded-full ${
                            strength.score >= 1 ? strength.color : "bg-surface-container-highest"
                          }`}
                        />
                        <div
                          className={`h-1.5 rounded-full ${
                            strength.score >= 2 ? strength.color : "bg-surface-container-highest"
                          }`}
                        />
                        <div
                          className={`h-1.5 rounded-full ${
                            strength.score >= 3 ? strength.color : "bg-surface-container-highest"
                          }`}
                        />
                        <div
                          className={`h-1.5 rounded-full ${
                            strength.score >= 4 ? strength.color : "bg-surface-container-highest"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Confirm Password Field */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="confirmPassword"
                        className="font-label-md text-label-md font-semibold text-on-surface"
                      >
                        Confirm Password
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-secondary">
                          <RotateCcw className="h-5 w-5" />
                        </div>
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm password"
                          className="h-12 w-full rounded-xl bg-surface-container-lowest pl-11 pr-10 font-body-md text-body-md text-on-surface ring-1 ring-outline-variant focus:ring-2 focus:ring-primary-container focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-secondary hover:text-on-surface focus:outline-none"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <p className="pt-1 font-caption text-caption text-secondary">
                        Passwords must match exactly.
                      </p>
                    </div>
                  </div>

                  {/* General Error Banner */}
                  {errorMessage && viewMode !== "error_state" && (
                    <div className="flex items-center gap-2 rounded-lg bg-error-container/40 p-2.5 text-error">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <p className="font-label-md text-label-md text-on-error-container">
                        {errorMessage}
                      </p>
                    </div>
                  )}

                  {/* Field 6: Terms and Policy Agreement */}
                  <div className="pt-1">
                    <label className="flex cursor-pointer items-start gap-3 select-none">
                      <input
                        type="checkbox"
                        required
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="mt-1 h-5 w-5 rounded-md text-primary accent-primary cursor-pointer focus:ring-2 focus:ring-primary"
                      />
                      <span className="font-label-md text-label-md text-on-surface-variant leading-snug">
                        I agree to the{" "}
                        <a href="#terms" className="font-semibold text-primary hover:underline">
                          Terms of Service
                        </a>{" "}
                        and{" "}
                        <a href="#privacy" className="font-semibold text-primary hover:underline">
                          Privacy Policy
                        </a>
                        .
                      </span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isPending}
                      className="group flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary-container font-label-lg text-label-lg font-semibold text-on-primary shadow-md transition-all hover:bg-primary hover:shadow-lg active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Setting up credentials...</span>
                        </>
                      ) : (
                        <>
                          <span>Create account</span>
                          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* VIEW MODE 3: CHECK YOUR INBOX CONFIRMATION */}
            {viewMode === "check_inbox" && (
              <div className="flex flex-col items-center py-4 text-center">
                {/* Status Indicator Icon with Checkmark Badge */}
                <div className="relative mb-6">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface-container-low text-primary shadow-sm">
                    <Mail className="h-10 w-10 text-primary" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-tertiary text-on-tertiary shadow-md">
                    <Check className="h-4 w-4 stroke-[3]" />
                  </div>
                </div>

                {/* Headline & Description */}
                <h2 className="mb-3 font-headline-md text-headline-md font-bold tracking-tight text-on-surface">
                  Check your inbox
                </h2>
                <p className="mb-6 max-w-sm font-body-md text-body-md leading-relaxed text-secondary">
                  We sent a confirmation link to your school email. Click it to activate your
                  account.
                </p>

                {/* Recipient Email Chip */}
                <div className="mb-6 flex w-full items-center justify-between rounded-xl bg-surface-container-low p-3.5 transition-colors hover:bg-surface-container">
                  <div className="flex items-center gap-3 overflow-hidden text-left pl-1">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="flex min-w-0 flex-col">
                      <span className="font-caption text-caption font-semibold uppercase text-secondary">
                        Faculty Recipient
                      </span>
                      <span className="truncate font-label-lg text-label-lg font-semibold text-on-surface">
                        {schoolEmail}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleChangeEmail}
                    className="flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 font-caption text-caption font-medium text-primary hover:bg-surface-container-highest transition-colors"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>Change</span>
                  </button>
                </div>

                {/* Resend Action Button */}
                <div className="mb-6 w-full space-y-3">
                  <button
                    type="button"
                    disabled={resendCountdown > 0 || isPending}
                    onClick={handleResendEmail}
                    className={`flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl font-label-lg text-label-lg shadow-sm transition-all ${
                      resendCountdown > 0 || isPending
                        ? "cursor-not-allowed bg-surface-container-low text-outline"
                        : "cursor-pointer bg-surface-container hover:bg-surface-container-high text-on-surface active:scale-[0.99]"
                    }`}
                  >
                    <RefreshCw className={`h-4 w-4 ${resendCountdown > 0 ? "animate-spin" : ""}`} />
                    <span>
                      {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : "Resend email"}
                    </span>
                  </button>

                  {toastMessage && (
                    <div className="rounded-lg bg-surface-container p-2.5 font-caption text-caption text-tertiary">
                      {toastMessage}
                    </div>
                  )}
                </div>

                {/* Footer instructions */}
                <div className="flex flex-col gap-3 font-caption text-caption text-secondary">
                  <p>
                    Didn&apos;t receive an email? Check your spam folder or{" "}
                    <a href="#support" className="font-semibold text-primary hover:underline">
                      contact support
                    </a>
                  </p>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-1 font-label-md text-label-md text-primary hover:text-primary-container"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to Log in</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Card Footer: Official Faculty Endpoint */}
          <div className="-mx-6 -mb-6 mt-8 flex flex-col items-center justify-between gap-2 rounded-b-2xl bg-surface-container-low/60 px-6 py-4 text-secondary sm:-mx-10 sm:-mb-10 sm:flex-row sm:px-10">
            <div className="flex items-center space-x-1.5 font-caption text-caption">
              <ShieldCheck className="h-4 w-4 text-tertiary" />
              <span className="font-medium text-on-surface">Official Faculty Endpoint</span>
            </div>
            <a
              href="#helpdesk"
              className="font-caption text-caption text-primary underline underline-offset-2 hover:text-primary-container"
            >
              Need campus helpdesk support?
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
