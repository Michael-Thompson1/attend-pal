"use client";

import { ProfilePhoto, useLecturerProfile } from "@/components/lecturer/profile-photo";

import { AttendMark } from "@/components/brand/attend-mark";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  School,
  CalendarClock,
  BellRing,
  BarChart2,
  Settings,
  Bell,
  Building2,
  Download,
  RefreshCw,
  Filter,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  MapPinOff,
  Smartphone,
  Clock,
  X,
  AlertTriangle,
  Camera,
  CheckCircle2,
  Eye,
  Lock,
  Badge,
  MapPin,
  CheckCheck,
  FileText,
  UserCheck,
  ArrowUpDown,
} from "lucide-react";
import type { AlertRow } from "@/app/(lecturer)/alerts/actions";
import HeaderSearch from "@/components/lecturer/header-search";
import {
  markAlertReviewedAction,
  dismissAlertFromCentreAction,
  markPresentFromAlertAction,
} from "@/app/(lecturer)/alerts/actions";

// ─── Props ──────────────────────────────────────────────────────────────────

interface SessionOption {
  id: string;
  code: string;
  title: string;
  status: string;
}

interface AlertsClientViewProps {
  initialAlerts: AlertRow[];
  sessionOptions: SessionOption[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function typeLabel(type: string): string {
  const labels: Record<string, string> = {
    fake_identity: "Fake identity attempt",
    out_of_bounds: "Out of bounds",
    device_reuse: "Device fingerprint reuse",
    liveness_fail: "Liveness challenge fail",
    window_cutoff: "Window cutoff",
  };
  return labels[type] ?? type;
}

function keyMetricLabel(alert: AlertRow): string {
  if (alert.match_score !== null && alert.type === "fake_identity") {
    return `${alert.match_score}% Match`;
  }
  if (alert.distance_m !== null && alert.type === "out_of_bounds") {
    return `${alert.distance_m} m away`;
  }
  if (alert.type === "device_reuse") return "Multi-acct / device";
  if (alert.type === "liveness_fail") return "Liveness fail";
  if (alert.type === "window_cutoff") return "Late check-in";
  return alert.details ?? "—";
}

function timeAgo(isoString: string): string {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function SeverityBadge({ severity }: { severity: string }) {
  if (severity === "high") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-caption text-caption font-semibold">
        <ShieldAlert className="w-3.5 h-3.5 text-error" />
        High
      </span>
    );
  }
  if (severity === "medium") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-caption text-caption font-semibold">
        <MapPinOff className="w-3.5 h-3.5 text-secondary" />
        Medium
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-caption text-caption font-semibold">
      <Clock className="w-3.5 h-3.5 text-secondary" />
      Low
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "inspecting") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary-container text-on-primary font-caption text-caption font-semibold">
        Inspecting
      </span>
    );
  }
  if (status === "new") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-error-container text-on-error-container font-caption text-caption font-semibold">
        New
      </span>
    );
  }
  if (status === "dismissed") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-surface-container text-secondary font-caption text-caption">
        Dismissed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-caption text-caption">
      Reviewed
    </span>
  );
}

// ─── Filter chip config ──────────────────────────────────────────────────────

const FILTER_CHIPS = [
  { key: "all", label: "All Alerts" },
  { key: "fake_identity", label: "Fake identity" },
  { key: "out_of_bounds", label: "Out of bounds" },
  { key: "device_reuse", label: "Multiple indices on one device" },
  { key: "window_cutoff", label: "Window cutoff" },
];

// ─── PAGES_SIZE ──────────────────────────────────────────────────────────────

