"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import {
  GraduationCap,
  LayoutGrid,
  BookOpen,
  Clock,
  Bell,
  BarChart3,
  Settings,
  MapPin,
  User,
  ShieldCheck,
  CheckCircle,
  Copy,
  ChevronRight,
  ArrowRight,
  Wifi,
  Lock,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  Printer,
  Maximize2,
  Minimize2,
  AlertTriangle,
  RefreshCw,
  Power,
  Info,
  LogOut,
  Navigation,
  Loader2,
} from "lucide-react";
import { signOutAction } from "@/app/auth/actions";
import HeaderSearch from "@/components/lecturer/header-search";
import {
  closeSessionAction,
  regenerateTokenAction,
} from "@/app/(lecturer)/sessions/actions";

interface SessionQRClientViewProps {
  session: {
    id: string;
    class_id: string;
    class_code: string;
    class_title: string;
    title: string;
    token: string;
    starts_at: string;
    ends_at: string;
    venue_name: string | null;
    center_lat: number;
    center_lng: number;
    radius_m: number;
    require_liveness: boolean;
    allow_second_checkin: boolean;
    notify_suspicious: boolean;
    status: "open" | "closed";
    student_count: number;
    checked_in_count: number;
  };
  baseUrl?: string;
  qrDataUrl: string;
}

