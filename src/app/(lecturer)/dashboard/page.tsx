import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  LayoutGrid,
  BookOpen,
  Clock,
  Bell,
  BarChart3,
  Settings,
  MapPin,
  Search,
  User,
  Download,
  Plus,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  ArrowUp,
  Radio,
  Monitor,
  ChevronRight,
  ChevronLeft,
  UserX,
  MapPinOff,
  Smartphone,
  Info,
  DoorClosed,
  CheckCheck,
  Check,
  Pencil,
  LogOut,
  Sparkles,
} from "lucide-react";
import { signOutAction } from "@/app/auth/actions";

interface JoinedClass {
  code: string;
  title: string;
  programme: string | null;
}

interface SessionRow {
  id: string;
  class_id: string;
  lecturer_id: string;
  title: string;
  token: string;
  starts_at: string;
  ends_at: string;
  venue_name: string | null;
  radius_m: number;
  status: "open" | "closed";
  classes: JoinedClass | null;
}

interface AlertRow {
  id: string;
  session_id: string;
  type: string;
  severity: "high" | "medium" | "low";
  claimed_index: string | null;
  status: "new" | "reviewed" | "dismissed";
  created_at: string;
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Fetch lecturer profile
  const { data: profileData } = await supabase
    .from("lecturers")
    .select("full_name, institution, campus")
    .eq("id", user.id)
    .single();

  const profile = profileData as {
    full_name?: string;
    institution?: string;
    campus?: string;
  } | null;

  const fullName =
    profile?.full_name ||
    (user.user_metadata?.full_name as string) ||
    user.email?.split("@")[0] ||
    "Lecturer";
  const firstName = fullName.split(" ")[0];
  const institutionName =
    profile?.institution || "University of Cape Coast";
  const campusName =
    profile?.campus || "UCC Main Campus • North Wing";

  // 2. Fetch classes count
  const { count: classesCount } = await supabase
    .from("classes")
    .select("id", { count: "exact", head: true })
    .eq("lecturer_id", user.id);

  // 3. Fetch lecturer's sessions
  const { data: rawSessions } = await supabase
    .from("sessions")
    .select("id, class_id, lecturer_id, title, token, starts_at, ends_at, venue_name, radius_m, status, classes(code, title, programme)")
    .eq("lecturer_id", user.id)
    .order("starts_at", { ascending: false })
    .limit(10);

  const sessions = (rawSessions as unknown as SessionRow[]) || [];

