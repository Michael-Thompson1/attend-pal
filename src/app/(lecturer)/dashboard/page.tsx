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
  User,
  Download,
  Plus,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Radio,
  Monitor,
  ChevronRight,
  ChevronLeft,
  UserX,
  MapPinOff,
  Smartphone,
  Info,
  DoorClosed,
  LogOut,
  Sparkles,
} from "lucide-react";
import { signOutAction } from "@/app/auth/actions";
import HeaderSearch from "@/components/lecturer/header-search";

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

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
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

  const now = new Date().getTime();
  const todayKey = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Accra" }).format(new Date());
  const dayKey = (iso: string) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Accra" }).format(new Date(iso));
  const clock = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Africa/Accra",
    });

  const liveSession =
    sessions.find(
      (session) =>
        session.status === "open" &&
        new Date(session.starts_at).getTime() <= now &&
        new Date(session.ends_at).getTime() > now,
    ) ?? null;
  const todaysCount = sessions.filter((session) => dayKey(session.starts_at) === todayKey).length;
  const upcomingCount = sessions.filter(
    (session) => session.status === "open" && new Date(session.starts_at).getTime() > now,
  ).length;

  const verifiedBySession = new Map<string, number>();
  const enrolledByClass = new Map<string, number>();
  const sessionIds = sessions.map((session) => session.id);
  const classIds = [...new Set(sessions.map((session) => session.class_id))];

  if (sessionIds.length > 0) {
    const { data: present } = await supabase
      .from("attendance")
      .select("session_id")
      .in("session_id", sessionIds)
      .eq("status", "verified");
    for (const row of present ?? []) {
      const id = row.session_id as string;
      verifiedBySession.set(id, (verifiedBySession.get(id) ?? 0) + 1);
    }
  }

  if (classIds.length > 0) {
    const { data: roster } = await supabase.from("students").select("class_id").in("class_id", classIds);
    for (const row of roster ?? []) {
      const id = row.class_id as string;
      enrolledByClass.set(id, (enrolledByClass.get(id) ?? 0) + 1);
    }
  }

  const verifiedTotal = [...verifiedBySession.values()].reduce((sum, count) => sum + count, 0);
  const percents = sessions.flatMap((session) => {
    const enrolled = enrolledByClass.get(session.class_id) ?? 0;
    if (enrolled === 0) return [];
    return [((verifiedBySession.get(session.id) ?? 0) / enrolled) * 100];
  });
  const averageAttendance = percents.length
    ? `${(percents.reduce((sum, value) => sum + value, 0) / percents.length).toFixed(1)}%`
    : "—";

  const enrolledLive = liveSession ? (enrolledByClass.get(liveSession.class_id) ?? 0) : 0;
  const checkedLive = liveSession ? (verifiedBySession.get(liveSession.id) ?? 0) : 0;
  const quorumPercent = enrolledLive > 0 ? Math.round((checkedLive / enrolledLive) * 100) : 0;
  const awaitingLive = Math.max(0, enrolledLive - checkedLive);

  function phaseOf(session: SessionRow) {
    if (session.status === "closed" || new Date(session.ends_at).getTime() < now) return "completed";
    if (new Date(session.starts_at).getTime() > now) return "upcoming";
    return "live";
  }

  const visibleSessions = sessions.filter((session) => {
    if (filter === "upcoming") return phaseOf(session) === "upcoming";
    if (filter === "completed") return phaseOf(session) === "completed";
    return true;
  });

  const ringCircumference = 251.2;
  const quorumDashoffset = (ringCircumference * (1 - quorumPercent / 100)).toFixed(1);

  function alertCopy(type: string) {
    if (type === "out_of_bounds") return { label: "Out of bounds", Icon: MapPinOff };
    if (type === "multi_index_device") return { label: "Multiple device signature", Icon: Smartphone };
    if (type === "window_cutoff") return { label: "Window cutoff check-in", Icon: Clock };
    if (type === "low_match") return { label: "Face match needs review", Icon: AlertTriangle };
    return { label: "Fake identity attempt", Icon: UserX };
  }

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
                {openAlertsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-caption text-caption font-bold">
                    {openAlertsCount}
                  </span>
                )}
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
          <HeaderSearch />

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
              {openAlertsCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-error ring-2 ring-surface-container-lowest"></span>
              )}
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
          {sessions.length === 0 && (
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
                    Your account is verified at {institutionName}. Set up a class, then start a session when the lecture begins.
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
                  {todaysCount}
                </span>
                <div className="flex items-center gap-1.5 mt-1 text-secondary font-caption text-caption">
                  <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim"></span>
                  <span>
                    {liveSession ? "1 active now" : "None active now"}
                    {upcomingCount > 0 ? `, ${upcomingCount} upcoming` : ""}
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
                  {verifiedTotal}
                </span>
                <div className="flex items-center gap-1.5 mt-1 text-tertiary-container font-caption text-caption font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Verified check-ins on your recent sessions</span>
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
                    {openAlertsCount}
                  </span>
                  {openAlertsCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-error text-on-error font-caption text-caption font-semibold">
                      Requires Action
                    </span>
                  )}
                </div>
                <span className="font-caption text-caption text-on-secondary-fixed-variant mt-1">
                  {openAlertsCount === 0 ? "No alerts waiting for review" : "Open the alerts centre to review them"}
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
                    {averageAttendance}
                  </span>
                </div>
                <span className="font-caption text-caption text-secondary mt-1">
                  Verified students divided by class size
                </span>
              </div>
            </div>
          </section>

          {/* ── Middle Section: Live Session Card & Recent Alerts ── */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {liveSession ? (
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
                    Closes {clock(liveSession.ends_at)}
                  </span>
                </div>

                {/* Course Meta */}
                <div className="flex flex-col gap-1.5">
                  <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    {liveSession.classes?.code || "Class"} • {liveSession.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 text-secondary font-caption text-caption">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container font-medium text-on-surface">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      {liveSession.venue_name || "Classroom"} (Geo-fence active ±{liveSession.radius_m}m)
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-low">
                      <Clock className="h-3.5 w-3.5" />
                      {clock(liveSession.starts_at)} – {clock(liveSession.ends_at)}
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
                        {quorumPercent}%
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
                        {checkedLive} / {enrolledLive} Checked In
                      </span>
                      <span className="font-caption text-caption text-tertiary-container font-semibold inline-flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        {quorumPercent >= 50 ? "Quorum reached" : "Still checking in"}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
                      <div
                        className="h-full bg-primary-container rounded-full"
                        style={{ width: `${quorumPercent}%` }}
                      ></div>
                    </div>

                    {/* Telemetry Triad */}
                    <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                      <div className="flex flex-col p-2 rounded-lg bg-surface-container-lowest border border-surface-container-high">
                        <span className="font-title-md text-title-md text-tertiary-container font-bold">
                          {checkedLive}
                        </span>
                        <span className="font-caption text-caption text-secondary text-[11px] leading-tight">
                          Verified Present
                        </span>
                      </div>
                      <div className="flex flex-col p-2 rounded-lg bg-surface-container-lowest border border-surface-container-high">
                        <span className="font-title-md text-title-md text-error font-bold">
                          {alerts.filter((alert) => alert.session_id === liveSession.id && alert.status === "new").length}
                        </span>
                        <span className="font-caption text-caption text-secondary text-[11px] leading-tight">
                          Flagged Flags
                        </span>
                      </div>
                      <div className="flex flex-col p-2 rounded-lg bg-surface-container-lowest border border-surface-container-high">
                        <span className="font-title-md text-title-md text-on-surface font-bold">
                          {awaitingLive}
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
                  <span>{liveSession.venue_name || "Classroom"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/sessions/${liveSession.id}/qr`}
                    className="px-4 py-2 rounded-xl bg-surface-container-high text-error font-label-md text-label-md font-semibold hover:bg-error-container hover:text-on-error-container transition-colors cursor-pointer"
                  >
                    Close session
                  </Link>
                  <Link
                    href={`/sessions/${liveSession.id}/monitor`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-container text-on-primary font-label-md text-label-md font-semibold shadow-sm hover:opacity-95 transition-all cursor-pointer"
                  >
                    <Monitor className="h-4 w-4" />
                    <span>Open monitor</span>
                  </Link>
                </div>
              </div>
            </div>
            ) : (
            <div className="lg:col-span-7 flex flex-col justify-center gap-4 rounded-2xl border border-surface-container-high bg-surface-container-lowest p-6 shadow-sm">
              <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">No class session is open</h2>
              <p className="font-body-md text-body-md text-secondary">
                Create a session when the lecture is about to start. The QR pass and the room monitor open from that session.
              </p>
              <Link
                href="/sessions/new"
                className="inline-flex w-fit items-center gap-2 rounded-xl bg-primary-container px-4 py-2.5 font-label-md text-label-md font-semibold text-on-primary"
              >
                <Plus className="h-4 w-4" />
                New session
              </Link>
            </div>
            )}

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
                        {openAlertsCount} new
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
                    View all ({alerts.length})
                  </Link>
                </div>

                {/* Alerts List */}
                                <div className="flex flex-col gap-2.5">
                  {alerts.length === 0 ? (
                    <p className="rounded-xl bg-surface-container-low px-4 py-6 text-center font-body-md text-label-md text-secondary">
                      No alerts yet.
                    </p>
                  ) : (
                    alerts.slice(0, 4).map((alert) => {
                      const meta = alertCopy(alert.type);
                      const Icon = meta.Icon;
                      return (
                        <div key={alert.id} className="flex items-center justify-between gap-3 rounded-xl border border-surface-container-high bg-surface-container-low p-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-error-container text-on-error-container">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex min-w-0 flex-col">
                              <span className="truncate font-label-md text-label-md font-semibold text-on-surface">{meta.label}</span>
                              <span className="truncate font-caption text-caption text-secondary">
                                {alert.claimed_index || "No index"} · {alert.status}
                              </span>
                              <span className="font-caption text-[11px] font-medium text-secondary">{clock(alert.created_at)}</span>
                            </div>
                          </div>
                          <Link href="/alerts" className="inline-flex shrink-0 items-center gap-0.5 rounded-lg border border-surface-container-high bg-surface-container-lowest px-2.5 py-1.5 font-label-md text-label-md font-semibold text-primary">
                            <span>Review</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Quick Resolution Hint */}
              <div className="flex items-center justify-between text-secondary font-caption text-caption pt-2 border-t border-surface-container-high">
                <span className="inline-flex items-center gap-1.5">
                  <Info className="h-4 w-4 text-primary" />
                  Review each alert before you dismiss it
                </span>
                <Link
                  href="/alerts"
                  className="text-primary font-semibold hover:underline cursor-pointer"
                >
                  Open alerts
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
                  <Link href="/dashboard" className={`px-3 py-1 rounded-lg ${filter !== "upcoming" && filter !== "completed" ? "bg-surface-container-lowest text-on-surface font-semibold shadow-sm" : "hover:text-on-surface"}`}>
                    All ({sessions.length})
                  </Link>
                  <Link href="/dashboard?filter=upcoming" className={`px-3 py-1 rounded-lg ${filter === "upcoming" ? "bg-surface-container-lowest text-on-surface font-semibold shadow-sm" : "hover:text-on-surface"}`}>
                    Upcoming
                  </Link>
                  <Link href="/dashboard?filter=completed" className={`px-3 py-1 rounded-lg ${filter === "completed" ? "bg-surface-container-lowest text-on-surface font-semibold shadow-sm" : "hover:text-on-surface"}`}>
                    Completed
                  </Link>
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
                  {visibleSessions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-secondary">
                        No sessions in this view. Create one when the class is about to start.
                      </td>
                    </tr>
                  ) : (
                    visibleSessions.map((session) => {
                      const status = phaseOf(session);
                      const enrolled = enrolledByClass.get(session.class_id) ?? 0;
                      const present = verifiedBySession.get(session.id) ?? 0;
                      const percent = enrolled > 0 ? Math.round((present / enrolled) * 100) : 0;
                      const minutes = Math.max(
                        1,
                        Math.round((new Date(session.ends_at).getTime() - new Date(session.starts_at).getTime()) / 60000),
                      );
                      return (
                        <tr key={session.id} className="hover:bg-surface-container-low/70 transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex flex-col">
                              <span className="font-title-md text-title-md font-semibold text-on-surface">
                                {session.classes?.code || "Class"} · {session.title}
                              </span>
                              <span className="font-caption text-caption text-secondary">
                                {session.classes?.title || "Course"}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col">
                              <span className="font-label-md text-label-md font-semibold text-on-surface">{dayKey(session.starts_at)}</span>
                              <span className="font-caption text-caption text-secondary">
                                {clock(session.starts_at)} – {clock(session.ends_at)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-secondary">{minutes}m window</td>
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center gap-1.5 font-medium text-on-surface">
                              <DoorClosed className="h-4 w-4 text-secondary" />
                              {session.venue_name || "Classroom"}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-2.5 py-1 font-caption text-caption font-semibold text-primary">
                              {status === "live" ? "LIVE" : status === "upcoming" ? "Scheduled" : "Completed"}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-caption text-caption text-secondary">
                              {enrolled === 0 ? "No roster yet" : `${present}/${enrolled} (${percent}%)`}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              <Link href={`/sessions/${session.id}/qr`} className="rounded-lg bg-primary-container px-3 py-1.5 font-label-md text-label-md font-semibold text-on-primary">
                                QR pass
                              </Link>
                              <Link
                                href={status === "completed" ? "/reports" : `/sessions/${session.id}/monitor`}
                                className="rounded-lg bg-surface-container-low px-3 py-1.5 font-label-md text-label-md font-semibold text-primary"
                              >
                                {status === "completed" ? "View report" : "Monitor"}
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer with pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-secondary font-caption text-caption border-t border-surface-container-high">
              <span>
                Showing {visibleSessions.length} of {sessions.length} sessions
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
