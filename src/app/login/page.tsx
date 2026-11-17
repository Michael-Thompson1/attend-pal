"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  LogIn,
  UserPlus,
  Landmark,
  GraduationCap,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { AuthSidePanel } from "@/components/layout/auth-side-panel";
import { signInAction } from "@/app/auth/actions";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    startTransition(async () => {
      const result = await signInAction(formData);
      if (result?.error) {
        setErrorMessage(result.error);
      }
    });
  };

  return (
    <main className="flex min-h-screen w-full flex-col lg:flex-row bg-surface">
      {/* LEFT: Institutional Authority Panel */}
      <AuthSidePanel />

      {/* RIGHT: Login Card */}
      <section className="flex flex-1 items-center justify-center p-6 sm:p-10 lg:p-16">
        <div className="flex w-full max-w-[520px] flex-col justify-between rounded-2xl bg-surface-container-lowest p-8 shadow-xl sm:p-10">
          <div>
            {/* Segmented Auth Navigation Tabs */}
            <div className="mb-8 flex w-full items-center rounded-xl bg-surface-container-low p-1.5">
              <button
                type="button"
                className="flex flex-1 items-center justify-center space-x-2 rounded-lg bg-primary-container px-4 py-2.5 font-label-lg text-label-lg font-semibold text-on-primary shadow-sm transition-all"
              >
                <LogIn className="h-4 w-4" />
                <span>Log in</span>
              </button>
              <Link
                href="/register"
                className="flex flex-1 items-center justify-center space-x-2 rounded-lg px-4 py-2.5 font-label-lg text-label-lg font-medium text-on-surface-variant transition-all hover:text-on-surface"
              >
                <UserPlus className="h-4 w-4" />
                <span>Create account</span>
              </Link>
            </div>

            {/* Section Headings */}
            <div className="mb-7">
              <div className="mb-2 inline-flex items-center space-x-2 text-primary">
                <GraduationCap className="h-5 w-5" />
                <span className="font-label-md text-label-md font-semibold uppercase tracking-wide">
                  Lecturer Portal Access
                </span>
              </div>
              <h2 className="font-headline-lg text-headline-lg font-bold tracking-tight text-on-surface">
                Welcome Back
              </h2>
              <p className="mt-1 font-body-md text-body-md text-secondary">
                Sign in with your university credentials to manage class attendance,
                sessions, and audits.
              </p>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-error-container/40 p-3.5 text-error">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <p className="font-label-md text-label-md font-medium text-on-error-container">
                  {errorMessage}
                </p>
              </div>
            )}

            {/* Login Form */}
            <form className="space-y-5" onSubmit={handleLogin}>
              {/* School Email Input Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="school-email"
                  className="block font-label-md text-label-md font-medium text-on-surface"
                >
                  School Email Address
                </label>
                <div className="relative rounded-xl bg-surface-container-lowest shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-secondary">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    id="school-email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@stu.ucc.edu.gh"
                    className="h-12 w-full rounded-xl bg-surface-container-lowest pl-11 pr-4 font-body-md text-body-md text-on-surface ring-2 ring-outline-variant/40 transition-all placeholder:text-outline focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
                <p className="flex items-center space-x-1 pl-1 font-caption text-caption text-secondary">
                  <span>Use your registered institutional faculty email</span>
                </p>
              </div>

              {/* Password Input Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="lecturer-password"
                    className="block font-label-md text-label-md font-medium text-on-surface"
                  >
                    Password
                  </label>
                  <span className="font-caption text-caption text-secondary">
                    Secured endpoint
                  </span>
                </div>
                <div className="relative rounded-xl bg-surface-container-lowest shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-secondary">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    id="lecturer-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="h-12 w-full rounded-xl bg-surface-container-lowest pl-11 pr-12 font-body-md text-body-md text-on-surface ring-2 ring-outline-variant/40 transition-all placeholder:text-outline focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-secondary hover:text-on-surface focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password Row */}
              <div className="flex items-center justify-between pt-1">
                <label className="group flex min-h-[44px] cursor-pointer select-none items-center space-x-2.5">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-5 w-5 rounded-md text-primary accent-primary cursor-pointer focus:ring-2 focus:ring-primary"
                  />
                  <span className="font-label-md text-label-md text-secondary transition-colors group-hover:text-on-surface">
                    Remember me
                  </span>
                </label>
                <a
                  href="#forgot-password"
                  className="flex min-h-[44px] items-center font-label-md text-label-md font-semibold text-primary transition-colors hover:text-primary-container"
                >
                  Forgot password?
                </a>
              </div>

              {/* Primary Action Button */}
              <button
                type="submit"
                disabled={isPending}
                className="group flex h-12 w-full cursor-pointer items-center justify-center space-x-2 rounded-xl bg-primary-container font-label-lg text-label-lg font-semibold text-on-primary shadow-md transition-all hover:bg-primary hover:shadow-lg active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Log in to portal</span>
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            {/* Alternative Authentication Divider */}
            <div className="relative my-7">
              <div className="absolute inset-0 flex items-center">
                <div className="h-[1px] w-full bg-surface-container-high" />
              </div>
              <div className="relative flex justify-center text-caption uppercase tracking-wider">
                <span className="bg-surface-container-lowest px-3 font-caption font-medium text-secondary">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Institutional SSO Button */}
            <button
              type="button"
              className="flex h-12 w-full cursor-pointer items-center justify-center space-x-3 rounded-xl bg-surface-container-low font-label-lg text-label-lg font-semibold text-on-surface shadow-sm transition-all hover:bg-surface-container"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-container text-on-primary">
                <Landmark className="h-4 w-4" />
              </div>
              <span>Institutional SSO / EduID</span>
            </button>

            {/* Switch to Registration Link */}
            <div className="mt-7 text-center">
              <p className="font-body-md text-body-md text-secondary">
                Don&apos;t have an account yet?{" "}
                <Link
                  href="/register"
                  className="inline-flex items-center space-x-0.5 font-label-md text-label-md font-semibold text-primary hover:text-primary-container"
                >
                  <span>Create account</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </p>
            </div>
          </div>

          {/* Card Security Footer */}
          <div className="-mx-8 -mb-8 mt-8 flex flex-col items-center justify-between gap-2 rounded-b-2xl bg-surface-container-low/60 px-8 py-4 text-secondary sm:-mx-10 sm:-mb-10 sm:flex-row sm:px-10">
            <div className="flex items-center space-x-1.5 font-caption text-caption">
              <ShieldCheck className="h-4 w-4 text-tertiary" />
              <span className="font-medium text-on-surface">Official Faculty Endpoint</span>
            </div>
            <Link
              href="/privacy"
              className="font-caption text-caption text-primary underline underline-offset-2 hover:text-primary-container"
            >
              Privacy policy
            </Link>
            <a
              href="#helpdesk"
              className="flex items-center space-x-1 font-caption text-caption text-primary underline underline-offset-2 hover:text-primary-container"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Need campus helpdesk support?</span>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
