"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import HeaderSearch from "@/components/lecturer/header-search";
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
  ShieldCheck,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  XCircle,
  X,
  Hourglass,
  LogOut,
  QrCode,
  StopCircle,
  Volume2,
  VolumeX,
  PlusCircle,
  Eye,
  Ban,
  Map,
  Info,
  Radio,
  DoorOpen,
  Users,
  Navigation,
  RefreshCw,
  Edit,
  Loader2,
} from "lucide-react";
import { signOutAction } from "@/app/auth/actions";
import {
  closeSessionAction,
  extendSessionWindowAction,
  manualAttendanceOverrideAction,
  dismissAlertAction,
} from "@/app/(lecturer)/sessions/actions";

export interface AttendanceRecordItem {
  id: string;
  session_id: string;
  student_id: string;
  checkin_number: number;
  status: "verified" | "manual";
  distance_m: number | null;
  gps_accuracy_m: number | null;
  match_score: number | null;
  liveness_passed: boolean | null;
  manual_reason: string | null;
  created_at: string;
  student_name: string;
  student_index: string;
}

export interface AlertRecordItem {
  id: string;
  session_id: string;
  type: string;
  severity: "high" | "medium" | "low";
  claimed_index: string | null;
  student_id: string | null;
  distance_m: number | null;
  match_score: number | null;
  details: unknown;
  status: "new" | "reviewed" | "dismissed";
  created_at: string;
}

interface StudentTelemetry {
  id: string;
  time: string;
  name: string;
  indexNumber: string;
  distanceM: number;
  faceMatchScore: number;
  status: "verified" | "low_liveness" | "rejected" | "out_of_bounds" | "pending";
  statusLabel: string;
  avatarUrl?: string;
  initials?: string;
  studentId?: string;
}

interface SecurityAlert {
  id: string;
  type: "fake_identity" | "out_of_bounds" | "multi_index" | "resolved";
  title: string;
  severity: "high" | "medium" | "critical" | "resolved";
  description: string;
  studentName?: string;
  studentIndex?: string;
  timestamp: string;
  extraTag?: string;
}

interface SessionMonitorClientViewProps {
  session: {
    id: string;
    class_id: string;
    class_code: string;
    class_title: string;
    title: string;
    starts_at: string;
    ends_at: string;
    venue_name: string | null;
    radius_m: number;
    status: "open" | "closed";
    student_count: number;
    checked_in_count: number;
  };
  initialAttendance?: AttendanceRecordItem[];
  initialAlerts?: AlertRecordItem[];
}

const INITIAL_STUDENTS: StudentTelemetry[] = [
  {
    id: "1",
    time: "10:09:44 AM",
    name: "Kofi Boateng",
    indexNumber: "20231894",
    distanceM: 22,
    faceMatchScore: 64,
    status: "low_liveness",
    statusLabel: "Low Liveness",
    initials: "KB",
  },
  {
    id: "2",
    time: "10:08:12 AM",
    name: "Daniel Osei",
    indexNumber: "20231045",
    distanceM: 18,
    faceMatchScore: 24,
    status: "rejected",
    statusLabel: "Rejected",
    initials: "DO",
  },
  {
    id: "3",
    time: "10:07:33 AM",
    name: "Ama Mensah",
    indexNumber: "20238819",
    distanceM: 340,
    faceMatchScore: 96,
    status: "out_of_bounds",
    statusLabel: "Out of Bounds",
    initials: "AM",
  },
  {
    id: "4",
    time: "10:06:51 AM",
    name: "Abena Kwarteng",
    indexNumber: "20233491",
    distanceM: 14,
    faceMatchScore: 99,
    status: "verified",
    statusLabel: "Verified",
    initials: "AK",
  },
  {
    id: "5",
    time: "10:05:18 AM",
    name: "Emmanuel Tetteh",
    indexNumber: "20235012",
    distanceM: 28,
    faceMatchScore: 95,
    status: "verified",
    statusLabel: "Verified",
    initials: "ET",
  },
  {
    id: "6",
    time: "10:04:02 AM",
    name: "Yaw Asamoah",
    indexNumber: "20237741",
    distanceM: 88,
    faceMatchScore: 91,
    status: "verified",
    statusLabel: "Verified",
    initials: "YA",
  },
];

