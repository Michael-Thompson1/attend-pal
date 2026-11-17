"use client";

import { ProfilePhoto, useLecturerProfile } from "@/components/lecturer/profile-photo";

import { AttendMark } from "@/components/brand/attend-mark";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  School,
  CalendarClock,
  BellRing,
  BarChart2,
  Settings,
  Building2,
  Search,
  Bell,
  FileSpreadsheet,
  FileText,
  Printer,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Filter,
  TrendingUp,
  CalendarCheck,
  AlertTriangle,
  Fingerprint,
  CheckCircle2,
  Info,
  History,
  MoreVertical,
  Mail,
  RefreshCw,
  AlertCircle,
  X,
  ShieldAlert,
} from "lucide-react";
import type {
  ClassOption,
  ClassReportData,
} from "@/app/(lecturer)/reports/actions";
import { getClassReportDataAction } from "@/app/(lecturer)/reports/actions";
import HeaderSearch from "@/components/lecturer/header-search";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface StudentReportItem {
  id: string;
  indexNumber: string;
  name: string;
  email: string;
  program: string;
  sessionsAttended: number;
  totalSessions: number;
  attendanceRate: number; // percentage, e.g. 92.8
  category: "exemplary" | "satisfactory" | "at-risk";
  statusBadge: "eligible" | "at-risk" | "barred" | "perfect";
}

interface ReportsClientViewProps {
  classes?: ClassOption[];
  initialReportData?: ClassReportData | null;
  openAlertCount?: number;
}

// ─── Initial Demo Data ──────────────────────────────────────────────────────

