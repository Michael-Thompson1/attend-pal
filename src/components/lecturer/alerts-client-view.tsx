"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  School,
  CalendarClock,
  BellRing,
  BarChart2,
  Settings,
  Search,
  Bell,
  User,
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

// ─── Types ─────────────────────────────────────────────────────────────────

type AlertSeverity = "high" | "medium" | "low";
type AlertStatus = "new" | "inspecting" | "reviewed" | "dismissed";
type AlertType =
  | "fake_identity"
  | "out_of_bounds"
  | "device_reuse"
  | "liveness_fail"
  | "window_cutoff";

interface DemoAlert {
  id: string;
  anomId: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  studentName: string;
  studentIndex: string;
  sessionCode: string;
  sessionHall: string;
  loggedTime: string;
  loggedRelative: string;
  keyMetric: string;
  description: string;
}

// ─── Demo Data ──────────────────────────────────────────────────────────────

const DEMO_ALERTS: DemoAlert[] = [
  {
    id: "1",
    anomId: "ANOM-8831",
    type: "fake_identity",
    severity: "high",
    status: "inspecting",
    studentName: "Daniel Osei",
    studentIndex: "20231045",
    sessionCode: "INF212",
    sessionHall: "Lecture Hall B",
    loggedTime: "10:03 AM",
    loggedRelative: "8m ago",
    keyMetric: "18% Match",
    description: "Fake identity attempt",
  },
  {
    id: "2",
    anomId: "ANOM-8832",
    type: "out_of_bounds",
    severity: "medium",
    status: "new",
    studentName: "Ama Mensah",
    studentIndex: "20238819",
    sessionCode: "INF212",
    sessionHall: "Lecture Hall B",
    loggedTime: "10:07 AM",
    loggedRelative: "4m ago",
    keyMetric: "340 m away",
    description: "Out of bounds (340m)",
  },
  {
    id: "3",
    anomId: "ANOM-8833",
    type: "device_reuse",
    severity: "high",
    status: "new",
    studentName: "Yaw Asamoah",
    studentIndex: "20237741",
    sessionCode: "INF212",
    sessionHall: "Lecture Hall B",
    loggedTime: "09:59 AM",
    loggedRelative: "12m ago",
    keyMetric: "3 accts / 45s",
    description: "Device fingerprint reuse (3 indices)",
  },
  {
    id: "4",
    anomId: "ANOM-8834",
    type: "liveness_fail",
    severity: "high",
    status: "reviewed",
    studentName: "Kofi Boateng",
    studentIndex: "20230912",
    sessionCode: "INF212",
    sessionHall: "Lecture Hall B",
    loggedTime: "09:55 AM",
    loggedRelative: "16m ago",
    keyMetric: "Screen Replay",
    description: "Liveness challenge fail (Spoof test)",
  },
  {
    id: "5",
    anomId: "ANOM-8835",
    type: "out_of_bounds",
    severity: "medium",
    status: "dismissed",
    studentName: "Grace Adjei",
    studentIndex: "20235411",
    sessionCode: "INF212",
    sessionHall: "Lecture Hall B",
    loggedTime: "09:51 AM",
    loggedRelative: "20m ago",
    keyMetric: "820 m away",
    description: "Out of bounds (820m)",
  },
  {
    id: "6",
    anomId: "ANOM-8836",
    type: "window_cutoff",
    severity: "low",
    status: "reviewed",
    studentName: "Emmanuel Appiah",
    studentIndex: "20234190",
    sessionCode: "INF212",
    sessionHall: "Lecture Hall B",
    loggedTime: "09:47 AM",
    loggedRelative: "24m ago",
    keyMetric: "+18m late",
    description: "Window cutoff (Exceeded 15m)",
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  if (severity === "high") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-caption text-caption font-semibold">
        <ShieldAlert className="w-3.5 h-3.5 text-error" />
        <span>High</span>
      </span>
    );
  }
  if (severity === "medium") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-caption text-caption font-semibold">
        <MapPinOff className="w-3.5 h-3.5 text-secondary" />
        <span>Medium</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-caption text-caption font-semibold">
      <Clock className="w-3.5 h-3.5 text-secondary" />
      <span>Low</span>
    </span>
  );
}