export default function SessionQRClientView({
  session: initialSession,
  baseUrl = "https://attendpal.ucc.edu.gh",
  qrDataUrl,
}: SessionQRClientViewProps) {
  const router = useRouter();
  const [session, setSession] = useState(initialSession);
  const [liveQr, setLiveQr] = useState(qrDataUrl);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Fallback demo token code formatted as AP-XXXX-INF
  const displayCode = session.token
    ? `AP-${session.token.slice(0, 4).toUpperCase()}-${session.class_code.slice(0, 3)}`
    : `AP-7842-${session.class_code.slice(0, 3)}`;

  // Web link for students (derived deterministically from baseUrl to guarantee 0 SSR/client mismatch)
  const studentWebLink = `${baseUrl}/attend/${session.token}`;

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(studentWebLink, { width: 640, margin: 1, errorCorrectionLevel: "M" })
      .then((url) => {
        if (!cancelled) setLiveQr(url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [studentWebLink]);

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(studentWebLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      // fallback
    }
  }

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(displayCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      // fallback
    }
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }

  function handleRegenerateQR() {
    startTransition(async () => {
      const res = await regenerateTokenAction(session.id);
      if (res && res.success && res.token) {
        setSession((prev) => ({ ...prev, token: res.token! }));
        router.refresh();
        setActionMessage("Security token regenerated successfully!");
        setTimeout(() => setActionMessage(null), 4000);
      }
    });
  }

  function handleCloseSession() {
    if (!confirm("Are you sure you want to end this attendance session?")) return;
    startTransition(async () => {
      const res = await closeSessionAction(session.id);
      if (res && res.success) {
        setSession((prev) => ({ ...prev, status: "closed" }));
        setActionMessage("Session has been closed.");
        setTimeout(() => setActionMessage(null), 4000);
      }
    });
  }

  // Format start and end times
  const startTimeStr = new Date(session.starts_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endTimeStr = new Date(session.ends_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex min-h-screen bg-surface">
      {/* ── Sidebar Navigation ── */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-r border-surface-container-high z-50 flex flex-col justify-between hidden md:flex">
        <div className="flex flex-col">
          {/* Logo & Portal Label */}
          <div className="h-16 px-6 flex items-center gap-3 border-b border-surface-container-high">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-sm">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-title-lg text-title-lg font-bold text-primary tracking-tight">
                Attend Pal
              </span>
              <span className="font-caption text-caption text-secondary">
                Lecturer Portal
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="px-4 pt-6">
            <nav className="flex flex-col gap-1">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all font-label-lg text-label-md font-medium"
              >
                <LayoutGrid className="h-5 w-5" />
                <span>Dashboard</span>
              </Link>

              <Link
                href="/classes"
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all font-label-lg text-label-md font-medium"
              >
                <BookOpen className="h-5 w-5" />
                <span>Classes</span>
              </Link>

              <Link
                href="/sessions"
                aria-current="page"
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-primary-container text-on-primary font-semibold shadow-sm transition-all text-label-md"
              >
                <Clock className="h-5 w-5" />
                <span>Sessions</span>
              </Link>

              <Link
                href="/alerts"
                className="flex items-center justify-between px-4 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all font-label-lg text-label-md font-medium"
              >
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5" />
                  <span>Alerts</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-caption text-caption font-bold">
                  3
                </span>
              </Link>

              <Link
                href="/reports"
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all font-label-lg text-label-md font-medium"
              >
                <BarChart3 className="h-5 w-5" />
                <span>Reports</span>
              </Link>

              <Link
                href="/settings"
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all font-label-lg text-label-md font-medium"
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </Link>
            </nav>
          </div>
        </div>

        {/* Bottom Sidebar: Faculty & User Profile */}
        <div className="p-4 space-y-4 border-t border-surface-container-high">
          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high">
            <div className="flex items-start gap-2.5">
              <MapPin className="h-4 w-4 text-secondary mt-0.5 flex-shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="font-caption text-[11px] text-secondary font-semibold uppercase tracking-wider">
                  Faculty &amp; Campus
                </span>
                <span className="font-label-md text-label-md text-on-surface font-semibold truncate">
                  Faculty of Science
                </span>
                <span className="font-caption text-caption text-secondary truncate">
                  UCC Main Campus • North Wing
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-caption flex-shrink-0">
                M
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-label-md text-label-md font-semibold text-on-surface truncate">
                  Michael Dev Test
                </span>
                <span className="font-caption text-[11px] text-secondary truncate">
                  michael.thompson@stu.ucc.edu.gh
                </span>
              </div>
            </div>

            <form action={signOutAction}>
              <button
                type="submit"
                title="Sign out"
                className="p-1.5 rounded-lg text-secondary hover:text-error hover:bg-error-container/20 transition-all cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* ── Main Area with Header ── */}
      <div className="flex-1 md:pl-72 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="fixed top-0 left-0 md:left-72 right-0 h-16 bg-surface-container-lowest/90 backdrop-blur-xl border-b border-surface-container-high z-40 flex items-center justify-between px-6 lg:px-10">
          <HeaderSearch />

          <div className="flex items-center gap-4">
            <div className="relative">
              <Link
                href="/alerts"
                className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
              </Link>
              <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-error ring-2 ring-surface-container-lowest"></span>
            </div>

            <div className="h-8 w-[1px] bg-surface-container-high hidden sm:block"></div>

            <div className="hidden sm:flex items-center gap-2.5 p-1.5 pl-2 pr-3.5 rounded-full bg-surface-container-low hover:bg-surface-container transition-colors">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-sm flex-shrink-0">
                <User className="h-4 w-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-label-md text-label-md text-on-surface font-semibold leading-tight">
                  Michael Dev Test
                </span>
                <span className="font-caption text-caption text-secondary leading-tight">
                  Senior Lecturer
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* ── Main Content Area ── */}
        <main className="w-full pt-20 px-6 lg:px-10 pb-20 flex flex-col gap-6">
          {/* Breadcrumbs & Status Ribbon */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-2 font-caption text-caption text-secondary"
            >
              <Link href="/dashboard" className="hover:text-primary transition-colors">
                Academic Portal
              </Link>
              <ChevronRight className="h-3.5 w-3.5 text-outline" />
              <Link href="/sessions" className="hover:text-primary transition-colors">
                Sessions
              </Link>
              <ChevronRight className="h-3.5 w-3.5 text-outline" />
              <span className="text-on-surface font-semibold">{session.class_code}</span>
              <ChevronRight className="h-3.5 w-3.5 text-outline" />
              <span className="text-primary font-semibold">Live QR Pass</span>
            </nav>

            <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1 rounded-full text-secondary font-caption text-caption border border-surface-container-high">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Registry Sync: Active • Node 04 (UCC)</span>
            </div>
          </div>

          {/* Action Message Feedback Banner */}
          {actionMessage && (
            <div className="flex items-center gap-2.5 p-4 rounded-xl bg-primary-container text-on-primary shadow-sm">
              <CheckCircle className="h-5 w-5 shrink-0" />
              <span className="font-label-md text-label-md font-medium">
                {actionMessage}
              </span>
            </div>
          )}

          {/* Header Section with Live Status Banner & Primary Call to Action */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex flex-col gap-1 max-w-3xl">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-headline-md text-headline-md font-bold text-on-surface tracking-tight">
                  Attendance Session Active: {session.class_code} · {session.title}
                </h1>
                {session.status === "open" ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-label-md text-label-md font-semibold border border-emerald-200 shadow-xs">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                    </span>
                    <span>CHECK-IN OPEN</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-secondary font-label-md text-label-md font-semibold border border-surface-container-high">
                    <span className="w-2 h-2 rounded-full bg-secondary"></span>
                    <span>SESSION CLOSED</span>
                  </span>
                )}
              </div>
              <p className="font-body-md text-secondary mt-1">
                Project or display this QR code on lecture slides or share the secure shortlink with students in {session.venue_name || "Lecture Hall B"}.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href={`/sessions/${session.id}/monitor`}
                className="flex items-center gap-4 px-6 py-3 rounded-xl bg-primary text-on-primary hover:bg-primary-container transition-all shadow-md group cursor-pointer"
              >
                <div className="flex flex-col text-left">
                  <span className="font-label-lg text-label-md font-semibold flex items-center gap-1.5">
                    <span>Open Live Attendance Monitor</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                  <span className="font-caption text-caption opacity-80">
                    Real-time room telemetry
                  </span>
                </div>
                <div className="px-3 py-1 rounded-full bg-white/20 text-on-primary font-label-md text-label-md font-bold tracking-wide">
                  {session.checked_in_count} / {session.student_count} Checked In
                </div>
              </Link>
            </div>
          </div>

          {/* Central Area: Dual Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ── LEFT / CENTER CARD: Large QR Showcase Container (7 Cols) ── */}
            <div className="lg:col-span-7 bg-surface-container-lowest rounded-2xl p-8 shadow-sm border border-surface-container-high flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-primary-fixed/30 blur-2xl pointer-events-none"></div>

              {/* Status pill inside card */}
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container-low text-primary font-label-md text-label-md font-semibold mb-6 border border-surface-container-high shadow-xs">
                <Wifi className="h-4 w-4 text-emerald-600 animate-pulse" />
                <span>Live Check-in Open · Rotating Security Token v4</span>
              </div>

              {/* QR Code Frame with Corner Targeting Guides */}
              <div className="relative p-7 rounded-2xl bg-surface-container-lowest shadow-lg border border-surface-container-high mb-6 flex items-center justify-center">
                {/* Corner Targeting Guides */}
                <span className="absolute top-2.5 left-2.5 w-5 h-5 border-t-2 border-l-2 border-primary rounded-tl-sm pointer-events-none"></span>
                <span className="absolute top-2.5 right-2.5 w-5 h-5 border-t-2 border-r-2 border-primary rounded-tr-sm pointer-events-none"></span>
                <span className="absolute bottom-2.5 left-2.5 w-5 h-5 border-b-2 border-l-2 border-primary rounded-bl-sm pointer-events-none"></span>
                <span className="absolute bottom-2.5 right-2.5 w-5 h-5 border-b-2 border-r-2 border-primary rounded-br-sm pointer-events-none"></span>

                {/* High-Contrast Vector SVG QR Code */}
                <div className="relative w-[300px] h-[300px] sm:w-[340px] sm:h-[340px] bg-white flex items-center justify-center p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={liveQr}
                    alt={`Attendance QR code for ${session.class_code}`}
                    className="h-full w-full"
                  />
                </div>
              </div>

              {/* Course & Room Meta Underneath QR */}
              <div className="w-full max-w-lg flex flex-col gap-2">
                <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  {session.class_code} · {session.class_title}
                </h2>
                <p className="font-title-md text-title-md text-secondary">
                  {session.title}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-2 pt-2">
                  <div className="flex items-center gap-1.5 text-secondary font-label-md text-label-md">
                    <Clock className="h-4 w-4 text-primary" />
                    <span suppressHydrationWarning>
                      Window: {startTimeStr} – {endTimeStr}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-secondary font-label-md text-label-md">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>
                      {session.venue_name || "Lecture Hall B"} (Geo-fenced ±{session.radius_m}m)
                    </span>
                  </div>
                </div>

                {/* Manual Passcode/Token Strip */}
                <div className="mt-4 p-3 rounded-xl bg-surface-container-low border border-surface-container-high flex items-center justify-between px-4 max-w-sm mx-auto w-full">
                  <div className="flex flex-col text-left">
                    <span className="font-caption text-caption text-secondary uppercase font-semibold">
                      Manual Backup Code
                    </span>
                    <span className="font-title-md text-title-md text-on-surface font-mono tracking-wider font-bold">
                      {displayCode}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    title="Copy Backup Code"
                    className="p-2 rounded-lg hover:bg-surface-container text-primary transition-colors cursor-pointer"
                  >
                    {copiedCode ? (
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN: Quick Actions & Distribution (5 Cols) ── */}
            <div className="lg:col-span-5 flex flex-col gap-5">
              {/* Copy Link Field & Button */}
              <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container-high flex flex-col gap-3">
                <label className="font-title-md text-title-md font-semibold text-on-surface">
                  Student Direct Web Link
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      suppressHydrationWarning
                      type="text"
                      readOnly
                      value={studentWebLink}
                      className="w-full h-12 px-3.5 pr-10 rounded-xl bg-surface-container-low border border-surface-container-high text-on-surface font-mono text-label-md font-medium focus:outline-none select-all"
                    />
                    <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline h-4 w-4" />
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="h-12 px-5 rounded-xl bg-primary text-on-primary font-label-lg text-label-md hover:bg-primary-container transition-all flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0 cursor-pointer font-semibold"
                  >
                    {copiedLink ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>

                {copiedLink && (
                  <div className="flex items-center gap-1.5 text-emerald-600 font-caption text-caption font-semibold mt-0.5">
                    <CheckCircle className="h-4 w-4" />
                    <span>Copied link to clipboard</span>
                  </div>
                )}
              </div>

              {/* Action Buttons Stack */}
              <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container-high flex flex-col gap-3">
                <h3 className="font-title-md text-title-md font-semibold text-on-surface mb-1">
                  Materials &amp; Dispatch
                </h3>

                {/* Download PDF */}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-low border border-surface-container-high hover:bg-surface-container transition-all min-h-[48px] group cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-surface-container-lowest text-primary flex items-center justify-center shadow-xs border border-surface-container-high">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="font-label-lg text-label-md font-semibold text-on-surface">
                        Download PDF Poster
                      </span>
                      <span className="font-caption text-caption text-secondary">
                        Print-ready A4 poster with room rules
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-outline group-hover:text-primary transition-colors" />
                </button>

                {/* Download High-Res PNG */}
                <button
                  type="button"
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = liveQr;
                    link.download = `${session.class_code}-attendance-qr.png`;
                    link.click();
                  }}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-low border border-surface-container-high hover:bg-surface-container transition-all min-h-[48px] group cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-surface-container-lowest text-primary flex items-center justify-center shadow-xs border border-surface-container-high">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="font-label-lg text-label-md font-semibold text-on-surface">
                        Download High-Res PNG
                      </span>
                      <span className="font-caption text-caption text-secondary">
                        For lecture slides (300 DPI vector)
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-outline group-hover:text-primary transition-colors" />
                </button>

                {/* Share on WhatsApp */}
                <a
                  suppressHydrationWarning
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                    `*${session.class_code} Attendance Check-in Active*\nJoin session: ${studentWebLink}\nBackup Code: ${displayCode}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-low border border-surface-container-high hover:bg-surface-container transition-all min-h-[48px] group cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-surface-container-lowest text-emerald-600 flex items-center justify-center shadow-xs border border-surface-container-high">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="font-label-lg text-label-md font-semibold text-on-surface">
                        Share on WhatsApp Class Group
                      </span>
                      <span className="font-caption text-caption text-secondary">
                        Broadcast link with automated auth tag
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-outline group-hover:text-emerald-600 transition-colors" />
                </a>

                {/* Quick Print Kiosk Sign */}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-low border border-surface-container-high hover:bg-surface-container transition-all min-h-[48px] group w-full text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-surface-container-lowest text-primary flex items-center justify-center shadow-xs border border-surface-container-high">
                      <Printer className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="font-label-lg text-label-md font-semibold text-on-surface">
                        Quick Print Kiosk Sign
                      </span>
                      <span className="font-caption text-caption text-secondary">
                        Dispatch directly to Hall B printer
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-outline group-hover:text-primary transition-colors" />
                </button>
              </div>

              {/* Project Fullscreen Display Mode CTA */}
              <button
                type="button"
                onClick={toggleFullscreen}
                className="w-full min-h-[52px] rounded-xl bg-secondary text-on-primary hover:bg-secondary/90 transition-all font-label-lg text-label-md font-semibold flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] cursor-pointer"
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="h-5 w-5" />
                    <span>Exit Fullscreen</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-5 w-5" />
                    <span>Project Fullscreen Display</span>
                  </>
                )}
              </button>

              {/* Lecture Hall Context Preview */}
              <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-container-high flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shrink-0">
                  <Navigation className="h-6 w-6" />
                </div>
                <div className="flex flex-col">
                  <span className="font-caption text-caption text-secondary uppercase font-semibold">
                    Active Terminal Location
                  </span>
                  <span className="font-label-md text-label-md text-on-surface font-semibold">
                    {session.venue_name || "Lecture Hall B"} · Room B-102
                  </span>
                  <span className="font-caption text-caption text-secondary">
                    Beacon: BLE-UCC-8812 • GPS ±3.2m accuracy
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Security & Anti-Fraud Enforcements */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container-high">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-lg bg-surface-container-low text-primary flex items-center justify-center border border-surface-container-high">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-title-lg text-title-lg font-bold text-on-surface">
                Active Security &amp; Anti-Fraud Enforcements
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high flex flex-col gap-1.5">
                <div className="w-9 h-9 rounded-lg bg-primary-container text-on-primary flex items-center justify-center mb-1">
                  <MapPin className="h-5 w-5" />
                </div>
                <h4 className="font-title-md text-label-lg font-semibold text-on-surface">
                  Only students inside {session.radius_m}m can check in
                </h4>
                <p className="font-caption text-caption text-secondary">
                  Campus GPS &amp; Wi-Fi BSSID geofenced to lecture footprint. Proxies and spoofed locations are rejected.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high flex flex-col gap-1.5">
                <div className="w-9 h-9 rounded-lg bg-primary-container text-on-primary flex items-center justify-center mb-1">
                  <Clock className="h-5 w-5" />
                </div>
                <h4 className="font-title-md text-label-lg font-semibold text-on-surface" suppressHydrationWarning>
                  Check-in closes promptly at {endTimeStr}
                </h4>
                <p className="font-caption text-caption text-secondary">
                  Submissions rejected immediately after window expiry. Timestamps are cross-validated against UCC NTP clocks.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high flex flex-col gap-1.5">
                <div className="w-9 h-9 rounded-lg bg-primary-container text-on-primary flex items-center justify-center mb-1">
                  <User className="h-5 w-5" />
                </div>
                <h4 className="font-title-md text-label-lg font-semibold text-on-surface">
                  Face and index number are verified
                </h4>
                <p className="font-caption text-caption text-secondary">
                  Liveness selfie matched against registered registry photo. Biometric checks prevent device sharing among students.
                </p>
              </div>
            </div>
          </div>

          {/* Reassurance Callout Card */}
          <div className="bg-surface-container-low rounded-2xl p-5 border border-surface-container-high flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-lg bg-surface-container text-primary flex items-center justify-center shrink-0 mt-0.5">
              <Info className="h-4 w-4" />
            </div>
            <div className="flex flex-col gap-0.5">
              <h4 className="font-label-lg text-label-md text-on-surface font-semibold">
                Why printed or forwarded QR codes remain secure
              </h4>
              <p className="font-body-md text-label-md text-secondary">
                Printed or shared QR codes are completely safe: location geofencing, synchronized dynamic timestamps, and single-device biometric facial checks prevent absent students from checking in remotely.
              </p>
            </div>
          </div>

          {/* Emergency / Session Management Controls (Red-Tinted Container) */}
          <div className="rounded-2xl p-6 bg-error-container/20 border border-error/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-1 max-w-xl">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-error" />
                <span className="font-title-md text-title-md text-error font-semibold">
                  Session Controls &amp; Invalidation
                </span>
              </div>
              <p className="font-caption text-caption text-on-error-container">
                Closing early immediately locks submissions and finalizes the attendance record for {session.class_code}.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleRegenerateQR}
                disabled={isPending}
                className="min-h-[44px] px-4 rounded-xl bg-surface-container-lowest text-amber-700 hover:bg-amber-50 border border-surface-container-high transition-colors font-label-md text-label-md font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span>Regenerate QR</span>
              </button>

              <button
                type="button"
                onClick={handleCloseSession}
                disabled={isPending || session.status === "closed"}
                className="min-h-[44px] px-4 rounded-xl bg-error text-on-error hover:opacity-95 transition-all font-label-md text-label-md font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Power className="h-4 w-4" />
                <span>
                  {session.status === "closed" ? "Session is Closed" : "Close session now"}
                </span>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