  // 4. Fetch open alerts for this lecturer's sessions
  const { data: rawAlerts } = await supabase
    .from("alerts")
    .select("id, session_id, type, severity, claimed_index, details, status, created_at, sessions!inner(lecturer_id)")
    .eq("sessions.lecturer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const alerts = (rawAlerts as unknown as AlertRow[]) || [];
  const openAlertsCount = alerts.filter((a) => a.status === "new").length;

  // Determine if this is a newly created account with 0 sessions
  const hasLiveSessions = sessions.length > 0;

  // Active session detection
  const liveSession = sessions.find((s) => s.status === "open");

  // Fallback demo data for look & feel demonstration
  const demoActiveSession = {
    code: "INF212",
    title: "Data Structures & Algorithms",
    venue: "Lecture Hall B",
    radius_m: 25,
    remainingText: "18 mins remaining (Closes 10:30 AM)",
    kioskName: "Stationary Kiosk Terminal • Hall B Front Door",
    terminalId: "Terminal #K-04",
    totalEnrolled: 52,
    checkedIn: 38,
    quorumPercent: 73,
    verified: 38,
    flagged: 2,
    awaiting: 12,
  };

  const activeDisplay = liveSession
    ? {
        code: liveSession.classes?.code || "COURSE",
        title: liveSession.title || liveSession.classes?.title || "Active Session",
        venue: liveSession.venue_name || "Lecture Hall B",
        radius_m: liveSession.radius_m || 50,
        remainingText: `Closes at ${new Date(liveSession.ends_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
        kioskName: "Stationary Kiosk Terminal • Active Session",
        terminalId: "Terminal #Live-01",
        totalEnrolled: 50,
        checkedIn: 0,
        quorumPercent: 0,
        verified: 0,
        flagged: 0,
        awaiting: 50,
      }
    : demoActiveSession;

  // Circular ring calculations (r = 40, circumference = 251.2)
  const ringCircumference = 251.2;
  const quorumDashoffset = (
    ringCircumference * (1 - activeDisplay.quorumPercent / 100)
  ).toFixed(1);

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
                aria-current="page"
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-primary-container text-on-primary font-semibold shadow-sm transition-all text-label-md"
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
                {classesCount !== null && classesCount > 0 && (
                  <span className="ml-auto px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-caption text-caption font-semibold">
                    {classesCount}
                  </span>
                )}
              </Link>

              <Link
                href="/sessions"
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all font-label-lg text-label-md font-medium"
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
                  {hasLiveSessions ? openAlertsCount : 3}
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
          {/* Faculty & Campus Card */}
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
                  {campusName}
                </span>
              </div>
            </div>
          </div>

          {/* User Profile & Sign Out */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-caption flex-shrink-0">
                {firstName.charAt(0)}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-label-md text-label-md font-semibold text-on-surface truncate">
                  {fullName}
                </span>
                <span className="font-caption text-[11px] text-secondary truncate">
                  {user.email}
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
          {/* Search bar */}
          <div className="relative w-72 sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-outline" />
            <input
              type="search"
              placeholder="Search students, courses, or sessions..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-surface-container-low text-on-surface placeholder:text-outline font-body-md text-label-md border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
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

            {/* User Chip */}
            <div className="hidden sm:flex items-center gap-2.5 p-1.5 pl-2 pr-3.5 rounded-full bg-surface-container-low hover:bg-surface-container transition-colors">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-sm flex-shrink-0">
                <User className="h-4 w-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-label-md text-label-md text-on-surface font-semibold leading-tight">
                  {fullName}
                </span>
                <span className="font-caption text-caption text-secondary leading-tight">
                  Senior Lecturer
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* ── Main Content Dashboard ── */}
        <main className="w-full pt-20 px-6 lg:px-10 pb-12 flex flex-col gap-6">
          {/* Welcome Banner for Newly Registered Accounts */}
          {!hasLiveSessions && (
            <div className="rounded-2xl bg-primary-fixed/30 border border-primary-fixed-dim/60 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-primary-container text-on-primary flex-shrink-0 mt-0.5">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-title-md text-title-md font-bold text-primary">
                    Welcome to Attend Pal, {firstName}!
                  </h3>
                  <p className="font-body-md text-secondary text-label-md mt-0.5">
                    Your account is verified at {institutionName}. Below is a demonstration of your live roll-call and telemetry dashboard. Set up your course rosters to start conducting real sessions.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 self-start sm:self-auto flex-shrink-0">
                <Link
                  href="/classes"
                  className="px-4 py-2 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-semibold shadow-sm hover:opacity-95 transition-all"
                >
                  Set up Classes
                </Link>
              </div>
            </div>
          )}

          {/* Header Greeting & Action Bar */}
          <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-caption text-caption font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-surface-tint"></span>
                  Academic Portal • AY 2024/2025
                </span>
              </div>
              <h1 className="font-headline-md text-headline-md font-bold text-on-surface tracking-tight">
                Good morning, {firstName}
              </h1>
              <p className="font-caption text-caption text-secondary">
                Department of Computer Science • {institutionName} • Semester 2, 2024
              </p>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-auto">
              <Link
                href="/reports"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-lowest text-secondary font-label-lg text-label-md font-medium shadow-sm border border-surface-container-high hover:bg-surface-container hover:text-on-surface transition-all active:scale-[0.98] cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Export Roster</span>
              </Link>

              <Link
                href="/sessions/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-container text-on-primary font-label-lg text-label-md font-semibold shadow-sm hover:opacity-95 transition-all active:scale-[0.98] cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>+ New session</span>
              </Link>
            </div>
          </section>

          {/* ── 4-Card Stats Grid ── */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Stat 1: Today's sessions */}
            <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-surface-container-high flex flex-col justify-between gap-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md text-secondary uppercase tracking-wider font-medium">
                  Today&apos;s sessions
                </span>
                <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                  <Calendar className="h-5 w-5" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-display-lg text-display-lg text-on-surface font-bold">
                  {hasLiveSessions ? sessions.length : 3}
                </span>
                <div className="flex items-center gap-1.5 mt-1 text-secondary font-caption text-caption">
                  <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim"></span>
                  <span>
                    {liveSession ? "1 active now" : "1 active now, 2 upcoming"}
                  </span>
                </div>
              </div>
            </div>

            {/* Stat 2: Students verified */}
            <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-surface-container-high flex flex-col justify-between gap-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md text-secondary uppercase tracking-wider font-medium">
                  Students verified
                </span>
                <div className="w-10 h-10 rounded-xl bg-tertiary-container/10 flex items-center justify-center text-tertiary-container">
                  <ShieldCheck className="h-5 w-5" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-display-lg text-display-lg text-on-surface font-bold">
                  {hasLiveSessions ? activeDisplay.verified : 142}
                </span>
                <div className="flex items-center gap-1.5 mt-1 text-tertiary-container font-caption text-caption font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Across 2 completed &amp; live courses</span>
                </div>
              </div>
            </div>

            {/* Stat 3: Open alerts */}
            <div className="bg-secondary-fixed/40 p-5 rounded-2xl shadow-sm border border-secondary-container flex flex-col justify-between gap-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md text-on-secondary-fixed-variant uppercase tracking-wider font-semibold">
                  Open alerts
                </span>
                <div className="w-10 h-10 rounded-xl bg-error-container text-on-error-container flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="font-display-lg text-display-lg text-error font-bold">
                    {hasLiveSessions ? openAlertsCount : 4}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-error text-on-error font-caption text-caption font-semibold">
                    Requires Action
                  </span>
                </div>
                <span className="font-caption text-caption text-on-secondary-fixed-variant mt-1">
                  2 biometric mismatches, 2 out-of-bounds
                </span>
              </div>
            </div>

            {/* Stat 4: Average attendance */}
            <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-surface-container-high flex flex-col justify-between gap-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md text-secondary uppercase tracking-wider font-medium">
                  Average attendance
                </span>
                <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-primary">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-display-lg text-display-lg text-on-surface font-bold">
                    94.2%
                  </span>
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-tertiary-container/15 text-tertiary-container font-caption text-caption font-semibold">
                    <ArrowUp className="h-3.5 w-3.5" />
                    +3.1%
                  </span>
                </div>
                <span className="font-caption text-caption text-secondary mt-1">
                  vs. departmental baseline (91.1%)
                </span>
              </div>
            </div>
          </section>

          {/* ── Middle Section: Live Session Card & Recent Alerts ── */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Live Session Card (7 cols) */}
            <div className="lg:col-span-7 bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container-high flex flex-col justify-between gap-6">
              <div className="flex flex-col gap-4">
                {/* Top Status Bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary-fixed-dim opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-tertiary-container"></span>
                    </span>
                    <span className="font-label-lg text-label-md font-bold text-tertiary-container tracking-wider uppercase">
                      Active Class Session
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-tertiary-container text-on-tertiary font-caption text-caption font-bold tracking-wide">
                      LIVE
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1.5 text-secondary font-caption text-caption bg-surface-container-low px-2.5 py-1 rounded-full border border-surface-container-high">
                    <Radio className="h-3.5 w-3.5 text-tertiary-container" />
                    {activeDisplay.terminalId}
                  </span>
                </div>

                {/* Course Meta */}
                <div className="flex flex-col gap-1.5">
                  <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    {activeDisplay.code} • {activeDisplay.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 text-secondary font-caption text-caption">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container font-medium text-on-surface">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      {activeDisplay.venue} (Geo-fence active ±{activeDisplay.radius_m}m)
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-low">
                      <Clock className="h-3.5 w-3.5" />
                      {activeDisplay.remainingText}
                    </span>
                  </div>
                </div>

                {/* Progress Visualization & Telemetry */}
                <div className="p-4 rounded-xl bg-surface-container-low flex flex-col sm:flex-row items-center gap-5 border border-surface-container-high">
                  {/* Circular SVG Progress Ring */}
                  <div className="relative w-28 h-28 flex-shrink-0 flex items-center justify-center">
                    <svg
                      className="w-full h-full transform -rotate-90"
                      viewBox="0 0 100 100"
                    >
                      <circle
                        className="text-surface-container-high"
                        cx="50"
                        cy="50"
                        fill="transparent"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="9"
                      />
                      <circle
                        className="text-primary-container"
                        cx="50"
                        cy="50"
                        fill="transparent"
                        r="40"
                        stroke="currentColor"
                        strokeDasharray={ringCircumference}
                        strokeDashoffset={quorumDashoffset}
                        strokeLinecap="round"
                        strokeWidth="9"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center text-center">
                      <span className="font-title-lg text-title-lg text-on-surface font-bold leading-none">
                        {activeDisplay.quorumPercent}%
                      </span>
                      <span className="font-caption text-caption text-secondary uppercase text-[10px] mt-0.5 font-semibold">
                        Quorum
                      </span>
                    </div>
                  </div>

                  {/* Progress Details & Metrics */}
                  <div className="flex flex-col flex-1 w-full gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-title-md text-title-md text-on-surface font-semibold">
                        {activeDisplay.checkedIn} / {activeDisplay.totalEnrolled} Checked In
                      </span>
                      <span className="font-caption text-caption text-tertiary-container font-semibold inline-flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        Quorum reached
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
                      <div
                        className="h-full bg-primary-container rounded-full"
                        style={{ width: `${activeDisplay.quorumPercent}%` }}
                      ></div>
                    </div>

                    {/* Telemetry Triad */}
                    <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                      <div className="flex flex-col p-2 rounded-lg bg-surface-container-lowest border border-surface-container-high">
                        <span className="font-title-md text-title-md text-tertiary-container font-bold">
                          {activeDisplay.verified}
                        </span>
                        <span className="font-caption text-caption text-secondary text-[11px] leading-tight">
                          Verified Present
                        </span>
                      </div>
                      <div className="flex flex-col p-2 rounded-lg bg-surface-container-lowest border border-surface-container-high">
                        <span className="font-title-md text-title-md text-error font-bold">
                          {activeDisplay.flagged}
                        </span>
                        <span className="font-caption text-caption text-secondary text-[11px] leading-tight">
                          Flagged Flags
                        </span>
                      </div>
                      <div className="flex flex-col p-2 rounded-lg bg-surface-container-lowest border border-surface-container-high">
                        <span className="font-title-md text-title-md text-on-surface font-bold">
                          {activeDisplay.awaiting}
                        </span>
                        <span className="font-caption text-caption text-secondary text-[11px] leading-tight">
                          Awaiting Scan
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-surface-container-high">
                <div className="flex items-center gap-1.5 text-secondary font-caption text-caption">
                  <Radio className="h-4 w-4 text-tertiary-container" />
                  <span>{activeDisplay.kioskName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={liveSession ? `/sessions/${liveSession.id}` : "/sessions"}
                    className="px-4 py-2 rounded-xl bg-surface-container-high text-error font-label-md text-label-md font-semibold hover:bg-error-container hover:text-on-error-container transition-colors cursor-pointer"
                  >
                    Close session
                  </Link>
                  <Link
                    href={liveSession ? `/sessions/${liveSession.id}/monitor` : "/sessions/monitor"}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-container text-on-primary font-label-md text-label-md font-semibold shadow-sm hover:opacity-95 transition-all cursor-pointer"
                  >
                    <Monitor className="h-4 w-4" />
                    <span>Open monitor</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Column: Recent Alerts Card (5 cols) */}
            <div className="lg:col-span-5 bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container-high flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h2 className="font-title-lg text-title-lg font-bold text-on-surface">
                        Recent alerts
                      </h2>
                      <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-caption text-caption font-bold">
                        {hasLiveSessions ? openAlertsCount : 4} new
                      </span>
                    </div>
                    <span className="font-caption text-caption text-secondary">
                      Security &amp; geofence flags requiring attention
                    </span>
                  </div>
                  <Link
                    href="/alerts"
                    className="font-label-md text-label-md text-primary font-semibold hover:underline"
                  >
                    View all ({hasLiveSessions ? alerts.length : 4})
                  </Link>
                </div>

                {/* Alerts List */}
                <div className="flex flex-col gap-2.5">
                  {/* Alert 1: Fake identity attempt */}
                  <div className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors flex items-center justify-between gap-3 border border-surface-container-high">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-error-container text-on-error-container flex items-center justify-center flex-shrink-0 mt-0.5">
                        <UserX className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-label-md text-label-md text-on-surface font-semibold truncate">
                          Fake identity attempt
                        </span>
                        <span className="font-caption text-caption text-secondary truncate">
                          Index 20231045 • Sarah Osei
                        </span>
                        <span className="font-caption text-[11px] text-error font-medium">
                          Liveness check failed • 10:03 AM
                        </span>
                      </div>
                    </div>
                    <Link
                      href="/alerts/fake-identity"
                      className="inline-flex items-center gap-0.5 px-2.5 py-1.5 rounded-lg bg-surface-container-lowest text-primary font-label-md text-label-md font-semibold hover:bg-primary-container hover:text-on-primary transition-all flex-shrink-0 shadow-sm border border-surface-container-high cursor-pointer"
                    >
                      <span>Review</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  {/* Alert 2: Out of bounds */}
                  <div className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors flex items-center justify-between gap-3 border border-surface-container-high">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center flex-shrink-0 mt-0.5">
                        <MapPinOff className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-label-md text-label-md text-on-surface font-semibold truncate">
                          Out of bounds
                        </span>
                        <span className="font-caption text-caption text-secondary truncate">
                          Index 20230812 • 190 m away
                        </span>
                        <span className="font-caption text-[11px] text-on-secondary-fixed-variant font-medium">
                          Campus North Quad • 10:05 AM
                        </span>
                      </div>
                    </div>
                    <Link
                      href="/alerts/out-of-bounds"
                      className="inline-flex items-center gap-0.5 px-2.5 py-1.5 rounded-lg bg-surface-container-lowest text-primary font-label-md text-label-md font-semibold hover:bg-primary-container hover:text-on-primary transition-all flex-shrink-0 shadow-sm border border-surface-container-high cursor-pointer"
                    >
                      <span>Review</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  {/* Alert 3: Window cutoff check-in */}
                  <div className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors flex items-center justify-between gap-3 border border-surface-container-high">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-label-md text-label-md text-on-surface font-semibold truncate">
                          Window cutoff check-in
                        </span>
                        <span className="font-caption text-caption text-secondary truncate">
                          Index 20231190 • Late scan
                        </span>
                        <span className="font-caption text-[11px] text-secondary font-medium">
                          Submitted +3m past kiosk • 10:08 AM
                        </span>
                      </div>
                    </div>
                    <Link
                      href="/alerts/window-cutoff"
                      className="inline-flex items-center gap-0.5 px-2.5 py-1.5 rounded-lg bg-surface-container-lowest text-primary font-label-md text-label-md font-semibold hover:bg-primary-container hover:text-on-primary transition-all flex-shrink-0 shadow-sm border border-surface-container-high cursor-pointer"
                    >
                      <span>Review</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  {/* Alert 4: Multiple device signature */}
                  <div className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors flex items-center justify-between gap-3 border border-surface-container-high">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-error-container text-on-error-container flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Smartphone className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-label-md text-label-md text-on-surface font-semibold truncate">
                          Multiple device signature
                        </span>
                        <span className="font-caption text-caption text-secondary truncate">
                          Index 20230419 • Dual IP login
                        </span>
                        <span className="font-caption text-[11px] text-error font-medium">
                          Simultaneous token use • 09:58 AM
                        </span>
                      </div>
                    </div>
                    <Link
                      href="/alerts/multiple-devices"
                      className="inline-flex items-center gap-0.5 px-2.5 py-1.5 rounded-lg bg-surface-container-lowest text-primary font-label-md text-label-md font-semibold hover:bg-primary-container hover:text-on-primary transition-all flex-shrink-0 shadow-sm border border-surface-container-high cursor-pointer"
                    >
                      <span>Review</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Quick Resolution Hint */}
              <div className="flex items-center justify-between text-secondary font-caption text-caption pt-2 border-t border-surface-container-high">
                <span className="inline-flex items-center gap-1.5">
                  <Info className="h-4 w-4 text-primary" />
                  Auto-quarantine enabled for high risks
                </span>
                <Link
                  href="/alerts"
                  className="text-primary font-semibold hover:underline cursor-pointer"
                >
                  Batch Dismiss Normal
                </Link>
              </div>
            </div>
          </section>

          {/* ── Bottom Section: Upcoming and recent sessions (Table) ── */}
          <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container-high flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-col">
                <h2 className="font-title-lg text-title-lg font-bold text-on-surface">
                  Upcoming and recent sessions
                </h2>
                <span className="font-caption text-caption text-secondary">
                  Historical logs and upcoming lecture schedules
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex rounded-xl bg-surface-container p-1 text-secondary font-label-md text-label-md">
                  <button
                    type="button"
                    className="px-3 py-1 rounded-lg bg-surface-container-lowest text-on-surface font-semibold shadow-sm cursor-pointer"
                  >
                    All ({hasLiveSessions ? sessions.length : 4})
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1 rounded-lg hover:text-on-surface transition-colors cursor-pointer"
                  >
                    Upcoming
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1 rounded-lg hover:text-on-surface transition-colors cursor-pointer"
                  >
                    Completed
                  </button>
                </div>
              </div>
            </div>

            {/* Responsive Table Wrapper */}
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full text-left min-w-[760px] border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-secondary font-label-md text-label-md">
                    <th className="py-3 px-4 rounded-l-xl">Course &amp; Code</th>
                    <th className="py-3 px-4">Date &amp; Time</th>
                    <th className="py-3 px-4">Window</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Attendance</th>
                    <th className="py-3 px-4 text-right rounded-r-xl">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high font-body-md text-label-md text-on-surface">
                  {/* Row 1: INF212 Algorithms (LIVE) */}
                  <tr className="hover:bg-surface-container-low/70 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="font-title-md text-title-md font-semibold text-on-surface">
                          INF212 • Algorithms
                        </span>
                        <span className="font-caption text-caption text-secondary">
                          BSc Computer Science • L200
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md font-semibold text-tertiary-container">
                          Live now
                        </span>
                        <span className="font-caption text-caption text-secondary">
                          10:00 - 11:30 AM
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-secondary">15m window</td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1.5 text-on-surface font-medium">
                        <DoorClosed className="h-4 w-4 text-secondary" />
                        Lecture Hall B
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-tertiary-container/15 text-tertiary-container font-caption text-caption font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container animate-pulse"></span>
                        LIVE
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-1 w-32">
                        <div className="flex items-center justify-between font-caption text-caption text-secondary">
                          <span>38/52</span>
                          <span className="font-semibold text-on-surface">
                            73%
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                          <div
                            className="h-full bg-primary-container rounded-full"
                            style={{ width: "73%" }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link
                        href="/sessions/INF212/manage"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md font-semibold shadow-sm hover:opacity-90 transition-all cursor-pointer"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>

                  {/* Row 2: CS302 Distributed Systems (Scheduled) */}
                  <tr className="hover:bg-surface-container-low/70 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="font-title-md text-title-md font-semibold text-on-surface">
                          CS302 • Distributed Systems
                        </span>
                        <span className="font-caption text-caption text-secondary">
                          BSc Computer Engineering • L300
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md font-semibold text-on-surface">
                          Today
                        </span>
                        <span className="font-caption text-caption text-secondary">
                          02:00 - 03:30 PM
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-secondary">15m window</td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1.5 text-on-surface font-medium">
                        <DoorClosed className="h-4 w-4 text-secondary" />
                        Hall 3B
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-primary font-caption text-caption font-semibold">
                        <Calendar className="h-3.5 w-3.5" />
                        Scheduled
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-caption text-caption text-secondary">
                        –– / 64 enrolled
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <Link
                          href="/sessions/CS302/start"
                          className="px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-label-md text-label-md font-semibold transition-colors cursor-pointer"
                        >
                          Start early
                        </Link>
                        <button
                          type="button"
                          className="p-1.5 rounded-lg text-secondary hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
                          title="Edit session"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Row 3: INF204 Database Systems (Completed) */}
                  <tr className="hover:bg-surface-container-low/70 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="font-title-md text-title-md font-semibold text-on-surface">
                          INF204 • Database Systems
                        </span>
                        <span className="font-caption text-caption text-secondary">
                          BSc Information Technology • L200
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface">
                          Yesterday
                        </span>
                        <span className="font-caption text-caption text-secondary">
                          09:00 - 10:30 AM
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-secondary">15m window</td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1.5 text-on-surface font-medium">
                        <DoorClosed className="h-4 w-4 text-secondary" />
                        Lab 04
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container/60 text-on-secondary-fixed-variant font-caption text-caption font-semibold">
                        <CheckCheck className="h-3.5 w-3.5" />
                        Completed
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-tertiary-container/15 text-tertiary-container font-caption text-caption font-semibold">
                        <Check className="h-3.5 w-3.5" />
                        58/60 (96.7%)
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link
                        href="/reports/INF204"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container-low text-primary font-label-md text-label-md font-semibold hover:bg-surface-container transition-colors cursor-pointer"
                      >
                        View report
                      </Link>
                    </td>
                  </tr>

                  {/* Row 4: CS401 Machine Learning (Completed) */}
                  <tr className="hover:bg-surface-container-low/70 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="font-title-md text-title-md font-semibold text-on-surface">
                          CS401 • Machine Learning
                        </span>
                        <span className="font-caption text-caption text-secondary">
                          BSc Computer Science • L400
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface">
                          24 May 2024
                        </span>
                        <span className="font-caption text-caption text-secondary">
                          11:00 - 12:30 PM
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-secondary">20m window</td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1.5 text-on-surface font-medium">
                        <DoorClosed className="h-4 w-4 text-secondary" />
                        Auditorium A
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container/60 text-on-secondary-fixed-variant font-caption text-caption font-semibold">
                        <CheckCheck className="h-3.5 w-3.5" />
                        Completed
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-tertiary-container/15 text-tertiary-container font-caption text-caption font-semibold">
                        <Check className="h-3.5 w-3.5" />
                        82/85 (96.5%)
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link
                        href="/reports/CS401"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container-low text-primary font-label-md text-label-md font-semibold hover:bg-surface-container transition-colors cursor-pointer"
                      >
                        View report
                      </Link>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Table Footer with pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-secondary font-caption text-caption border-t border-surface-container-high">
              <span>
                Showing {hasLiveSessions ? sessions.length : 4} active and recent course sessions
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="p-1.5 rounded-md hover:bg-surface-container text-secondary hover:text-on-surface transition-colors disabled:opacity-40 cursor-not-allowed"
                  disabled
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="font-medium text-on-surface">Page 1 of 1</span>
                <button
                  type="button"
                  className="p-1.5 rounded-md hover:bg-surface-container text-secondary hover:text-on-surface transition-colors disabled:opacity-40 cursor-not-allowed"
                  disabled
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