function StatusBadge({ status }: { status: AlertStatus }) {
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

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AlertsClientView() {
  const [selectedAlert, setSelectedAlert] = useState<DemoAlert | null>(
    DEMO_ALERTS[0]
  );
  const [selfieRevealed, setSelfieRevealed] = useState(false);
  const [filterChip, setFilterChip] = useState<string>("all");

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { label: "Classes", icon: School, path: "/classes" },
    { label: "Sessions", icon: CalendarClock, path: "/sessions/new" },
    { label: "Alerts", icon: BellRing, path: "/alerts", active: true, badge: 3 },
    { label: "Reports", icon: BarChart2, path: "/reports" },
    { label: "Settings", icon: Settings, path: "/settings" },
  ];

  const filterChips = [
    { key: "all", label: "All Alerts", count: 14 },
    { key: "fake_identity", label: "Fake identity", count: 4, color: "error" },
    { key: "out_of_bounds", label: "Out of bounds", count: 6, color: "secondary" },
    { key: "device_reuse", label: "Multiple indices on one device", count: 3, color: "error" },
    { key: "window_cutoff", label: "Window cutoff", count: 1, color: "neutral" },
  ];

  return (
    <div className="flex min-h-screen bg-surface font-body-md text-on-surface antialiased">
      {/* ── Sidebar ── */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex flex-col justify-between">
        <div className="flex flex-col flex-1">
          {/* Logo */}
          <div className="h-16 px-space-lg flex items-center gap-space-sm">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-sm">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-title-lg text-title-lg text-primary tracking-tight block leading-none">
                Attend Pal
              </span>
              <span className="font-caption text-caption text-secondary block mt-0.5">
                Verification Portal
              </span>
            </div>
          </div>

          {/* Nav */}
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
                  {item.badge && (
                    <span className="px-2 py-0.5 bg-error text-on-error rounded-full font-caption text-caption leading-tight shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Affiliation */}
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
            <div className="relative flex items-center w-full">
              <Search className="text-secondary absolute left-3 pointer-events-none w-5 h-5" />
              <input
                type="search"
                placeholder="Search students, course codes, sessions..."
                className="w-full h-10 pl-10 pr-4 bg-surface-container-low text-on-surface font-body-md text-body-md rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all placeholder:text-secondary"
              />
            </div>
          </div>
          <div className="flex items-center gap-space-md">
            <button
              type="button"
              className="relative w-10 h-10 rounded-xl flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-all"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-error ring-2 ring-surface-container-lowest" />
            </button>
            <div className="h-8 w-px bg-surface-container-high" />
            <div className="flex items-center gap-space-sm pl-space-xs">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <User className="text-on-primary w-4 h-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-label-md text-label-md text-on-surface font-semibold leading-tight">
                  Dr. Kwame Mensah
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

            {/* Breadcrumb */}
            <div className="flex flex-col gap-space-xs mb-space-md">
              <div className="flex items-center gap-2 font-caption text-caption text-secondary">
                <span>Academic Portal</span>
                <ChevronRight className="w-3.5 h-3.5" />
                <span>Alerts Centre</span>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="font-medium text-on-surface">Security &amp; Anomaly Logs</span>
              </div>

              {/* Page Title Row */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md mt-1">
                <div className="flex items-center gap-space-md flex-wrap">
                  <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                    Alerts &amp; Discrepancies
                  </h1>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-error-container text-on-error-container font-label-md text-label-md font-semibold shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-error animate-ping" />
                    <span>4 Unresolved Flags</span>
                  </div>
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
                    className="w-10 h-10 rounded-xl bg-surface-container-lowest text-on-surface-variant flex items-center justify-center shadow-sm hover:bg-surface-container-low transition-all"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Chips Bar */}
            <div className="flex items-center gap-2.5 overflow-x-auto pb-2 mb-space-sm">
              {filterChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => setFilterChip(chip.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full font-label-md text-label-md shadow-sm shrink-0 transition-all ${
                    filterChip === chip.key
                      ? "bg-primary-container text-on-primary"
                      : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low"
                  }`}
                >
                  {chip.key === "fake_identity" && (
                    <AlertTriangle className="w-4 h-4 text-error" />
                  )}
                  {chip.key === "out_of_bounds" && (
                    <MapPinOff className="w-4 h-4 text-secondary" />
                  )}
                  {chip.key === "device_reuse" && (
                    <Smartphone className="w-4 h-4 text-error" />
                  )}
                  {chip.key === "window_cutoff" && (
                    <Clock className="w-4 h-4 text-secondary" />
                  )}
                  <span>{chip.label}</span>
                  <span
                    className={`px-1.5 rounded-full font-caption text-caption font-semibold ${
                      filterChip === chip.key
                        ? "bg-white/20 text-on-primary"
                        : chip.color === "error"
                        ? "bg-error-container text-on-error-container"
                        : chip.color === "secondary"
                        ? "bg-secondary-container text-on-secondary-container"
                        : "bg-surface-container-high text-on-surface"
                    }`}
                  >
                    {chip.count}
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
                  placeholder="Filter by student name, index, or device MAC..."
                  className="w-full h-11 pl-10 pr-4 bg-surface-container-low text-on-surface font-body-md text-body-md rounded-lg focus:outline-none focus:bg-surface-container-lowest transition-all placeholder:text-secondary"
                />
              </div>
              <div className="lg:col-span-7 flex flex-wrap sm:flex-nowrap items-center gap-space-xs">
                <div className="relative flex-1 min-w-[170px]">
                  <select className="w-full h-11 pl-3 pr-8 bg-surface-container-low text-on-surface font-label-md text-label-md rounded-lg appearance-none cursor-pointer focus:outline-none">
                    <option>INF212 · Lecture 14 (Active)</option>
                    <option>INF208 · Algorithms Lab</option>
                    <option>CS304 · Database Systems</option>
                    <option>All Current Sessions</option>
                  </select>
                  <ArrowUpDown className="text-secondary absolute right-2.5 top-3 pointer-events-none w-4 h-4" />
                </div>
                <div className="relative flex-1 min-w-[150px]">
                  <select className="w-full h-11 pl-3 pr-8 bg-surface-container-low text-on-surface font-label-md text-label-md rounded-lg appearance-none cursor-pointer focus:outline-none">
                    <option>Today, 24 Oct 2024</option>
                    <option>Yesterday, 23 Oct</option>
                    <option>Past 7 days</option>
                    <option>Custom range...</option>
                  </select>
                  <ArrowUpDown className="text-secondary absolute right-2.5 top-3 pointer-events-none w-4 h-4" />
                </div>
                <div className="relative flex-1 min-w-[130px]">
                  <select className="w-full h-11 pl-3 pr-8 bg-surface-container-low text-on-surface font-label-md text-label-md rounded-lg appearance-none cursor-pointer focus:outline-none">
                    <option>All Severities</option>
                    <option>High Severity only</option>
                    <option>Medium Severity</option>
                    <option>Low / Informational</option>
                  </select>
                  <ArrowUpDown className="text-secondary absolute right-2.5 top-3 pointer-events-none w-4 h-4" />
                </div>
                <button
                  type="button"
                  title="Reset filters"
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
                {/* Table Header Status Bar */}
                <div className="p-space-md flex items-center justify-between bg-surface-container-low">
                  <div className="flex items-center gap-space-xs">
                    <ShieldAlert className="text-primary w-5 h-5" />
                    <span className="font-title-md text-title-md text-on-surface font-semibold">
                      Live Anomaly Stream
                    </span>
                    <span className="ml-2 font-caption text-caption text-secondary">
                      Synchronized with Hall B Beacon • Realtime
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-caption text-caption text-secondary">
                      Auto-purge in: 6d 21h
                    </span>
                  </div>
                </div>

                {/* Table */}
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container text-on-surface-variant font-label-md text-label-md">
                        <th className="py-3 px-4 font-semibold">Severity</th>
                        <th className="py-3 px-4 font-semibold">Anomaly &amp; Student</th>
                        <th className="py-3 px-4 font-semibold">Session / Hall</th>
                        <th className="py-3 px-4 font-semibold">Logged</th>
                        <th className="py-3 px-4 font-semibold">Key Metric</th>
                        <th className="py-3 px-4 font-semibold text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container-low text-on-surface font-body-md text-body-md">
                      {DEMO_ALERTS.map((secAlert) => (
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
                                {secAlert.description}
                              </span>
                              <div className="flex items-center gap-1 font-caption text-caption text-secondary mt-0.5">
                                <span className="font-semibold text-on-surface">
                                  {secAlert.studentName}
                                </span>
                                <span>•</span>
                                <span>Index: {secAlert.studentIndex}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 align-top">
                            <div className="flex flex-col">
                              <span className="font-label-md text-label-md text-on-surface">
                                {secAlert.sessionCode}
                              </span>
                              <span className="font-caption text-caption text-secondary">
                                {secAlert.sessionHall}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 align-top">
                            <div className="flex flex-col">
                              <span className="font-label-md text-label-md text-on-surface">
                                {secAlert.loggedTime}
                              </span>
                              <span
                                className={`font-caption text-caption font-medium ${
                                  secAlert.status === "new" || secAlert.status === "inspecting"
                                    ? "text-error"
                                    : "text-secondary"
                                }`}
                              >
                                {secAlert.loggedRelative}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 align-top">
                            <span
                              className={`inline-flex items-center font-label-md text-label-md font-bold ${
                                secAlert.severity === "high" ? "text-error" : "text-secondary"
                              }`}
                            >
                              {secAlert.keyMetric}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 align-top text-right">
                            <StatusBadge status={secAlert.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Footer */}
                <div className="px-space-md py-space-sm bg-surface-container-lowest flex items-center justify-between font-caption text-caption text-secondary">
                  <span>Showing 1 to 6 of 14 logged anomalies</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low disabled:opacity-40"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      className="w-8 h-8 rounded-lg bg-primary-container text-on-primary font-bold flex items-center justify-center shadow-xs"
                    >
                      1
                    </button>
                    <button
                      type="button"
                      className="w-8 h-8 rounded-lg text-on-surface-variant hover:bg-surface-container-low flex items-center justify-center"
                    >
                      2
                    </button>
                    <button
                      type="button"
                      className="w-8 h-8 rounded-lg text-on-surface-variant hover:bg-surface-container-low flex items-center justify-center"
                    >
                      3
                    </button>
                    <button
                      type="button"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low"
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
                          Critical Security
                        </span>
                        <span className="font-caption text-caption text-secondary">
                          ID #{selectedAlert.anomId}
                        </span>
                      </div>
                      <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold tracking-tight">
                        Incident Review: {selectedAlert.description}
                      </h2>
                      <p className="font-caption text-caption text-secondary mt-0.5">
                        Detected during biometric check-in for {selectedAlert.sessionCode} • Lecture 14
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
                    {/* Anomaly Banner */}
                    <div className="p-space-md rounded-xl bg-error-container text-on-error-container flex items-start gap-space-sm shadow-xs">
                      <AlertTriangle className="text-error w-6 h-6 shrink-0 mt-0.5" />
                      <div className="flex flex-col text-sm leading-snug">
                        <span className="font-title-md text-title-md font-bold text-on-error-container">
                          Liveness Check Failed
                        </span>
                        <p className="font-caption text-caption mt-1 text-on-error-container/90">
                          Static 2D image presented instead of interactive 3D selfie. Blink sequence failed 3 consecutive times with zero depth vector fluctuation.
                        </p>
                      </div>
                    </div>

                    {/* Biometric Comparison */}
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
                            <span>Submitted Selfie</span>
                          </span>
                          <div className="relative w-full h-44 rounded-lg overflow-hidden bg-surface-container">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBfXwYix0f8CVf_ozGRfg72XoVRlXN32J9H0PJYVbId69mHX5M6QIK_ZK_3qD4f97XZeXcUUTVF2MT2s6DYIcMUlYcw3--67RSTZCESCI1sNZKqyVV27lQlyceArHsk54t3YZl7bkTTSD8EG6UhBtLaOBkvwYkK_p3UAOtuvESkic9wp7wJA7nl58p7n-PXLU90r4JwA4JWW5pp_kmwlR0gcbKvcn1_8FFSF7gu0cU"
                              alt="Submitted selfie (privacy masked)"
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
                                  <span>Reveal Selfie</span>
                                </button>
                                <span className="font-caption text-caption text-white mt-1.5 drop-shadow-sm">
                                  Privacy Mask Active
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col mt-2 font-caption text-caption text-secondary">
                            <span className="text-on-surface font-medium">10:03:14 AM • Front 12MP</span>
                            <span className="text-[11px] text-error font-medium">Flag: Liveness 0.04 (Fail)</span>
                          </div>
                        </div>

                        {/* Registry Photo */}
                        <div className="flex flex-col p-2.5 rounded-xl bg-surface-container-low shadow-sm overflow-hidden">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-caption text-caption font-semibold text-primary flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Registry Photo</span>
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-bold">
                              2024/25
                            </span>
                          </div>
                          <div className="w-full h-44 rounded-lg overflow-hidden bg-surface-container">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBB7b_bXnnx47tlktzev3rEnyba-rrJw2fxLn7TYyAzi9ArJG2eEPFdZE53Yb22lxmLO3v6rdri7MYLAyTAESNJe-BIBkU0iOvAReH8I_50VtR44R5J2zzT3lE60HTFF2gu94ZFD8mYyKSNRqgUZa9myDmHlDfE9ykAjD0X9s_zmcGK_DnSE6d4LP29qVPVXhMozPsIeqbMnm0gqBvKzOQCHMEt8S5KnQyqCHKzh8w"
                              alt="Registry ID photo of Daniel Osei"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex flex-col mt-2 font-caption text-caption text-secondary">
                            <span className="text-on-surface font-medium truncate">
                              {selectedAlert.studentName} • {selectedAlert.studentIndex}
                            </span>
                            <span className="text-[11px] text-on-surface-variant">
                              BSc Information Tech (L200)
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Match Score */}
                      <div className="p-space-sm rounded-xl bg-surface-container-low flex flex-col gap-2 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-label-md text-label-md text-on-surface font-semibold">
                            Biometric Vector Similarity
                          </span>
                          <span className="font-title-lg text-title-lg font-bold text-error">
                            18% Match
                          </span>
                        </div>
                        <div className="w-full h-3 rounded-full bg-surface-container-high overflow-hidden relative">
                          <div className="h-full bg-error rounded-full" style={{ width: "18%" }} />
                          <div
                            className="absolute top-0 bottom-0 left-[70%] w-0.5 bg-on-surface/40 z-10"
                            title="Approval Threshold (70%)"
                          />
                        </div>
                        <div className="flex items-center justify-between font-caption text-caption text-secondary">
                          <span>Severe mismatch: Feature vectors deviate significantly.</span>
                          <span className="font-semibold text-on-surface">Min threshold: 70%</span>
                        </div>
                      </div>
                    </div>

                    {/* Telemetry & Security Context */}
                    <div className="flex flex-col gap-space-xs">
                      <span className="font-title-md text-title-md text-on-surface font-semibold mb-1">
                        Telemetry &amp; Security Context
                      </span>
                      <div className="grid grid-cols-1 gap-2 text-on-surface font-body-md text-body-md">
                        {/* Geolocation */}
                        <div className="p-space-sm rounded-xl bg-surface-container-low flex items-start gap-3 shadow-xs">
                          <div className="w-8 h-8 rounded-lg bg-surface-container-high text-primary flex items-center justify-center shrink-0">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col leading-tight min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-label-md text-label-md font-semibold text-on-surface">
                                Location &amp; Geofence
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-caption text-caption font-semibold">
                                Valid
                              </span>
                            </div>
                            <p className="font-caption text-caption text-secondary mt-1">
                              18 m from beacon (Within Hall B) • GPS Accuracy: ±3.2 m
                            </p>
                          </div>
                        </div>

                        {/* Device Fingerprint */}
                        <div className="p-space-sm rounded-xl bg-surface-container-low flex items-start gap-3 shadow-xs">
                          <div className="w-8 h-8 rounded-lg bg-error-container text-error flex items-center justify-center shrink-0">
                            <Smartphone className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col leading-tight min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-label-md text-label-md font-semibold text-on-surface">
                                Device Fingerprint
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-caption text-caption font-semibold">
                                Artifacts
                              </span>
                            </div>
                            <p className="font-caption text-caption text-secondary mt-1">
                              iPhone 15,3 (iOS 17.4) • IP: 10.14.88.21 • Screen replay artifact detected
                            </p>
                          </div>
                        </div>

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
                              {selectedAlert.studentName} • Index: {selectedAlert.studentIndex} • BSc Information Technology (Level 200)
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
                        className="flex-1 h-12 rounded-xl bg-primary-container text-on-primary font-label-lg text-label-lg font-semibold flex items-center justify-center gap-2 shadow-sm hover:opacity-95 active:scale-[0.98] transition-all"
                      >
                        <CheckCheck className="w-4 h-4" />
                        <span>Mark as reviewed</span>
                      </button>
                      <button
                        type="button"
                        title="Export incident packet as PDF"
                        className="w-12 h-12 rounded-xl bg-surface-container-lowest text-on-surface-variant flex items-center justify-center shadow-sm hover:bg-surface-container-high transition-all"
                      >
                        <FileText className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-space-sm pt-1">
                      <button
                        type="button"
                        className="flex-1 h-10 rounded-xl bg-surface-container-lowest text-on-surface font-label-md text-label-md flex items-center justify-center gap-1.5 shadow-sm hover:bg-surface-container-high transition-all"
                      >
                        <UserCheck className="w-4 h-4 text-primary" />
                        <span>Mark present manually</span>
                      </button>
                      <button
                        type="button"
                        className="h-10 px-4 rounded-xl text-error hover:bg-error-container/30 font-label-md text-label-md font-medium transition-all"
                      >
                        Dismiss alert
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Empty State */
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

        {/* Footer */}
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