const INITIAL_ALERTS: SecurityAlert[] = [
  {
    id: "a1",
    type: "fake_identity",
    title: "Fake identity attempt",
    severity: "high",
    description:
      "Static photo presented instead of 3D facial liveness. Blink challenge failed 3 consecutive times.",
    studentName: "Daniel Osei",
    studentIndex: "20231045",
    timestamp: "10:03 AM (8m ago)",
  },
  {
    id: "a2",
    type: "out_of_bounds",
    title: "Out of bounds check-in",
    severity: "medium",
    description:
      "GPS detected 340 m away near Central Library lawn, outside permitted ±100 m geofence perimeter.",
    studentName: "Ama Mensah",
    studentIndex: "20238819",
    timestamp: "10:07 AM (4m ago)",
  },
  {
    id: "a3",
    type: "multi_index",
    title: "Same device for 3 indices",
    severity: "critical",
    description:
      "Device fingerprint #iPhone15-88AF attempted logins for 20231190, 20230412, and 20239921 within 45 seconds.",
    timestamp: "10:09 AM (2m ago)",
    extraTag: "3 Duplicate Accounts",
  },
  {
    id: "a4",
    type: "resolved",
    title: "GPS drift resolved",
    severity: "resolved",
    description:
      "Index 20237741 re-scanned inside Lecture Hall B perimeter (±14m). Face match validated.",
    timestamp: "10:01 AM",
  },
];