const PAGE_SIZE = 6;

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AlertsClientView({
  initialAlerts,
  sessionOptions,
}: AlertsClientViewProps) {
  const { name: lecturerName } = useLecturerProfile();
  const isDemo = false;
  const alertSource = initialAlerts;
  const sessionSource = sessionOptions;

  const [alerts, setAlerts] = useState<AlertRow[]>(alertSource);
  const [selectedAlert, setSelectedAlert] = useState<AlertRow | null>(
    alertSource[0] ?? null
  );
  const [selfieRevealed, setSelfieRevealed] = useState(false);
  const [filterChip, setFilterChip] = useState("all");
  const [filterText, setFilterText] = useState("");
  const [filterSession, setFilterSession] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // ── Filtered list ──
  const filtered = alerts.filter((a) => {
    if (filterChip !== "all" && a.type !== filterChip) return false;
    if (filterSession !== "all" && a.session_id !== filterSession) return false;
    if (filterSeverity !== "all" && a.severity !== filterSeverity) return false;
    if (filterText) {
      const q = filterText.toLowerCase();
      if (
        !a.student_name.toLowerCase().includes(q) &&
        !a.student_index.toLowerCase().includes(q) &&
        !a.session_code.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const unresolvedCount = alerts.filter(
    (a) => a.status === "new" || a.status === "inspecting"
  ).length;

  // ── Chip counts ──
  const chipCount = (key: string) =>
    key === "all"
      ? alerts.length
      : alerts.filter((a) => a.type === key).length;

  // ── Action helpers ──
  function optimisticUpdate(id: string, newStatus: string) {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    );
    if (selectedAlert?.id === id)
      setSelectedAlert((prev) =>
        prev ? { ...prev, status: newStatus } : prev
      );
  }

  function handleMarkReviewed() {
    if (!selectedAlert || isDemo) return;
    optimisticUpdate(selectedAlert.id, "reviewed");
    startTransition(async () => {
      const res = await markAlertReviewedAction(selectedAlert.id);
      if ("error" in res && res.error) setActionError(res.error);
    });
  }

  function handleDismiss() {
    if (!selectedAlert || isDemo) return;
    optimisticUpdate(selectedAlert.id, "dismissed");
    startTransition(async () => {
      const res = await dismissAlertFromCentreAction(selectedAlert.id);
      if ("error" in res && res.error) setActionError(res.error);
    });
  }

  function handleMarkPresent() {
    if (!selectedAlert || isDemo) return;
    if (!selectedAlert.student_id) {
      setActionError("Cannot mark present: no student ID linked to this alert.");
      return;
    }
    optimisticUpdate(selectedAlert.id, "reviewed");
    startTransition(async () => {
      const res = await markPresentFromAlertAction(
        selectedAlert.id,
        selectedAlert.session_id,
        selectedAlert.student_id!
      );
      if ("error" in res && res.error) setActionError(res.error);
    });
  }

  // ── Nav ──
  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { label: "Classes", icon: School, path: "/classes" },
    { label: "Sessions", icon: CalendarClock, path: "/sessions/new" },
    {
      label: "Alerts",
      icon: BellRing,
      path: "/alerts",
      active: true,
      badge: unresolvedCount > 0 ? unresolvedCount : undefined,
    },
    { label: "Reports", icon: BarChart2, path: "/reports" },
    { label: "Settings", icon: Settings, path: "/settings" },
  ];

  return (
    <div className="flex min-h-screen bg-surface font-body-md text-on-surface antialiased">
      {/* ── Sidebar ── */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex flex-col justify-between">
        <div className="flex flex-col flex-1">
          <div className="h-16 px-space-lg flex items-center gap-space-sm">
            <AttendMark className="h-9 w-9 rounded-xl" />
            <div>
              <span className="font-title-lg text-title-lg text-primary tracking-tight block leading-none">
                Attend Pal
              </span>
              <span className="font-caption text-caption text-secondary block mt-0.5">
                Verification Portal
              </span>
            </div>
          </div>

          <div className="px-space-md py-space-sm">
            <div className="px-space-sm py-space-xs mb-space-xs font-caption text-caption text-secondary uppercase tracking-wider">
              Faculty Portal
            </div>
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={
                    item.active
                      ? "flex items-center justify-between px-space-md py-space-sm rounded-xl transition-all bg-primary-container text-on-primary font-bold shadow-sm"
                      : "flex items-center gap-space-sm px-space-md py-space-sm rounded-xl font-label-md text-label-md text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all"
                  }
                >
                  <div className="flex items-center gap-space-sm">
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="px-2 py-0.5 bg-error text-on-error rounded-full font-caption text-caption leading-tight shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <div className="p-space-md m-space-md bg-surface-container-low rounded-xl">
          <div className="flex items-center gap-space-xs text-secondary">
            <Building2 className="w-4 h-4" />
            <span className="font-caption text-caption font-semibold">Affiliation</span>
          </div>
          <p className="font-caption text-caption text-on-surface-variant mt-1 leading-snug">
            Faculty of Science, Main Campus
          </p>
        </div>
      </aside>

      {/* ── Main Wrapper ── */}
      <div className="pl-64 flex flex-col min-h-screen w-full">
        {/* ── Header ── */}
        <header className="fixed top-0 left-64 right-0 h-16 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 px-space-lg flex items-center justify-between">
          <div className="flex-1 max-w-md">
            <HeaderSearch variant="compact" />
          </div>
          <div className="flex items-center gap-space-md">
            <Link
              href="/alerts"
              aria-label="Notifications"
              className="relative w-10 h-10 rounded-xl flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-all"
            >
              <Bell className="w-5 h-5" />
              {unresolvedCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-error ring-2 ring-surface-container-lowest" />
              )}
            </Link>
            <div className="h-8 w-px bg-surface-container-high" />
            <div className="flex items-center gap-space-sm pl-space-xs">
              <ProfilePhoto variant="icon" />
              <div className="flex flex-col text-left">
                <span className="font-label-md text-label-md text-on-surface font-semibold leading-tight">
                  {lecturerName || "Lecturer"}
                </span>
                <span className="font-caption text-caption text-secondary leading-tight">
                  Senior Lecturer
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* ── Main Content ── */}
        <main className="flex-1 pt-16 w-full px-space-lg py-space-lg bg-surface">
          <div className="flex flex-col w-full">

            {/* Error banner */}
            {actionError && (
              <div className="mb-space-md p-space-sm rounded-xl bg-error-container text-on-error-container font-label-md text-label-md flex items-center justify-between gap-2">
                <span>{actionError}</span>
                <button type="button" onClick={() => setActionError(null)}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Demo notice */}
            {isDemo && (
              <div className="mb-space-md p-space-sm rounded-xl bg-surface-container text-on-surface-variant font-caption text-caption flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-secondary shrink-0" />
                <span>
                  Showing demo data — start a session and students check in to see real alerts here.
                </span>
              </div>
            )}

            {/* Breadcrumb + Title */}
            <div className="flex flex-col gap-space-xs mb-space-md">
              <div className="flex items-center gap-2 font-caption text-caption text-secondary">
                <span>Academic Portal</span>
                <ChevronRight className="w-3.5 h-3.5" />
                <span>Alerts Centre</span>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="font-medium text-on-surface">Security &amp; Anomaly Logs</span>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md mt-1">
                <div className="flex items-center gap-space-md flex-wrap">
                  <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                    Alerts &amp; Discrepancies
                  </h1>
                  {unresolvedCount > 0 && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-error-container text-on-error-container font-label-md text-label-md font-semibold shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-error animate-ping" />
                      <span>{unresolvedCount} Unresolved {unresolvedCount === 1 ? "Flag" : "Flags"}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-space-sm">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-lowest text-on-surface-variant font-label-md text-label-md shadow-sm hover:bg-surface-container-low transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Batch Export Audit Log</span>
                  </button>
                  <button
                    type="button"
                    title="Refresh anomaly stream"
                    onClick={() => window.location.reload()}
                    className="w-10 h-10 rounded-xl bg-surface-container-lowest text-on-surface-variant flex items-center justify-center shadow-sm hover:bg-surface-container-low transition-all"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-2.5 overflow-x-auto pb-2 mb-space-sm">
              {FILTER_CHIPS.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => { setFilterChip(chip.key); setPage(1); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full font-label-md text-label-md shadow-sm shrink-0 transition-all ${
                    filterChip === chip.key
                      ? "bg-primary-container text-on-primary"
                      : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low"
                  }`}
                >
                  {chip.key === "fake_identity" && <AlertTriangle className="w-4 h-4 text-error" />}
                  {chip.key === "out_of_bounds" && <MapPinOff className="w-4 h-4 text-secondary" />}
                  {chip.key === "device_reuse" && <Smartphone className="w-4 h-4 text-error" />}
                  {chip.key === "window_cutoff" && <Clock className="w-4 h-4 text-secondary" />}
                  <span>{chip.label}</span>
                  <span
                    className={`px-1.5 rounded-full font-caption text-caption font-semibold ${
                      filterChip === chip.key
                        ? "bg-white/20 text-on-primary"
                        : "bg-surface-container-high text-on-surface"
                    }`}
                  >
                    {chipCount(chip.key)}
                  </span>
                </button>
              ))}
            </div>

            {/* Controls Bar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-sm p-space-sm bg-surface-container-lowest rounded-xl shadow-sm mb-space-lg">
              <div className="lg:col-span-5 relative flex items-center">
                <Filter className="text-secondary absolute left-3.5 pointer-events-none w-5 h-5" />
                <input
                  type="text"
                  value={filterText}
                  onChange={(e) => { setFilterText(e.target.value); setPage(1); }}
                  placeholder="Filter by student name, index, or course code..."
                  className="w-full h-11 pl-10 pr-4 bg-surface-container-low text-on-surface font-body-md text-body-md rounded-lg focus:outline-none focus:bg-surface-container-lowest transition-all placeholder:text-secondary"
                />
              </div>
              <div className="lg:col-span-7 flex flex-wrap sm:flex-nowrap items-center gap-space-xs">
                <div className="relative flex-1 min-w-[170px]">
                  <select
                    className="w-full h-11 pl-3 pr-8 bg-surface-container-low text-on-surface font-label-md text-label-md rounded-lg appearance-none cursor-pointer focus:outline-none"
                    value={filterSession}
                    onChange={(e) => { setFilterSession(e.target.value); setPage(1); }}
                  >
                    <option value="all">All Sessions</option>
                    {sessionSource.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} · {s.title.slice(0, 24)}{s.status === "open" ? " (Active)" : ""}
                      </option>
                    ))}
                  </select>
                  <ArrowUpDown className="text-secondary absolute right-2.5 top-3 pointer-events-none w-4 h-4" />
                </div>
                <div className="relative flex-1 min-w-[130px]">
                  <select
                    className="w-full h-11 pl-3 pr-8 bg-surface-container-low text-on-surface font-label-md text-label-md rounded-lg appearance-none cursor-pointer focus:outline-none"
                    value={filterSeverity}
                    onChange={(e) => { setFilterSeverity(e.target.value); setPage(1); }}
                  >
                    <option value="all">All Severities</option>
                    <option value="high">High Severity only</option>
                    <option value="medium">Medium Severity</option>
                    <option value="low">Low / Informational</option>
                  </select>
                  <ArrowUpDown className="text-secondary absolute right-2.5 top-3 pointer-events-none w-4 h-4" />
                </div>
                <button
                  type="button"
                  title="Reset filters"
                  onClick={() => {
                    setFilterText("");
                    setFilterChip("all");
                    setFilterSession("all");
                    setFilterSeverity("all");
                    setPage(1);
                  }}
                  className="h-11 px-3 bg-surface-container-low text-secondary hover:text-on-surface rounded-lg flex items-center justify-center transition-all"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Two-Column Workspace */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">

              {/* Left: Alert Table */}
              <div className="xl:col-span-7 flex flex-col bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
                <div className="p-space-md flex items-center justify-between bg-surface-container-low">
                  <div className="flex items-center gap-space-xs">
                    <ShieldAlert className="text-primary w-5 h-5" />
                    <span className="font-title-md text-title-md text-on-surface font-semibold">
                      Live Anomaly Stream
                    </span>
                    <span className="ml-2 font-caption text-caption text-secondary hidden sm:block">
                      {isDemo ? "Demo Mode" : "Supabase Realtime"}
                    </span>
                  </div>
                  <span className="font-caption text-caption text-secondary">
                    Auto-purge in: 6d 21h
                  </span>
                </div>

                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container text-on-surface-variant font-label-md text-label-md">
                        <th className="py-3 px-4 font-semibold">Severity</th>
                        <th className="py-3 px-4 font-semibold">Anomaly &amp; Student</th>
                        <th className="py-3 px-4 font-semibold">Session</th>
                        <th className="py-3 px-4 font-semibold">Logged</th>
                        <th className="py-3 px-4 font-semibold">Key Metric</th>
                        <th className="py-3 px-4 font-semibold text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container-low text-on-surface font-body-md text-body-md">
                      {paged.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center font-caption text-caption text-secondary">
                            No alerts match the current filters.
                          </td>
                        </tr>
                      ) : (
                        paged.map((secAlert) => (
                          <tr
                            key={secAlert.id}
                            onClick={() => {
                              setSelectedAlert(secAlert);
                              setSelfieRevealed(false);
                            }}
                            className={`cursor-pointer transition-all ${
                              selectedAlert?.id === secAlert.id
                                ? "bg-primary/5 hover:bg-primary/10"
                                : "hover:bg-surface-container-low"
                            }`}
                          >
                            <td className="py-3.5 px-4 align-top">
                              <SeverityBadge severity={secAlert.severity} />
                            </td>
                            <td className="py-3.5 px-4 align-top">
                              <div className="flex flex-col">
                                <span
                                  className={`font-label-md text-label-md font-semibold ${
                                    selectedAlert?.id === secAlert.id
                                      ? "text-primary"
                                      : "text-on-surface"
                                  }`}
                                >
                                  {typeLabel(secAlert.type)}
                                </span>
                                <div className="flex items-center gap-1 font-caption text-caption text-secondary mt-0.5">
                                  <span className="font-semibold text-on-surface">
                                    {secAlert.student_name}
                                  </span>
                                  <span>•</span>
                                  <span>Index: {secAlert.student_index}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 align-top">
                              <div className="flex flex-col">
                                <span className="font-label-md text-label-md text-on-surface">
                                  {secAlert.session_code}
                                </span>
                                <span className="font-caption text-caption text-secondary">
                                  {secAlert.venue_name}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 align-top">
                              <div className="flex flex-col">
                                <span className="font-label-md text-label-md text-on-surface">
                                  {new Date(secAlert.created_at).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                <span
                                  className={`font-caption text-caption font-medium ${
                                    secAlert.status === "new" || secAlert.status === "inspecting"
                                      ? "text-error"
                                      : "text-secondary"
                                  }`}
                                  suppressHydrationWarning
                                >
                                  {timeAgo(secAlert.created_at)}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 align-top">
                              <span
                                className={`inline-flex items-center font-label-md text-label-md font-bold ${
                                  secAlert.severity === "high" ? "text-error" : "text-secondary"
                                }`}
                              >
                                {keyMetricLabel(secAlert)}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 align-top text-right">
                              <StatusBadge status={secAlert.status} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-space-md py-space-sm bg-surface-container-lowest flex items-center justify-between font-caption text-caption text-secondary">
                  <span>
                    Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–
                    {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} anomalies
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low disabled:opacity-40"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-label-md text-label-md ${
                          p === page
                            ? "bg-primary-container text-on-primary font-bold shadow-xs"
                            : "text-on-surface-variant hover:bg-surface-container-low"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={page === totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low disabled:opacity-40"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: Detail Drawer */}
              {selectedAlert ? (
                <div className="xl:col-span-5 flex flex-col bg-surface-container-lowest rounded-xl shadow-md overflow-hidden relative">
                  {/* Drawer Header */}
                  <div className="p-space-md bg-surface-container-low flex items-start justify-between">
                    <div className="flex flex-col pr-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-full bg-error text-on-error font-caption text-caption font-bold tracking-wide uppercase">
                          {selectedAlert.severity === "high" ? "Critical Security" : "Security Alert"}
                        </span>
                        <span className="font-caption text-caption text-secondary">
                          ID #{selectedAlert.id.slice(0, 8).toUpperCase()}
                        </span>
                      </div>
                      <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold tracking-tight">
                        Incident Review: {typeLabel(selectedAlert.type)}
                      </h2>
                      <p className="font-caption text-caption text-secondary mt-0.5">
                        {selectedAlert.student_name} · {selectedAlert.session_code} · {selectedAlert.venue_name}
                      </p>
                    </div>
                    <button
                      type="button"
                      title="Close details pane"
                      onClick={() => setSelectedAlert(null)}
                      className="w-8 h-8 rounded-full bg-surface-container-lowest text-secondary hover:text-on-surface flex items-center justify-center shadow-xs transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Drawer Content */}
                  <div className="p-space-md flex flex-col gap-space-md max-h-[calc(100vh-250px)] overflow-y-auto">

                    {/* Alert Banner */}
                    <div className="p-space-md rounded-xl bg-error-container text-on-error-container flex items-start gap-space-sm shadow-xs">
                      <AlertTriangle className="text-error w-6 h-6 shrink-0 mt-0.5" />
                      <div className="flex flex-col text-sm leading-snug">
                        <span className="font-title-md text-title-md font-bold text-on-error-container">
                          {typeLabel(selectedAlert.type)}
                        </span>
                        <p className="font-caption text-caption mt-1 text-on-error-container/90">
                          {selectedAlert.details ??
                            "Anomaly flagged during automated check-in verification."}
                        </p>
                      </div>
                    </div>

                    {/* Biometric section only for identity/liveness alerts */}
                    {(selectedAlert.type === "fake_identity" ||
                      selectedAlert.type === "liveness_fail") && (
                      <div className="flex flex-col gap-space-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-title-md text-title-md text-on-surface font-semibold">
                            Biometric Comparison
                          </span>
                          <span className="font-caption text-caption text-secondary">
                            Facial Feature Cosine Vectoring
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-space-sm">
                          {/* Submitted Selfie */}
                          <div className="relative flex flex-col p-2.5 rounded-xl bg-surface-container-low shadow-sm overflow-hidden">
                            <span className="font-caption text-caption font-semibold text-error mb-1.5 flex items-center gap-1">
                              <Camera className="w-3.5 h-3.5" />
                              Submitted Selfie
                            </span>
                            <div className="relative w-full h-44 rounded-lg overflow-hidden bg-surface-container flex items-center justify-center">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBfXwYix0f8CVf_ozGRfg72XoVRlXN32J9H0PJYVbId69mHX5M6QIK_ZK_3qD4f97XZeXcUUTVF2MT2s6DYIcMUlYcw3--67RSTZCESCI1sNZKqyVV27lQlyceArHsk54t3YZl7bkTTSD8EG6UhBtLaOBkvwYkK_p3UAOtuvESkic9wp7wJA7nl58p7n-PXLU90r4JwA4JWW5pp_kmwlR0gcbKvcn1_8FFSF7gu0cU"
                                alt="Submitted selfie"
                                className={`w-full h-full object-cover transition-all duration-300 ${selfieRevealed ? "" : "blur-md"}`}
                              />
                              {!selfieRevealed && (
                                <div className="absolute inset-0 bg-inverse-surface/30 backdrop-blur-sm flex flex-col items-center justify-center p-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => setSelfieRevealed(true)}
                                    className="px-3 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md font-semibold flex items-center gap-1.5 shadow-md hover:bg-surface-container-low transition-all"
                                  >
                                    <Eye className="w-4 h-4" />
                                    Reveal Selfie
                                  </button>
                                  <span className="font-caption text-caption text-white mt-1.5 drop-shadow-sm">
                                    Privacy Mask Active
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col mt-2 font-caption text-caption text-secondary">
                              <span className="text-on-surface font-medium">
                                {new Date(selectedAlert.created_at).toLocaleTimeString()} • Front 12MP
                              </span>
                              <span className="text-[11px] text-error font-medium">
                                Flag: Liveness {selectedAlert.match_score !== null ? `${selectedAlert.match_score}%` : "fail"}
                              </span>
                            </div>
                          </div>

                          {/* Registry Photo */}
                          <div className="flex flex-col p-2.5 rounded-xl bg-surface-container-low shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-caption text-caption font-semibold text-primary flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Registry Photo
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-bold">
                                2024/25
                              </span>
                            </div>
                            <div className="w-full h-44 rounded-lg overflow-hidden bg-surface-container">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBB7b_bXnnx47tlktzev3rEnyba-rrJw2fxLn7TYyAzi9ArJG2eEPFdZE53Yb22lxmLO3v6rdri7MYLAyTAESNJe-BIBkU0iOvAReH8I_50VtR44R5J2zzT3lE60HTFF2gu94ZFD8mYyKSNRqgUZa9myDmHlDfE9ykAjD0X9s_zmcGK_DnSE6d4LP29qVPVXhMozPsIeqbMnm0gqBvKzOQCHMEt8S5KnQyqCHKzh8w"
                                alt="Registry ID photo"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex flex-col mt-2 font-caption text-caption text-secondary">
                              <span className="text-on-surface font-medium truncate">
                                {selectedAlert.student_name} • {selectedAlert.student_index}
                              </span>
                              <span className="text-[11px] text-on-surface-variant">
                                BSc Information Tech
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Match Score */}
                        {selectedAlert.match_score !== null && (
                          <div className="p-space-sm rounded-xl bg-surface-container-low flex flex-col gap-2 shadow-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-label-md text-label-md text-on-surface font-semibold">
                                Biometric Vector Similarity
                              </span>
                              <span className="font-title-lg text-title-lg font-bold text-error">
                                {selectedAlert.match_score}% Match
                              </span>
                            </div>
                            <div className="w-full h-3 rounded-full bg-surface-container-high overflow-hidden relative">
                              <div
                                className="h-full bg-error rounded-full"
                                style={{ width: `${selectedAlert.match_score}%` }}
                              />
                              <div
                                className="absolute top-0 bottom-0 left-[70%] w-0.5 bg-on-surface/40 z-10"
                                title="Approval Threshold (70%)"
                              />
                            </div>
                            <div className="flex items-center justify-between font-caption text-caption text-secondary">
                              <span>Severe mismatch: Feature vectors deviate significantly.</span>
                              <span className="font-semibold text-on-surface">Min: 70%</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Telemetry Context */}
                    <div className="flex flex-col gap-space-xs">
                      <span className="font-title-md text-title-md text-on-surface font-semibold mb-1">
                        Telemetry &amp; Security Context
                      </span>
                      <div className="grid grid-cols-1 gap-2">
                        {/* Geolocation */}
                        {selectedAlert.distance_m !== null && (
                          <div className="p-space-sm rounded-xl bg-surface-container-low flex items-start gap-3 shadow-xs">
                            <div className="w-8 h-8 rounded-lg bg-surface-container-high text-primary flex items-center justify-center shrink-0">
                              <MapPin className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col leading-tight min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-label-md text-label-md font-semibold text-on-surface">
                                  Location &amp; Geofence
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-caption text-caption font-semibold">
                                  Out of bounds
                                </span>
                              </div>
                              <p className="font-caption text-caption text-secondary mt-1">
                                {selectedAlert.distance_m} m from beacon • Outside geofence radius
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Claimed Profile */}
                        <div className="p-space-sm rounded-xl bg-surface-container-low flex items-start gap-3 shadow-xs">
                          <div className="w-8 h-8 rounded-lg bg-surface-container-high text-secondary flex items-center justify-center shrink-0">
                            <Badge className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col leading-tight min-w-0 flex-1">
                            <span className="font-label-md text-label-md font-semibold text-on-surface">
                              Claimed Profile
                            </span>
                            <p className="font-caption text-caption text-secondary mt-1">
                              {selectedAlert.student_name} · Index: {selectedAlert.student_index}
                            </p>
                          </div>
                        </div>

                        {/* Session info */}
                        <div className="p-space-sm rounded-xl bg-surface-container-low flex items-start gap-3 shadow-xs">
                          <div className="w-8 h-8 rounded-lg bg-surface-container-high text-secondary flex items-center justify-center shrink-0">
                            <CalendarClock className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col leading-tight min-w-0 flex-1">
                            <span className="font-label-md text-label-md font-semibold text-on-surface">
                              Session
                            </span>
                            <p className="font-caption text-caption text-secondary mt-1">
                              {selectedAlert.session_code} · {selectedAlert.session_title || selectedAlert.venue_name}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Privacy Notice */}
                    <div className="p-space-sm rounded-xl bg-surface-container-low text-secondary flex items-start gap-2 shadow-xs">
                      <Lock className="text-secondary w-4 h-4 shrink-0 mt-0.5" />
                      <p className="font-caption text-caption leading-relaxed">
                        <span className="font-semibold text-on-surface">Institutional Privacy Note:</span>{" "}
                        Biometric captures are encrypted end-to-end and scheduled for automated deletion in 6 days 21 hours in compliance with the Ghana Data Protection Act (Act 843).
                      </p>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="p-space-md bg-surface-container-low flex flex-col gap-2 shadow-[0_-2px_8px_rgba(0,0,0,0.03)]">
                    <div className="flex items-center gap-space-sm">
                      <button
                        type="button"
                        onClick={handleMarkReviewed}
                        disabled={isPending || selectedAlert.status === "reviewed"}
                        className="flex-1 h-12 rounded-xl bg-primary-container text-on-primary font-label-lg text-label-lg font-semibold flex items-center justify-center gap-2 shadow-sm hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-60"
                      >
                        <CheckCheck className="w-4 h-4" />
                        <span>
                          {selectedAlert.status === "reviewed" ? "Reviewed ✓" : "Mark as reviewed"}
                        </span>
                      </button>
                      <button
                        type="button"
                        title="Export incident packet"
                        className="w-12 h-12 rounded-xl bg-surface-container-lowest text-on-surface-variant flex items-center justify-center shadow-sm hover:bg-surface-container-high transition-all"
                      >
                        <FileText className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-space-sm pt-1">
                      <button
                        type="button"
                        onClick={handleMarkPresent}
                        disabled={isPending || isDemo}
                        className="flex-1 h-10 rounded-xl bg-surface-container-lowest text-on-surface font-label-md text-label-md flex items-center justify-center gap-1.5 shadow-sm hover:bg-surface-container-high transition-all disabled:opacity-50"
                      >
                        <UserCheck className="w-4 h-4 text-primary" />
                        <span>Mark present manually</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleDismiss}
                        disabled={isPending || selectedAlert.status === "dismissed"}
                        className="h-10 px-4 rounded-xl text-error hover:bg-error-container/30 font-label-md text-label-md font-medium transition-all disabled:opacity-50"
                      >
                        {selectedAlert.status === "dismissed" ? "Dismissed" : "Dismiss alert"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="xl:col-span-5 flex flex-col items-center justify-center bg-surface-container-lowest rounded-xl shadow-sm p-space-xl text-center min-h-[320px]">
                  <ShieldAlert className="w-12 h-12 text-secondary mb-space-md" />
                  <span className="font-title-md text-title-md text-on-surface font-semibold">
                    Select an alert to inspect
                  </span>
                  <p className="font-caption text-caption text-secondary mt-1 max-w-xs">
                    Click any row in the anomaly stream table to open the full incident review panel.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>

        <footer className="w-full bg-surface-container-lowest py-space-md shadow-[0_-1px_6px_rgba(0,0,0,0.02)]">
          <div className="w-full px-space-lg flex items-center justify-between text-secondary font-caption text-caption">
            <span>© Attend Pal. Faculty of Science, Main Campus.</span>
            <span>Institutional Terminal v2.4.1 • Active Connection</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