export default function ReportsClientView({
  classes: initialClasses = [],
  initialReportData = null,
  openAlertCount = 0,
}: ReportsClientViewProps) {
  const { name: lecturerName } = useLecturerProfile();
  const isDemo = false;
  const availableClasses = initialClasses;

  const [selectedClassId, setSelectedClassId] = useState<string>(
    initialReportData?.classId || availableClasses[0]?.id || ""
  );
  const [reportData, setReportData] = useState<ClassReportData | null>(
    initialReportData
  );
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "at-risk" | "satisfactory" | "exemplary">("all");
  const [selectedAuditPeriod] = useState("1 Sep 2024 – 24 Oct 2024");
  const [currentPage, setCurrentPage] = useState(1);
  const [noticeSentStudentId, setNoticeSentStudentId] = useState<string | null>(null);
  const [bulkNoticeSent, setBulkNoticeSent] = useState(false);

  // Determine current active student roster and metrics
  const students: StudentReportItem[] = useMemo(() => {
    return reportData?.studentRoster ?? [];
  }, [reportData]);

  const activeCourseCode =
    reportData?.classCode ||
    availableClasses.find((c) => c.id === selectedClassId)?.code ||
    "—";

  const activeCourseTitle =
    reportData?.classTitle ||
    availableClasses.find((c) => c.id === selectedClassId)?.title ||
    "No class selected";

  const averageAttendance = reportData?.averageAttendanceRate ?? 0;
  const totalSessionsHeld = reportData?.totalSessionsHeld ?? 0;
  const enrolledCount = reportData?.enrolledStudentsCount ?? students.length;
  const atRiskCount = reportData?.atRiskCount ?? students.filter((s) => s.category === "at-risk").length;
  const biometricRate = reportData?.biometricVerificationRate ?? 0;

  // Filter students based on activeTab and searchQuery
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesTab =
        activeTab === "all"
          ? true
          : activeTab === "at-risk"
          ? student.category === "at-risk"
          : activeTab === "satisfactory"
          ? student.category === "satisfactory"
          : student.category === "exemplary";

      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        student.name.toLowerCase().includes(query) ||
        student.indexNumber.toLowerCase().includes(query);

      return matchesTab && matchesSearch;
    });
  }, [students, activeTab, searchQuery]);

  const satisfactoryCount = students.filter((s) => s.category === "satisfactory").length;
  const exemplaryCount = students.filter((s) => s.category === "exemplary").length;

  // Change class and load data
  const handleClassChange = (newClassId: string) => {
    setSelectedClassId(newClassId);
    if (!isDemo && newClassId !== "demo-inf212") {
      startTransition(async () => {
        const data = await getClassReportDataAction(newClassId);
        if (data) {
          setReportData(data);
        }
      });
    }
  };

  // CSV Export Functionality
  const handleExportCSV = () => {
    const headers = [
      "Index Number",
      "Full Name",
      "Email",
      "Program",
      "Sessions Attended",
      "Total Sessions",
      "Attendance Rate (%)",
      "Status",
    ];
    const rows = students.map((s) => [
      s.indexNumber,
      `"${s.name}"`,
      s.email,
      `"${s.program}"`,
      s.sessionsAttended,
      s.totalSessions,
      s.attendanceRate,
      s.statusBadge,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `attend_pal_${activeCourseCode}_attendance_report.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleSendNotice = (studentId: string) => {
    setNoticeSentStudentId(studentId);
    setTimeout(() => {
      setNoticeSentStudentId(null);
    }, 3000);
  };

  const handleBulkWarning = () => {
    setBulkNoticeSent(true);
    setTimeout(() => {
      setBulkNoticeSent(false);
    }, 4000);
  };

  // Nav Items
  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { label: "Classes", icon: School, path: "/classes" },
    { label: "Sessions", icon: CalendarClock, path: "/sessions/new" },
    { label: "Alerts", icon: BellRing, path: "/alerts", badge: openAlertCount > 0 ? openAlertCount : undefined },
    { label: "Reports", icon: BarChart2, path: "/reports", active: true },
    { label: "Settings", icon: Settings, path: "/settings" },
  ];

  return (
    <div className="flex min-h-screen bg-surface font-body-md text-on-surface antialiased">
      {/* ── Sidebar ── */}
      <aside className="fixed left-0 top-0 hidden h-full w-64 flex-col justify-between bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 md:flex">
        <div className="flex flex-col flex-1">
          {/* Logo */}
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

          {/* Navigation */}
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

        {/* Affiliation Widget */}
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
      <div className="flex min-h-screen w-full min-w-0 flex-col md:pl-64">
        {/* Top Header */}
        <header className="fixed top-0 right-0 left-0 z-40 flex h-16 items-center justify-between bg-surface-container-lowest/90 px-space-lg shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl md:left-64">
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
              {openAlertCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-error ring-2 ring-surface-container-lowest" />
              )}
            </Link>
            <div className="hidden h-8 w-px bg-surface-container-high sm:block" />
            <div className="hidden items-center gap-space-sm pl-space-xs sm:flex">
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

        {/* ── Main Body ── */}
        <main className="flex-1 pt-16 w-full px-space-lg py-space-lg bg-surface">
          <div className="flex flex-col w-full gap-space-lg">

            {/* Notification alert on action */}
            {bulkNoticeSent && (
              <div className="p-space-sm rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-amber-700" />
                  <span className="font-label-md text-label-md">
                    Automated deficiency notices successfully queued for all {atRiskCount} at-risk students.
                  </span>
                </div>
                <button type="button" onClick={() => setBulkNoticeSent(false)}>
                  <X className="w-4 h-4 text-amber-700" />
                </button>
              </div>
            )}

            {/* Top Breadcrumb & Page Action Header */}
            <div className="flex flex-col gap-space-xs">
              <nav className="flex items-center gap-2 text-secondary font-caption text-caption">
                <span className="flex items-center gap-1">
                  <School className="w-4 h-4" />
                  Academic Portal
                </span>
                <ChevronRight className="w-3.5 h-3.5" />
                <span>Reports &amp; Analytics</span>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-on-surface font-medium">
                  {activeCourseCode} Course Attendance Audit
                </span>
              </nav>

              <div className="flex flex-wrap items-center justify-between gap-y-space-sm gap-x-space-md pt-1">
                <div>
                  <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                    Attendance Reports &amp; Analytics
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-fixed font-caption text-caption font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
                      {activeCourseCode} · {activeCourseTitle}
                    </span>
                    <span className="text-secondary font-caption text-caption">•</span>
                    <span className="text-secondary font-caption text-caption">
                      BSc Computer Science • Semester 2 (2024/2025) • {enrolledCount} Enrolled Students
                    </span>
                  </div>
                </div>

                {/* Header Action Buttons */}
                <div className="flex items-center gap-space-sm">
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="h-11 px-4 rounded-xl bg-surface-container-lowest text-secondary shadow-sm hover:bg-surface-container hover:text-on-surface flex items-center gap-2 transition-all font-label-md text-label-md"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="h-11 px-5 rounded-xl bg-primary-container text-on-primary shadow-sm hover:brightness-110 flex items-center gap-2 transition-all font-label-md text-label-md"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Export PDF Report</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    title="Print Audit Summary"
                    className="w-11 h-11 rounded-xl bg-surface-container-lowest text-secondary shadow-sm hover:bg-surface-container hover:text-on-surface flex items-center justify-center transition-all"
                  >
                    <Printer className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Primary Filter Bar Card */}
            <section className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-space-md items-center">
                {/* Course Selector */}
                <div className="lg:col-span-3 flex flex-col gap-1">
                  <label className="font-caption text-caption text-secondary uppercase font-semibold tracking-wider">
                    Course Cohort {isPending && <span className="text-primary normal-case font-normal">(Loading...)</span>}
                  </label>
                  <div className="relative">
                    <select
                      className="w-full h-11 pl-3 pr-9 bg-surface-container-low text-on-surface font-label-md text-label-md rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer disabled:opacity-50"
                      value={selectedClassId}
                      disabled={isPending}
                      onChange={(e) => handleClassChange(e.target.value)}
                    >
                      {availableClasses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.code} · {c.title}
                        </option>
                      ))}
                    </select>
                    <Filter className="text-secondary absolute right-3 top-3 pointer-events-none w-4 h-4" />
                  </div>
                </div>

                {/* Date Range Selector */}
                <div className="lg:col-span-3 flex flex-col gap-1">
                  <label className="font-caption text-caption text-secondary uppercase font-semibold tracking-wider">
                    Audit Timeline
                  </label>
                  <div className="relative flex items-center">
                    <Calendar className="text-secondary absolute left-3 pointer-events-none w-4 h-4" />
                    <button
                      type="button"
                      className="w-full h-11 pl-9 pr-3 bg-surface-container-low text-on-surface text-left font-label-md text-label-md rounded-xl hover:bg-surface-container transition-colors flex items-center justify-between"
                    >
                      <span className="truncate">{selectedAuditPeriod}</span>
                      <span className="font-caption text-caption text-secondary shrink-0 ml-1">8 Weeks</span>
                    </button>
                  </div>
                </div>

                {/* Cohort Standing Selector */}
                <div className="lg:col-span-3 flex flex-col gap-1">
                  <label className="font-caption text-caption text-secondary uppercase font-semibold tracking-wider">
                    Cohort Standing
                  </label>
                  <div className="relative">
                    <select
                      className="w-full h-11 pl-3 pr-9 bg-surface-container-low text-on-surface font-label-md text-label-md rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                      value={activeTab}
                      onChange={(e) => setActiveTab(e.target.value as "all" | "at-risk" | "satisfactory" | "exemplary")}
                    >
                      <option value="all">All Students ({students.length})</option>
                      <option value="at-risk">At-Risk: Under 75% ({atRiskCount})</option>
                      <option value="satisfactory">Good Standing: ≥75% ({satisfactoryCount + exemplaryCount})</option>
                    </select>
                    <Filter className="text-secondary absolute right-3 top-3 pointer-events-none w-4 h-4" />
                  </div>
                </div>

                {/* Search Input */}
                <div className="lg:col-span-3 flex flex-col gap-1">
                  <label className="font-caption text-caption text-secondary uppercase font-semibold tracking-wider">
                    Search Student
                  </label>
                  <div className="relative flex items-center">
                    <Search className="text-secondary absolute left-3 pointer-events-none w-4 h-4" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Name or index number..."
                      className="w-full h-11 pl-9 pr-8 bg-surface-container-low text-on-surface font-body-md text-body-md rounded-xl placeholder:text-secondary placeholder:text-label-md focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2 text-secondary hover:text-on-surface"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Summary KPI Cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
              {/* Card 1: Average Attendance */}
              <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md text-secondary">Average Attendance</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-display-lg text-display-lg text-on-surface font-bold">
                        {averageAttendance.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-surface-container-low text-primary flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 pt-3 flex items-center justify-between border-t border-surface-container">
                  <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    +3.2% vs Dept
                  </span>
                  <span className="font-caption text-caption text-secondary">Institutional target 75%</span>
                </div>
              </div>

              {/* Card 2: Total Sessions Held */}
              <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md text-secondary">Sessions Held</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-display-lg text-display-lg text-on-surface font-bold">{totalSessionsHeld}</span>
                      <span className="font-caption text-caption text-secondary font-medium">/ 24 total</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-surface-container-low text-primary flex items-center justify-center">
                    <CalendarCheck className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-surface-container">
                  <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-primary-container h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (totalSessionsHeld / 24) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2 font-caption text-caption text-secondary">
                    <span>
                      {((totalSessionsHeld / 24) * 100).toFixed(1)}% semester progress
                    </span>
                    <span>{Math.max(0, 24 - totalSessionsHeld)} remaining</span>
                  </div>
                </div>
              </div>

              {/* Card 3: At-Risk Students */}
              <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md text-amber-800 font-medium">Students Below 75%</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-display-lg text-display-lg text-amber-700 font-bold">{atRiskCount}</span>
                      <span className="font-title-md text-title-md text-amber-800 font-medium">Students</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 pt-3 flex items-center justify-between border-t border-amber-100">
                  <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                    Exam Eligibility Risk
                  </span>
                  <span className="font-caption text-caption text-secondary">Notice pending</span>
                </div>
              </div>

              {/* Card 4: Biometric Verification Rate */}
              <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md text-secondary">Biometric Verification Rate</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-display-lg text-display-lg text-on-surface font-bold">
                        {biometricRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-surface-container-low text-emerald-700 flex items-center justify-center">
                    <Fingerprint className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 pt-3 flex items-center justify-between border-t border-surface-container">
                  <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    High Integrity
                  </span>
                  <span className="font-caption text-caption text-secondary">0.4% manual overrides</span>
                </div>
              </div>
            </section>

            {/* Interactive Analytical Visualizations (Side-by-Side) */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
              {/* Trend Line Chart */}
              <div className="lg:col-span-7 bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="font-title-lg text-title-lg text-on-surface">Attendance Rate per Session (Trend)</h2>
                      <p className="font-caption text-caption text-secondary mt-0.5">
                        Lectures 1 through {Math.max(14, totalSessionsHeld)} with 75% institutional cutoff threshold
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 font-caption text-caption text-secondary">
                        <span className="w-3 h-3 rounded-full bg-primary-container inline-block" />
                        <span>Class Attendance</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-caption text-caption text-amber-700">
                        <span className="w-3 h-1 bg-amber-600 inline-block" />
                        <span>75% Minimum Bar</span>
                      </div>
                    </div>
                  </div>

                  {/* SVG Line Chart Container */}
                  <div className="relative mt-6 w-full h-64 select-none">
                    <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 700 240">
                      {/* Grid Lines & Y-Labels */}
                      <line stroke="#E5EEFF" strokeWidth="1" x1="40" x2="680" y1="20" y2="20" />
                      <text className="text-[11px] fill-[#515F74]" textAnchor="end" x="32" y="24">100%</text>
                      <line stroke="#E5EEFF" strokeWidth="1" x1="40" x2="680" y1="65" y2="65" />
                      <text className="text-[11px] fill-[#515F74]" textAnchor="end" x="32" y="69">85%</text>

                      {/* 75% Threshold Line */}
                      <line stroke="#D97706" strokeDasharray="4,4" strokeWidth="1.5" x1="40" x2="680" y1="95" y2="95" />
                      <text className="text-[11px] fill-[#B45309] font-semibold" textAnchor="end" x="32" y="99">75%</text>

                      <line stroke="#E5EEFF" strokeWidth="1" x1="40" x2="680" y1="150" y2="150" />
                      <text className="text-[11px] fill-[#515F74]" textAnchor="end" x="32" y="154">50%</text>
                      <line stroke="#E5EEFF" strokeWidth="1" x1="40" x2="680" y1="210" y2="210" />
                      <text className="text-[11px] fill-[#515F74]" textAnchor="end" x="32" y="214">0%</text>

                      <defs>
                        <linearGradient id="attendanceGradient" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#1E40AF" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#1E40AF" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Area Fill */}
                      <path
                        d="M 60 40 L 105 45 L 150 55 L 195 50 L 240 68 L 285 85 L 330 48 L 375 62 L 420 72 L 465 52 L 510 65 L 555 88 L 600 58 L 645 44 L 645 210 L 60 210 Z"
                        fill="url(#attendanceGradient)"
                      />

                      {/* Smooth Trend Path */}
                      <polyline
                        fill="none"
                        points="60,40 105,45 150,55 195,50 240,68 285,85 330,48 375,62 420,72 465,52 510,65 555,88 600,58 645,44"
                        stroke="#1E40AF"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                      />

                      {/* Data Points */}
                      <circle cx="60" cy="40" fill="#FFFFFF" r="4" stroke="#1E40AF" strokeWidth="2" />
                      <circle cx="105" cy="45" fill="#FFFFFF" r="4" stroke="#1E40AF" strokeWidth="2" />
                      <circle cx="150" cy="55" fill="#FFFFFF" r="4" stroke="#1E40AF" strokeWidth="2" />
                      <circle cx="195" cy="50" fill="#FFFFFF" r="4" stroke="#1E40AF" strokeWidth="2" />
                      <circle cx="240" cy="68" fill="#FFFFFF" r="4" stroke="#1E40AF" strokeWidth="2" />
                      <circle cx="285" cy="85" fill="#FEF3C7" r="4.5" stroke="#D97706" strokeWidth="2" />
                      <circle cx="330" cy="48" fill="#FFFFFF" r="4" stroke="#1E40AF" strokeWidth="2" />
                      <circle cx="375" cy="62" fill="#FFFFFF" r="4" stroke="#1E40AF" strokeWidth="2" />
                      <circle cx="420" cy="72" fill="#FFFFFF" r="4" stroke="#1E40AF" strokeWidth="2" />
                      <circle cx="465" cy="52" fill="#FFFFFF" r="4" stroke="#1E40AF" strokeWidth="2" />
                      <circle cx="510" cy="65" fill="#FFFFFF" r="4" stroke="#1E40AF" strokeWidth="2" />
                      <circle cx="555" cy="88" fill="#FEF3C7" r="4.5" stroke="#D97706" strokeWidth="2" />
                      <circle cx="600" cy="58" fill="#FFFFFF" r="4" stroke="#1E40AF" strokeWidth="2" />
                      <circle cx="645" cy="44" fill="#1E40AF" r="5" stroke="#FFFFFF" strokeWidth="2.5" />

                      {/* Tooltip Callout on L14 */}
                      <g transform="translate(560, 0)">
                        <rect fill="#0B1C30" height="34" opacity="0.92" rx="8" width="125" x="0" y="0" />
                        <text className="text-[10px] fill-white font-medium" textAnchor="middle" x="62" y="15">
                          Lecture 14 (Latest)
                        </text>
                        <text className="text-[11px] fill-[#89F5E7] font-bold" textAnchor="middle" x="62" y="27">
                          48/52 (92.3%)
                        </text>
                      </g>

                      {/* X-Axis Labels */}
                      <text className="text-[11px] fill-[#515F74]" textAnchor="middle" x="60" y="230">L1</text>
                      <text className="text-[11px] fill-[#515F74]" textAnchor="middle" x="105" y="230">L2</text>
                      <text className="text-[11px] fill-[#515F74]" textAnchor="middle" x="150" y="230">L3</text>
                      <text className="text-[11px] fill-[#515F74]" textAnchor="middle" x="195" y="230">L4</text>
                      <text className="text-[11px] fill-[#515F74]" textAnchor="middle" x="240" y="230">L5</text>
                      <text className="text-[11px] fill-[#D97706] font-semibold" textAnchor="middle" x="285" y="230">L6</text>
                      <text className="text-[11px] fill-[#515F74]" textAnchor="middle" x="330" y="230">L7</text>
                      <text className="text-[11px] fill-[#515F74]" textAnchor="middle" x="375" y="230">L8</text>
                      <text className="text-[11px] fill-[#515F74]" textAnchor="middle" x="420" y="230">L9</text>
                      <text className="text-[11px] fill-[#515F74]" textAnchor="middle" x="465" y="230">L10</text>
                      <text className="text-[11px] fill-[#515F74]" textAnchor="middle" x="510" y="230">L11</text>
                      <text className="text-[11px] fill-[#D97706] font-semibold" textAnchor="middle" x="555" y="230">L12</text>
                      <text className="text-[11px] fill-[#515F74]" textAnchor="middle" x="600" y="230">L13</text>
                      <text className="text-[11px] fill-[#1E40AF] font-bold" textAnchor="middle" x="645" y="230">L14</text>
                    </svg>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 mt-2 border-t border-surface-container font-caption text-caption text-secondary">
                  <span className="flex items-center gap-1">
                    <Info className="w-4 h-4 text-amber-700" />
                    L6 &amp; L12 dipped near threshold during mid-semester project milestone weeks.
                  </span>
                  <span className="font-medium text-on-surface">Lowest: 78.8% (L12) • Peak: 94.2% (L1)</span>
                </div>
              </div>

              {/* Weekly Attendance Distribution (Bar Chart) */}
              <div className="lg:col-span-5 bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="font-title-lg text-title-lg text-on-surface">Weekly Attendance Distribution</h2>
                      <p className="font-caption text-caption text-secondary mt-0.5">
                        Aggregated verified vs flagged/absent volume by week
                      </p>
                    </div>
                    <span className="px-2.5 py-1 bg-surface-container-low rounded-xl text-primary font-caption text-caption font-semibold">
                      Weeks 1 - 8
                    </span>
                  </div>

                  {/* SVG Stacked Bar Chart */}
                  <div className="relative mt-6 w-full h-64 select-none">
                    <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 460 240">
                      <line stroke="#E5EEFF" strokeWidth="1" x1="30" x2="440" y1="20" y2="20" />
                      <line stroke="#E5EEFF" strokeWidth="1" x1="30" x2="440" y1="80" y2="80" />
                      <line stroke="#E5EEFF" strokeWidth="1" x1="30" x2="440" y1="140" y2="140" />
                      <line stroke="#E5EEFF" strokeWidth="1" x1="30" x2="440" y1="200" y2="200" />

                      <text className="text-[10px] fill-[#515F74]" textAnchor="end" x="24" y="24">104</text>
                      <text className="text-[10px] fill-[#515F74]" textAnchor="end" x="24" y="84">75</text>
                      <text className="text-[10px] fill-[#515F74]" textAnchor="end" x="24" y="144">50</text>
                      <text className="text-[10px] fill-[#515F74]" textAnchor="end" x="24" y="204">0</text>

                      {/* Week 1 */}
                      <g transform="translate(48, 0)">
                        <rect fill="#16A34A" height="152" rx="4" width="28" x="0" y="34" />
                        <rect fill="#D97706" height="8" width="28" x="0" y="26" />
                        <rect fill="#BA1A1A" height="6" opacity="0.8" rx="4" width="28" x="0" y="20" />
                        <text className="text-[11px] fill-[#515F74]" textAnchor="middle" x="14" y="222">W1</text>
                      </g>

                      {/* Week 2 */}
                      <g transform="translate(98, 0)">
                        <rect fill="#16A34A" height="148" rx="4" width="28" x="0" y="38" />
                        <rect fill="#D97706" height="10" width="28" x="0" y="28" />
                        <rect fill="#BA1A1A" height="8" opacity="0.8" rx="4" width="28" x="0" y="20" />
                        <text className="text-[11px] fill-[#515F74]" textAnchor="middle" x="14" y="222">W2</text>
                      </g>

                      {/* Week 3 */}
                      <g transform="translate(148, 0)">
                        <rect fill="#16A34A" height="142" rx="4" width="28" x="0" y="44" />
                        <rect fill="#D97706" height="12" width="28" x="0" y="32" />
                        <rect fill="#BA1A1A" height="12" opacity="0.8" rx="4" width="28" x="0" y="20" />
                        <text className="text-[11px] fill-[#515F74]" textAnchor="middle" x="14" y="222">W3</text>
                      </g>

                      {/* Week 4 */}
                      <g transform="translate(198, 0)">
                        <rect fill="#16A34A" height="132" rx="4" width="28" x="0" y="54" />
                        <rect fill="#D97706" height="18" width="28" x="0" y="36" />
                        <rect fill="#BA1A1A" height="16" opacity="0.8" rx="4" width="28" x="0" y="20" />
                        <text className="text-[11px] fill-[#515F74]" textAnchor="middle" x="14" y="222">W4</text>
                      </g>

                      {/* Week 5 */}
                      <g transform="translate(248, 0)">
                        <rect fill="#16A34A" height="144" rx="4" width="28" x="0" y="42" />
                        <rect fill="#D97706" height="10" width="28" x="0" y="32" />
                        <rect fill="#BA1A1A" height="12" opacity="0.8" rx="4" width="28" x="0" y="20" />
                        <text className="text-[11px] fill-[#515F74]" textAnchor="middle" x="14" y="222">W5</text>
                      </g>

                      {/* Week 6 */}
                      <g transform="translate(298, 0)">
                        <rect fill="#16A34A" height="137" rx="4" width="28" x="0" y="49" />
                        <rect fill="#D97706" height="12" width="28" x="0" y="37" />
                        <rect fill="#BA1A1A" height="17" opacity="0.8" rx="4" width="28" x="0" y="20" />
                        <text className="text-[11px] fill-[#515F74]" textAnchor="middle" x="14" y="222">W6</text>
                      </g>

                      {/* Week 7 */}
                      <g transform="translate(348, 0)">
                        <rect fill="#16A34A" height="126" rx="4" width="28" x="0" y="60" />
                        <rect fill="#D97706" height="20" width="28" x="0" y="40" />
                        <rect fill="#BA1A1A" height="20" opacity="0.8" rx="4" width="28" x="0" y="20" />
                        <text className="text-[11px] fill-[#D97706] font-semibold" textAnchor="middle" x="14" y="222">W7</text>
                      </g>

                      {/* Week 8 */}
                      <g transform="translate(398, 0)">
                        <rect fill="#16A34A" height="148" rx="4" width="28" x="0" y="38" />
                        <rect fill="#D97706" height="10" width="28" x="0" y="28" />
                        <rect fill="#BA1A1A" height="8" opacity="0.8" rx="4" width="28" x="0" y="20" />
                        <text className="text-[11px] fill-[#16A34A] font-bold" textAnchor="middle" x="14" y="222">W8</text>
                      </g>
                    </svg>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-between pt-4 mt-2 border-t border-surface-container font-caption text-caption">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-on-surface">
                      <span className="w-3 h-3 rounded bg-emerald-600" /> Verified (91%)
                    </span>
                    <span className="flex items-center gap-1.5 text-secondary">
                      <span className="w-3 h-3 rounded bg-amber-600" /> Late/Excused (5%)
                    </span>
                    <span className="flex items-center gap-1.5 text-secondary">
                      <span className="w-3 h-3 rounded bg-rose-600" /> Absent (4%)
                    </span>
                  </div>
                  <span className="text-secondary font-medium">104 Records / Wk</span>
                </div>
              </div>
            </section>

            {/* Student Roster Attendance Audit Table Section */}
            <section className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex flex-col gap-space-md">
              <div className="flex flex-wrap items-center justify-between gap-space-md pb-2">
                <div>
                  <h2 className="font-title-lg text-title-lg text-on-surface">Student Attendance Roster &amp; Eligibility</h2>
                  <p className="font-caption text-caption text-secondary mt-0.5">
                    Continuous evaluation based on 75% institutional attendance exam gate
                  </p>
                </div>

                {/* Quick Cohort Filter Segmented Control */}
                <div className="inline-flex p-1 bg-surface-container rounded-xl text-secondary font-label-md text-label-md">
                  <button
                    type="button"
                    onClick={() => setActiveTab("all")}
                    className={`px-3.5 py-1.5 rounded-lg transition-all ${
                      activeTab === "all"
                        ? "bg-surface-container-lowest text-primary font-semibold shadow-sm"
                        : "text-secondary hover:text-on-surface"
                    }`}
                  >
                    All ({students.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("at-risk")}
                    className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      activeTab === "at-risk"
                        ? "bg-surface-container-lowest text-primary font-semibold shadow-sm"
                        : "text-secondary hover:text-on-surface"
                    }`}
                  >
                    <span>At Risk (&lt;75%)</span>
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold flex items-center justify-center">
                      {atRiskCount}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("satisfactory")}
                    className={`px-3.5 py-1.5 rounded-lg transition-all ${
                      activeTab === "satisfactory"
                        ? "bg-surface-container-lowest text-primary font-semibold shadow-sm"
                        : "text-secondary hover:text-on-surface"
                    }`}
                  >
                    Satisfactory ({satisfactoryCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("exemplary")}
                    className={`px-3.5 py-1.5 rounded-lg transition-all ${
                      activeTab === "exemplary"
                        ? "bg-surface-container-lowest text-primary font-semibold shadow-sm"
                        : "text-secondary hover:text-on-surface"
                    }`}
                  >
                    Exemplary (≥90%) ({exemplaryCount})
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto -mx-space-lg px-space-lg">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-surface-container bg-surface-container-low/50">
                      <th className="py-3.5 px-4 font-caption text-caption font-semibold text-secondary uppercase tracking-wider rounded-l-xl">
                        Index No.
                      </th>
                      <th className="py-3.5 px-4 font-caption text-caption font-semibold text-secondary uppercase tracking-wider">
                        Student Name
                      </th>
                      <th className="py-3.5 px-4 font-caption text-caption font-semibold text-secondary uppercase tracking-wider">
                        Level / Prog
                      </th>
                      <th className="py-3.5 px-4 font-caption text-caption font-semibold text-secondary uppercase tracking-wider text-center">
                        Sessions
                      </th>
                      <th className="py-3.5 px-4 font-caption text-caption font-semibold text-secondary uppercase tracking-wider">
                        Attendance %
                      </th>
                      <th className="py-3.5 px-4 font-caption text-caption font-semibold text-secondary uppercase tracking-wider w-44">
                        Benchmark Visual
                      </th>
                      <th className="py-3.5 px-4 font-caption text-caption font-semibold text-secondary uppercase tracking-wider">
                        Eligibility
                      </th>
                      <th className="py-3.5 px-4 font-caption text-caption font-semibold text-secondary uppercase tracking-wider text-right rounded-r-xl">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container font-body-md text-body-md">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-secondary font-caption text-caption">
                          No students found matching your filters.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((s) => {
                        const isAtRisk = s.category === "at-risk";
                        const isBarred = s.statusBadge === "barred";
                        const initials = s.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2);

                        return (
                          <tr
                            key={s.id}
                            className={`transition-colors ${
                              isBarred
                                ? "bg-rose-50/60 hover:bg-rose-50"
                                : isAtRisk
                                ? "bg-amber-50/50 hover:bg-amber-50"
                                : "hover:bg-surface-container-low/40"
                            }`}
                          >
                            <td
                              className={`py-4 px-4 font-mono text-[13px] ${
                                isBarred
                                  ? "text-rose-900 font-bold"
                                  : isAtRisk
                                  ? "text-amber-900 font-semibold"
                                  : "text-secondary font-medium"
                              }`}
                            >
                              {s.indexNumber}
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-9 h-9 rounded-full font-bold flex items-center justify-center text-sm shrink-0 ${
                                    isBarred
                                      ? "bg-rose-200 text-rose-800"
                                      : isAtRisk
                                      ? "bg-amber-200 text-amber-800"
                                      : "bg-primary/10 text-primary"
                                  }`}
                                >
                                  {initials}
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`font-title-md text-title-md font-bold leading-tight ${
                                        isBarred ? "text-rose-950" : isAtRisk ? "text-amber-950" : "text-on-surface"
                                      }`}
                                    >
                                      {s.name}
                                    </span>
                                    {isBarred ? (
                                      <span title="Deficit requires urgent review">
                                        <ShieldAlert className="w-4 h-4 text-rose-600" />
                                      </span>
                                    ) : isAtRisk ? (
                                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                                    ) : null}
                                  </div>
                                  {s.email && (
                                    <span
                                      className={`font-caption text-caption block ${
                                        isBarred ? "text-rose-700" : isAtRisk ? "text-amber-800" : "text-secondary"
                                      }`}
                                    >
                                      {s.email}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td
                              className={`py-4 px-4 font-caption text-caption ${
                                isBarred
                                  ? "text-rose-800"
                                  : isAtRisk
                                  ? "text-amber-800"
                                  : "text-on-surface-variant"
                              }`}
                            >
                              {s.program}
                            </td>
                            <td
                              className={`py-4 px-4 text-center font-label-md text-label-md font-bold ${
                                isBarred ? "text-rose-950" : isAtRisk ? "text-amber-950" : "text-on-surface"
                              }`}
                            >
                              {s.sessionsAttended} / {s.totalSessions}
                            </td>
                            <td
                              className={`py-4 px-4 font-label-md text-label-md font-bold ${
                                isBarred
                                  ? "text-rose-700"
                                  : isAtRisk
                                  ? "text-amber-700"
                                  : s.attendanceRate >= 90
                                  ? "text-emerald-700"
                                  : "text-on-surface"
                              }`}
                            >
                              {s.attendanceRate.toFixed(1)}%
                            </td>
                            <td className="py-4 px-4">
                              <div className="relative w-full">
                                <div
                                  className={`w-full rounded-full h-2 overflow-hidden ${
                                    isBarred
                                      ? "bg-rose-200/70"
                                      : isAtRisk
                                      ? "bg-amber-200/70"
                                      : "bg-surface-container"
                                  }`}
                                >
                                  <div
                                    className={`h-full rounded-full ${
                                      isBarred
                                        ? "bg-rose-600"
                                        : isAtRisk
                                        ? "bg-amber-600"
                                        : "bg-emerald-600"
                                    }`}
                                    style={{ width: `${s.attendanceRate}%` }}
                                  />
                                </div>
                                <div
                                  className={`absolute -top-1 left-[75%] w-0.5 h-4 ${
                                    isBarred ? "bg-rose-700" : isAtRisk ? "bg-amber-700" : "bg-secondary/40"
                                  }`}
                                  title="75% Exam Threshold"
                                />
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              {s.statusBadge === "barred" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-caption text-caption font-semibold">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  <span>Barred / Critical</span>
                                </span>
                              ) : s.statusBadge === "at-risk" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-caption text-caption font-semibold">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  <span>At Risk</span>
                                </span>
                              ) : s.statusBadge === "perfect" ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-caption text-caption font-semibold">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Perfect</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-caption text-caption font-semibold">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Eligible</span>
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {isAtRisk ? (
                                  <button
                                    type="button"
                                    onClick={() => handleSendNotice(s.id)}
                                    className={`px-2.5 py-1 rounded-lg font-label-md text-[13px] flex items-center gap-1 transition-colors shadow-sm ${
                                      isBarred
                                        ? "bg-rose-600 text-white hover:bg-rose-700"
                                        : "bg-surface-container text-amber-900 hover:bg-amber-200/60"
                                    }`}
                                  >
                                    <Mail className="w-3.5 h-3.5" />
                                    <span>
                                      {noticeSentStudentId === s.id ? "Queued ✓" : "Notice"}
                                    </span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-surface-container transition-colors"
                                    title="View Audit Trail"
                                  >
                                    <History className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    isBarred
                                      ? "text-rose-700 hover:bg-rose-200/60"
                                      : isAtRisk
                                      ? "text-amber-800 hover:bg-amber-200/60"
                                      : "text-secondary hover:text-on-surface hover:bg-surface-container"
                                  }`}
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination & Bulk Dispatch Bar */}
              <div className="flex flex-wrap items-center justify-between gap-space-md pt-4 border-t border-surface-container">
                <div className="flex items-center gap-3">
                  <span className="font-caption text-caption text-secondary">
                    Showing <span className="font-semibold text-on-surface">1 to {filteredStudents.length}</span> of{" "}
                    <span className="font-semibold text-on-surface">{students.length}</span> students
                  </span>
                  <span className="text-surface-container-high">|</span>
                  <button
                    type="button"
                    onClick={handleBulkWarning}
                    className="text-primary hover:underline font-caption text-caption font-medium flex items-center gap-1"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Send bulk warning to all {atRiskCount} at-risk students</span>
                  </button>
                </div>

                {/* Pagination Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    className="w-9 h-9 rounded-lg bg-surface-container-low text-secondary/40 flex items-center justify-center cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(1)}
                    className="w-9 h-9 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold flex items-center justify-center shadow-sm"
                  >
                    1
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(2)}
                    className="w-9 h-9 rounded-lg hover:bg-surface-container text-on-surface font-label-md text-label-md flex items-center justify-center transition-colors"
                  >
                    2
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(3)}
                    className="w-9 h-9 rounded-lg hover:bg-surface-container text-on-surface font-label-md text-label-md flex items-center justify-center transition-colors"
                  >
                    3
                  </button>
                  <span className="px-1 text-secondary">...</span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(7)}
                    className="w-9 h-9 rounded-lg hover:bg-surface-container text-on-surface font-label-md text-label-md flex items-center justify-center transition-colors"
                  >
                    7
                  </button>
                  <button
                    type="button"
                    className="w-9 h-9 rounded-lg bg-surface-container-low hover:bg-surface-container text-secondary flex items-center justify-center transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </section>

            {/* Export Manifest / Institutional Compliance Protocol Notice */}
            <section className="bg-surface-container-low rounded-2xl p-space-md flex flex-wrap items-center justify-between gap-space-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-container-lowest text-primary flex items-center justify-center shadow-sm shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-title-md text-title-md text-on-surface leading-tight">
                    Institutional Compliance Protocol
                  </h3>
                  <p className="font-caption text-caption text-secondary mt-0.5">
                    Per Academic Statute Section 14.2, students with final attendance below 75% are disqualified from sitting for end-of-semester examinations.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-caption text-caption text-secondary">Last synchronized: Today, 14:32 GMT</span>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="px-3.5 py-2 rounded-xl bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-md text-label-md shadow-sm transition-all flex items-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Sync Roster</span>
                </button>
              </div>
            </section>

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