export default function SessionMonitorClientView({
  session,
  initialAttendance = [],
  initialAlerts = [],
}: SessionMonitorClientViewProps) {
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sessionStatus, setSessionStatus] = useState<"open" | "closed">(
    session.status
  );
  const [activeOverrideStudent, setActiveOverrideStudent] =
    useState<StudentTelemetry | null>(null);
  const [overrideReason, setOverrideReason] = useState(
    "Poor indoor lighting / camera glitched"
  );
  const [overrideNote, setOverrideNote] = useState("");
  const [extensionMinutes, setExtensionMinutes] = useState(11);
  const [notification, setNotification] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Map initial live attendance from Supabase if present
  const liveStudents: StudentTelemetry[] = (initialAttendance ?? []).map(
    (row) => ({
      id: row.id,
      time: new Date(row.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      name: row.student_name,
      indexNumber: row.student_index,
      distanceM: row.distance_m ?? 0,
      faceMatchScore:
        row.match_score == null
          ? 100
          : row.match_score <= 1
            ? Math.round(row.match_score * 100)
            : Math.round(row.match_score),
      status:
        row.status === "verified" || row.status === "manual"
          ? "verified"
          : "low_liveness",
      statusLabel: row.status === "manual" ? "Manual Override" : "Verified",
      initials: row.student_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      studentId: row.student_id,
    })
  );

  // Combine live stream with initial cohort members so interface always has roster
  const allStudents = [
    ...liveStudents,
    ...INITIAL_STUDENTS.filter(
      (init) =>
        !liveStudents.some((live) => live.indexNumber === init.indexNumber)
    ),
  ];

  // Map live alerts if present, or fallback to INITIAL_ALERTS
  const [alerts, setAlerts] = useState<SecurityAlert[]>(() => {
    if (initialAlerts && initialAlerts.length > 0) {
      return initialAlerts.map((a) => {
        const detailsObj = a.details as { message?: string } | null;
        const validTypes: SecurityAlert["type"][] = [
          "fake_identity",
          "out_of_bounds",
          "multi_index",
          "resolved",
        ];
        const alertType: SecurityAlert["type"] = validTypes.includes(
          a.type as SecurityAlert["type"]
        )
          ? (a.type as SecurityAlert["type"])
          : "out_of_bounds";

        const validSeverities: SecurityAlert["severity"][] = [
          "high",
          "medium",
          "critical",
          "resolved",
        ];
        const severity: SecurityAlert["severity"] = validSeverities.includes(
          a.severity as SecurityAlert["severity"]
        )
          ? (a.severity as SecurityAlert["severity"])
          : "medium";

        return {
          id: a.id,
          type: alertType,
          title: a.type.replace(/_/g, " "),
          severity,
          description:
            detailsObj?.message ||
            `Alert flagged for index ${a.claimed_index || "unknown"}`,
          studentName: a.claimed_index ? `Index ${a.claimed_index}` : undefined,
          studentIndex: a.claimed_index || undefined,
          timestamp: new Date(a.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
      });
    }
    return INITIAL_ALERTS;
  });

  // Filter students
  const filteredStudents = allStudents.filter((st) => {
    const matchesSearch =
      st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.indexNumber.includes(searchQuery);

    if (!matchesSearch) return false;
    if (filter === "verified") return st.status === "verified";
    if (filter === "flagged")
      return st.status === "low_liveness" || st.status === "out_of_bounds";
    if (filter === "rejected") return st.status === "rejected";
    if (filter === "pending") return st.status === "pending";
    return true;
  });

  function handleConfirmOverride() {
    if (!activeOverrideStudent) return;
    const formData = new FormData();
    formData.set("session_id", session.id);
    formData.set(
      "student_id",
      activeOverrideStudent.studentId || activeOverrideStudent.id
    );
    formData.set("reason", overrideReason);
    formData.set("note", overrideNote);

    startTransition(async () => {
      const res = await manualAttendanceOverrideAction(formData);
      if (res && res.error) {
        setNotification(`Override error: ${res.error}`);
      } else {
        setNotification(
          `Attendance verified manually for ${activeOverrideStudent.name} (${activeOverrideStudent.indexNumber}).`
        );
        setActiveOverrideStudent(null);
      }
      setTimeout(() => setNotification(null), 4000);
    });
  }

  function handleGrantExtension() {
    startTransition(async () => {
      const res = await extendSessionWindowAction(session.id, 5);
      if (res && res.error) {
        setNotification(`Extension error: ${res.error}`);
      } else {
        setExtensionMinutes((prev) => prev + 5);
        setNotification("Granted +5 minute check-in window extension.");
      }
      setTimeout(() => setNotification(null), 4000);
    });
  }

  function handleEndSession() {
    if (!confirm("Are you sure you want to end this attendance session early?")) {
      return;
    }
    startTransition(async () => {
      const res = await closeSessionAction(session.id);
      if (res && res.error) {
        setNotification(`Error ending session: ${res.error}`);
      } else {
        setSessionStatus("closed");
        setNotification("Attendance session ended.");
      }
      setTimeout(() => setNotification(null), 4000);
    });
  }

  function handleDismissAlert(alertId: string) {
    startTransition(async () => {
      await dismissAlertAction(alertId, session.id);
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      setNotification("Security alert dismissed.");
      setTimeout(() => setNotification(null), 3000);
    });
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
          {/* Top Context & Live Session Hero Banner */}
          <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container-high flex flex-col gap-4">
            {/* Breadcrumb & System State Indicator */}
            <div className="flex flex-wrap items-center justify-between gap-3">
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
                <span className="text-primary font-semibold">
                  {session.class_code} · Live Monitor
                </span>
              </nav>

              {/* Live badge & Countdown timer pill */}
              <div className="flex items-center gap-2.5">
                {sessionStatus === "open" ? (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-label-md text-label-md font-semibold border border-emerald-200 shadow-xs">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                    </span>
                    <span>LIVE SESSION</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container text-secondary font-label-md text-label-md font-semibold border border-surface-container-high shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-secondary"></span>
                    <span>SESSION CLOSED</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-primary font-label-md text-label-md font-bold shadow-inner border border-surface-container-highest">
                  <Clock className="h-4 w-4" />
                  <span>
                    Closes in{" "}
                    <span className="tabular-nums font-mono text-primary font-bold">
                      {extensionMinutes}:24
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Title and Session Metadata Row */}
            <div className="flex flex-wrap items-center justify-between gap-y-4 gap-x-6">
              <div className="flex flex-col gap-1 max-w-3xl">
                <h1 className="font-headline-md text-headline-md font-bold text-on-surface tracking-tight">
                  {session.class_code} · {session.class_title}
                </h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-body-md text-label-md text-secondary">
                  <span className="text-on-surface font-semibold">{session.title}</span>
                  <span className="text-outline-variant">•</span>
                  <span className="flex items-center gap-1">
                    <DoorOpen className="h-4 w-4 text-secondary" />
                    <span>{session.venue_name || "Lecture Hall B"}</span>
                  </span>
                  <span className="text-outline-variant">•</span>
                  <span className="flex items-center gap-1">
                    <Navigation className="h-4 w-4 text-primary" />
                    <span>Geo-fence ±{session.radius_m}m</span>
                  </span>
                  <span className="text-outline-variant">•</span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-secondary" />
                    <span>{session.student_count} Enrolled Students</span>
                  </span>
                </div>
              </div>

              {/* Top Action Buttons */}
              <div className="flex items-center gap-3">
                <Link
                  href={`/sessions/${session.id}/qr`}
                  className="h-11 px-4 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-label-lg text-label-md font-semibold flex items-center gap-2 transition-all shadow-xs border border-surface-container-high cursor-pointer"
                >
                  <QrCode className="h-4 w-4 text-primary" />
                  <span>Project Fullscreen QR</span>
                </Link>
                <button
                  type="button"
                  onClick={handleEndSession}
                  disabled={isPending || sessionStatus === "closed"}
                  className="h-11 px-4 rounded-xl bg-surface-container-lowest hover:bg-error-container/40 text-error font-label-lg text-label-md font-semibold flex items-center gap-2 transition-all shadow-xs border border-error/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <StopCircle className="h-4 w-4" />
                  )}
                  <span>
                    {sessionStatus === "closed"
                      ? "Session Closed"
                      : "End Session Early"}
                  </span>
                </button>
              </div>
            </div>
          </section>

          {/* Feedback banner */}
          {notification && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-primary-container text-on-primary shadow-sm">
              <CheckCircle className="h-5 w-5 shrink-0" />
              <span className="font-label-md text-label-md font-medium">{notification}</span>
            </div>
          )}

          {/* TWO-COLUMN WORKSPACE: 8 COLS LEFT, 4 COLS RIGHT */}
          <div className="grid grid-cols-12 gap-6 items-start">
            {/* ── LEFT COLUMN (8 cols): TELEMETRY & CHECK-IN STREAM ── */}
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
              {/* Telemetry Quorum Summary & Status Banner */}
              <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container-high flex flex-col gap-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Radio className="h-5 w-5 text-primary" />
                    <h2 className="font-title-md text-title-md text-on-surface font-bold">
                      Attendance Verification Quorum
                    </h2>
                  </div>
                  <div className="flex items-center gap-1.5 font-caption text-caption text-secondary">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Telemetry Stream Active · WebSockets synced (2.4s latency)</span>
                  </div>
                </div>

                {/* Metric Bar & Radial Gauge Overview */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center bg-surface-container-low/70 rounded-xl p-4 border border-surface-container-high">
                  {/* Visual Circular Ring Counter */}
                  <div className="md:col-span-4 flex items-center gap-4">
                    <div className="relative w-20 h-20 shrink-0">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-surface-container-high"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3.5"
                        />
                        <path
                          className="text-primary"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeDasharray="73, 100"
                          strokeLinecap="round"
                          strokeWidth="3.5"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="font-title-lg text-title-lg text-primary font-bold leading-none">
                          73%
                        </span>
                        <span className="font-caption text-[11px] text-secondary font-medium">
                          Quorum
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <span className="font-headline-sm text-headline-sm text-on-surface font-bold leading-none">
                        38{" "}
                        <span className="font-title-md text-title-md text-secondary font-normal">
                          / {session.student_count}
                        </span>
                      </span>
                      <span className="font-label-md text-label-md text-secondary mt-1">
                        Verified Present
                      </span>
                      <span className="font-caption text-caption text-emerald-700 font-semibold mt-0.5">
                        Threshold met (60%)
                      </span>
                    </div>
                  </div>

                  {/* Breakdown Sub-Counters */}
                  <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="bg-surface-container-lowest p-3 rounded-xl flex flex-col shadow-xs border border-surface-container-high">
                      <div className="flex items-center justify-between text-emerald-600 mb-1">
                        <span className="font-caption text-caption font-semibold">Verified</span>
                        <CheckCircle className="h-4 w-4" />
                      </div>
                      <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                        38
                      </span>
                      <span className="font-caption text-caption text-secondary">In geo-bound</span>
                    </div>

                    <div className="bg-surface-container-lowest p-3 rounded-xl flex flex-col shadow-xs border border-surface-container-high">
                      <div className="flex items-center justify-between text-amber-600 mb-1">
                        <span className="font-caption text-caption font-semibold">Flagged</span>
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <span className="font-headline-sm text-headline-sm text-amber-700 font-bold">
                        3
                      </span>
                      <span className="font-caption text-caption text-secondary">Requires check</span>
                    </div>

                    <div className="bg-surface-container-lowest p-3 rounded-xl flex flex-col shadow-xs border border-surface-container-high">
                      <div className="flex items-center justify-between text-error mb-1">
                        <span className="font-caption text-caption font-semibold">Rejected</span>
                        <XCircle className="h-4 w-4" />
                      </div>
                      <span className="font-headline-sm text-headline-sm text-error font-bold">
                        1
                      </span>
                      <span className="font-caption text-caption text-secondary">Spoof attempt</span>
                    </div>

                    <div className="bg-surface-container-lowest p-3 rounded-xl flex flex-col shadow-xs border border-surface-container-high">
                      <div className="flex items-center justify-between text-secondary mb-1">
                        <span className="font-caption text-caption font-semibold">Awaiting</span>
                        <Hourglass className="h-4 w-4" />
                      </div>
                      <span className="font-headline-sm text-headline-sm text-secondary font-bold">
                        10
                      </span>
                      <span className="font-caption text-caption text-secondary">No attempt yet</span>
                    </div>
                  </div>
                </div>

                {/* Search and Quick Filter Chips */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFilter("all")}
                      className={`px-3.5 py-1.5 rounded-full font-label-md text-label-md font-semibold transition-all cursor-pointer ${
                        filter === "all"
                          ? "bg-primary text-on-primary shadow-sm"
                          : "bg-surface-container-low hover:bg-surface-container text-on-surface-variant"
                      }`}
                    >
                      All ({INITIAL_STUDENTS.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilter("verified")}
                      className={`px-3.5 py-1.5 rounded-full font-label-md text-label-md font-medium transition-all cursor-pointer ${
                        filter === "verified"
                          ? "bg-primary text-on-primary shadow-sm"
                          : "bg-surface-container-low hover:bg-surface-container text-on-surface-variant"
                      }`}
                    >
                      Verified (3)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilter("flagged")}
                      className={`px-3.5 py-1.5 rounded-full font-label-md text-label-md font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                        filter === "flagged"
                          ? "bg-amber-600 text-white shadow-sm"
                          : "bg-surface-container-low hover:bg-amber-100/60 text-amber-800"
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                      <span>Flagged (2)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilter("rejected")}
                      className={`px-3.5 py-1.5 rounded-full font-label-md text-label-md font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                        filter === "rejected"
                          ? "bg-error text-on-error shadow-sm"
                          : "bg-surface-container-low hover:bg-red-100/60 text-error"
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-error"></span>
                      <span>Rejected (1)</span>
                    </button>
                  </div>

                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline h-4 w-4" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter by name or index..."
                      className="w-full h-9 pl-9 pr-3 rounded-lg bg-surface-container-low border border-surface-container-high text-on-surface placeholder:text-outline font-body-md text-caption focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Real-Time Check-In Roster Table */}
              <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container-high overflow-visible relative">
                <div className="px-6 py-4 flex items-center justify-between bg-surface-container-low/60 border-b border-surface-container-high rounded-t-2xl">
                  <div className="flex items-center gap-2">
                    <h3 className="font-title-md text-title-md text-on-surface font-bold">
                      Live Check-in Roster
                    </h3>
                    <span className="text-caption font-caption text-secondary">
                      Sorted by latest verification timestamp
                    </span>
                  </div>
                  <span className="text-caption font-caption text-primary font-medium flex items-center gap-1">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Auto-refreshes continuously</span>
                  </span>
                </div>

                <div className="overflow-x-auto overflow-y-visible">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low text-secondary font-label-md text-caption uppercase tracking-wider border-b border-surface-container-high">
                        <th className="py-3 px-5 font-semibold">Time</th>
                        <th className="py-3 px-5 font-semibold">Student &amp; Index</th>
                        <th className="py-3 px-5 font-semibold">Distance</th>
                        <th className="py-3 px-5 font-semibold">Face Match</th>
                        <th className="py-3 px-5 font-semibold">Status</th>
                        <th className="py-3 px-5 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container-high">
                      {filteredStudents.map((st) => (
                        <tr
                          key={st.id}
                          className={`transition-colors relative ${
                            st.status === "low_liveness"
                              ? "bg-amber-50/40 hover:bg-amber-50/60"
                              : st.status === "rejected"
                              ? "bg-red-50/30 hover:bg-red-50/50"
                              : "hover:bg-surface-container-low/60"
                          }`}
                        >
                          <td className="py-3.5 px-5 font-mono text-caption text-secondary whitespace-nowrap">
                            {st.time}
                          </td>

                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold text-label-md shrink-0">
                                {st.initials || st.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-label-md text-label-md text-on-surface font-bold truncate">
                                  {st.name}
                                </span>
                                <span className="font-caption text-caption text-secondary font-mono">
                                  {st.indexNumber}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-5">
                            <span
                              className={`font-label-md text-label-md font-semibold flex items-center gap-1 ${
                                st.distanceM > session.radius_m
                                  ? "text-error font-bold"
                                  : "text-emerald-700"
                              }`}
                            >
                              <MapPin className="h-3.5 w-3.5" />
                              <span>{st.distanceM} m</span>
                            </span>
                          </td>

                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-2">
                              <div className="w-14 h-2 rounded-full bg-surface-container-highest overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    st.faceMatchScore >= 80
                                      ? "bg-emerald-600"
                                      : st.faceMatchScore >= 50
                                      ? "bg-amber-500"
                                      : "bg-error"
                                  }`}
                                  style={{ width: `${st.faceMatchScore}%` }}
                                ></div>
                              </div>
                              <span
                                className={`font-caption text-caption font-semibold ${
                                  st.faceMatchScore >= 80
                                    ? "text-emerald-700"
                                    : st.faceMatchScore >= 50
                                    ? "text-amber-700"
                                    : "text-error"
                                }`}
                              >
                                {st.faceMatchScore}%
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-5">
                            {st.status === "verified" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-caption text-caption font-semibold">
                                <CheckCircle className="h-3.5 w-3.5" />
                                <span>Verified</span>
                              </span>
                            )}
                            {st.status === "low_liveness" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-caption text-caption font-semibold">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                <span>Low Liveness</span>
                              </span>
                            )}
                            {st.status === "rejected" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-error font-caption text-caption font-semibold">
                                <XCircle className="h-3.5 w-3.5" />
                                <span>Rejected</span>
                              </span>
                            )}
                            {st.status === "out_of_bounds" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-caption text-caption font-semibold">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                <span>Out of Bounds</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-5 text-right relative">
                            {st.status === "low_liveness" ? (
                              <button
                                type="button"
                                onClick={() => setActiveOverrideStudent(st)}
                                className="px-3 py-1.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-medium shadow-xs hover:bg-primary-container transition-all active:scale-95 inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Edit className="h-3.5 w-3.5" />
                                <span>Mark present manually</span>
                              </button>
                            ) : st.status === "rejected" ? (
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => alert(`Details for ${st.name}`)}
                                  className="px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-caption font-semibold transition-colors cursor-pointer"
                                >
                                  View Details
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setActiveOverrideStudent(st)}
                                  className="px-2.5 py-1.5 rounded-lg bg-surface-container-low hover:bg-primary hover:text-on-primary text-primary font-label-md text-caption font-semibold transition-colors cursor-pointer"
                                >
                                  Override
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => alert(`Details for ${st.name}`)}
                                className="px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-caption font-semibold transition-colors cursor-pointer"
                              >
                                View Details
                              </button>
                            )}

                            {/* FLOATING MANUAL ATTENDANCE OVERRIDE POPOVER */}
                            {activeOverrideStudent?.id === st.id && (
                              <div className="absolute right-4 top-14 w-96 bg-surface-container-lowest rounded-2xl p-5 shadow-2xl z-30 text-left flex flex-col gap-3.5 border border-surface-container-high">
                                <div className="flex items-start justify-between">
                                  <div className="flex flex-col">
                                    <span className="font-title-md text-title-md text-on-surface font-bold">
                                      Manual Attendance Override
                                    </span>
                                    <span className="font-caption text-caption text-secondary">
                                      Student:{" "}
                                      <strong className="text-on-surface font-semibold">
                                        {activeOverrideStudent.name} (
                                        {activeOverrideStudent.indexNumber})
                                      </strong>
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setActiveOverrideStudent(null)}
                                    className="text-secondary hover:text-on-surface p-1 rounded-md hover:bg-surface-container transition-colors cursor-pointer"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>

                                <div className="p-3 rounded-xl bg-amber-50 text-amber-900 font-caption text-caption flex items-start gap-2 border border-amber-200">
                                  <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                                  <span>
                                    Biometric scanner reported partial face occlusion. Manual verification requires an auditable reason.
                                  </span>
                                </div>

                                <div className="flex flex-col gap-1">
                                  <label className="font-label-md text-caption text-secondary font-semibold">
                                    Reason for Override <span className="text-error">*</span>
                                  </label>
                                  <select
                                    value={overrideReason}
                                    onChange={(e) => setOverrideReason(e.target.value)}
                                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container-high text-on-surface font-body-md text-label-md focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                                  >
                                    <option>Poor indoor lighting / camera glitched</option>
                                    <option>Weak GPS signal in basement lab</option>
                                    <option>Student device camera broken (Visual check performed)</option>
                                    <option>Device battery died during session</option>
                                    <option>Other administrative exception</option>
                                  </select>
                                </div>

                                <div className="flex flex-col gap-1">
                                  <label className="font-label-md text-caption text-secondary font-semibold">
                                    Lecturer Note (Optional)
                                  </label>
                                  <textarea
                                    value={overrideNote}
                                    onChange={(e) => setOverrideNote(e.target.value)}
                                    placeholder="Student is physically seated in Row 4, verified with student ID card."
                                    rows={2}
                                    className="w-full p-2.5 rounded-xl bg-surface-container-low border border-surface-container-high text-on-surface placeholder:text-outline font-body-md text-caption focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                                  ></textarea>
                                </div>

                                <label className="flex items-center gap-2 cursor-pointer pt-0.5">
                                  <input
                                    type="checkbox"
                                    defaultChecked
                                    className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
                                  />
                                  <span className="font-caption text-caption text-on-surface">
                                    Log lecturer manual override for faculty audit trail
                                  </span>
                                </label>

                                <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-container-high">
                                  <button
                                    type="button"
                                    onClick={() => setActiveOverrideStudent(null)}
                                    className="px-3.5 py-1.5 rounded-lg text-secondary hover:bg-surface-container text-label-md font-medium transition-colors cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleConfirmOverride}
                                    disabled={isPending}
                                    className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
                                  >
                                    {isPending ? (
                                      <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Confirming…</span>
                                      </>
                                    ) : (
                                      <span>Confirm Present</span>
                                    )}
                                  </button>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Table pagination bar */}
                <div className="p-4 bg-surface-container-low/40 rounded-b-2xl border-t border-surface-container-high flex items-center justify-between text-caption font-caption text-secondary">
                  <span>Showing {filteredStudents.length} of 52 student telemetry streams</span>
                  <div className="flex items-center gap-1 font-label-md">
                    <button
                      type="button"
                      disabled
                      className="w-8 h-8 rounded-lg bg-surface-container-lowest text-on-surface flex items-center justify-center shadow-xs border border-surface-container-high disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="px-2 font-semibold text-primary">Page 1 of 9</span>
                    <button
                      type="button"
                      className="w-8 h-8 rounded-lg bg-surface-container-lowest text-on-surface flex items-center justify-center shadow-xs border border-surface-container-high hover:bg-surface-container transition-colors cursor-pointer"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN (4 cols): SECURITY & ANOMALY FEED ── */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
              {/* Live Security Panel */}
              <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container-high flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-error" />
                      <h2 className="font-title-lg text-title-lg text-on-surface font-bold">
                        Security &amp; Anomaly Feed
                      </h2>
                    </div>
                    <span className="font-caption text-caption text-secondary mt-0.5">
                      Real-time biometric, spoofing &amp; device alarms
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-full bg-error-container text-on-error-container font-label-md text-caption font-bold">
                      {alerts.filter((a) => a.severity !== "resolved").length} Unresolved
                    </span>
                    <button
                      type="button"
                      onClick={() => setSoundEnabled((v) => !v)}
                      title={soundEnabled ? "Mute sounds" : "Unmute sounds"}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-secondary hover:bg-surface-container transition-colors cursor-pointer"
                    >
                      {soundEnabled ? (
                        <Volume2 className="h-4 w-4" />
                      ) : (
                        <VolumeX className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Alert Cards Stack */}
                <div className="flex flex-col gap-3">
                  {alerts.map((secAlert) => (
                    <div
                      key={secAlert.id}
                      className={`p-4 rounded-xl flex flex-col gap-2 border ${
                        secAlert.severity === "high" || secAlert.severity === "critical"
                          ? "bg-error-container/20 border-error/20"
                          : secAlert.severity === "medium"
                          ? "bg-amber-500/10 border-amber-300/40"
                          : "bg-surface-container-low border-surface-container-high opacity-85"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div
                          className={`flex items-center gap-1.5 font-title-md text-label-lg font-bold ${
                            secAlert.severity === "high" || secAlert.severity === "critical"
                              ? "text-error"
                              : secAlert.severity === "medium"
                              ? "text-amber-800"
                              : "text-emerald-800"
                          }`}
                        >
                          {secAlert.severity === "resolved" ? (
                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4" />
                          )}
                          <span>{secAlert.title}</span>
                        </div>
                        <span
                          className={`font-caption text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            secAlert.severity === "critical"
                              ? "bg-error-container text-error"
                              : secAlert.severity === "high"
                              ? "bg-error-container text-error"
                              : secAlert.severity === "medium"
                              ? "bg-amber-200 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {secAlert.severity}
                        </span>
                      </div>

                      <p className="font-caption text-caption text-on-surface leading-snug">
                        {secAlert.description}
                      </p>

                      <div
                        className={`flex items-center justify-between text-caption font-caption text-secondary pt-1 border-t ${
                          secAlert.severity === "resolved"
                            ? "border-surface-container-high"
                            : secAlert.severity === "medium"
                            ? "border-amber-200"
                            : "border-error-container/40"
                        }`}
                      >
                        {secAlert.studentName ? (
                          <span className="font-semibold text-on-surface">
                            {secAlert.studentName} ({secAlert.studentIndex})
                          </span>
                        ) : secAlert.extraTag ? (
                          <span className="font-mono text-[12px] text-error font-bold">
                            {secAlert.extraTag}
                          </span>
                        ) : (
                          <span></span>
                        )}
                        <span>{secAlert.timestamp}</span>
                      </div>

                      {/* Action buttons per alert */}
                      {secAlert.type === "fake_identity" && (
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            type="button"
                            onClick={() => window.alert("Biometric review modal")}
                            className="flex-1 h-9 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                            <span>Review Biometrics</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDismissAlert(secAlert.id)}
                            disabled={isPending}
                            className="px-3 h-9 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-secondary font-label-md text-label-md font-medium transition-colors border border-surface-container-high cursor-pointer disabled:opacity-50"
                          >
                            Dismiss
                          </button>
                        </div>
                      )}

                      {secAlert.type === "out_of_bounds" && (
                        <div className="mt-1">
                          <button
                            type="button"
                            onClick={() => window.alert("Reviewing location map")}
                            className="w-full h-9 rounded-lg bg-surface-container-lowest hover:bg-amber-100 text-amber-900 font-label-md text-label-md font-semibold transition-colors flex items-center justify-center gap-1 shadow-xs border border-amber-200 cursor-pointer"
                          >
                            <Map className="h-4 w-4" />
                            <span>Review Location Map</span>
                          </button>
                        </div>
                      )}

                      {secAlert.type === "multi_index" && (
                        <div className="mt-1">
                          <button
                            type="button"
                            onClick={() => window.alert("Device #iPhone15-88AF blocked")}
                            className="w-full h-9 rounded-lg bg-error hover:bg-red-700 text-on-error font-label-md text-label-md font-semibold transition-colors flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                          >
                            <Ban className="h-4 w-4" />
                            <span>Block Device &amp; Flag Students</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Session Adjustment Helper */}
              <div className="bg-surface-container-low rounded-2xl p-5 flex flex-col gap-3 shadow-xs border border-surface-container-high">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-surface-container-highest flex items-center justify-center text-primary shrink-0 mt-0.5">
                    <PlusCircle className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-lg text-label-md text-on-surface font-semibold">
                      Class-wide Grace Period
                    </span>
                    <p className="font-caption text-caption text-secondary leading-snug mt-0.5">
                      Heavy lobby traffic or bad weather? Extend the self check-in window without restarting the session.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGrantExtension}
                  disabled={isPending}
                  className="w-full h-11 rounded-xl bg-surface-container-lowest hover:bg-surface-container text-primary font-label-md text-label-md font-bold shadow-xs border border-surface-container-high transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <PlusCircle className="h-4 w-4" />
                  )}
                  <span>Grant +5 Min Check-in Extension</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
