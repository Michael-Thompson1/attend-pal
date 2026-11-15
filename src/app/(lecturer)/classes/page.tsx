"use client";

import { useState } from "react";
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
  CloudUpload,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Check,
  CheckCircle2,
  AlertTriangle,
  DoorClosed,
  Pencil,
  IdCard,
  Camera,
  X,
  Image as ImageIcon,
  ImageOff,
  ArrowRight,
  ArrowLeft,
  Info,
  LogOut,
  Paperclip,
  Sparkles,
} from "lucide-react";
import { signOutAction } from "@/app/auth/actions";

interface Student {
  id: string;
  name: string;
  email: string;
  indexNumber: string;
  programme: string;
  level: string;
  photoStatus: "verified" | "missing";
  initials: string;
}

const SAMPLE_STUDENTS: Student[] = [
  {
    id: "1",
    name: "Sarah Mensah",
    email: "s.mensah@stu.ucc.edu.gh",
    indexNumber: "20234102",
    programme: "BSc Computer Science",
    level: "Level 200",
    photoStatus: "verified",
    initials: "SM",
  },
  {
    id: "2",
    name: "Ama Asante",
    email: "a.asante@stu.ucc.edu.gh",
    indexNumber: "20239021",
    programme: "BSc Computer Science",
    level: "Level 200",
    photoStatus: "verified",
    initials: "AA",
  },
  {
    id: "3",
    name: "Kofi Boateng",
    email: "k.boateng@stu.ucc.edu.gh",
    indexNumber: "20231894",
    programme: "BSc Computer Science",
    level: "Level 200",
    photoStatus: "missing",
    initials: "KB",
  },
  {
    id: "4",
    name: "Emmanuel Darko",
    email: "e.darko@stu.ucc.edu.gh",
    indexNumber: "20230812",
    programme: "BSc Computer Engineering",
    level: "Level 200",
    photoStatus: "verified",
    initials: "ED",
  },
];

export default function ClassesPage() {
  const [activeTab, setActiveTab] = useState<"roster" | "sessions" | "settings">("roster");
  const [searchQuery, setSearchQuery] = useState("");
  const [programmeFilter, setProgrammeFilter] = useState("all");
  const [photoFilter, setPhotoFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [importingState, setImportingState] = useState<"idle" | "importing" | "done">("idle");

  const filteredStudents = SAMPLE_STUDENTS.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.indexNumber.includes(searchQuery) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProgramme =
      programmeFilter === "all" || student.programme.toLowerCase().includes(programmeFilter.toLowerCase());
    const matchesPhoto =
      photoFilter === "all" ||
      (photoFilter === "verified" && student.photoStatus === "verified") ||
      (photoFilter === "missing" && student.photoStatus === "missing");
    return matchesSearch && matchesProgramme && matchesPhoto;
  });

  const handleFinalizeImport = () => {
    setImportingState("importing");
    setTimeout(() => {
      setImportingState("done");
      setTimeout(() => {
        setIsModalOpen(false);
        setImportingState("idle");
      }, 700);
    }, 900);
  };

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
                aria-current="page"
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-primary-container text-on-primary font-semibold shadow-sm transition-all text-label-md"
              >
                <BookOpen className="h-5 w-5" />
                <span>Classes</span>
                <span className="ml-auto px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-caption text-caption font-semibold">
                  1
                </span>
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
                  UCC Main Campus • North Wing
                </span>
              </div>
            </div>
          </div>

          {/* User Profile & Sign Out */}
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
        <main className="w-full pt-20 px-6 lg:px-10 pb-12 flex flex-col gap-6">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 font-caption text-caption text-secondary">
            <Link href="/dashboard" className="hover:text-primary transition-colors">
              Academic Portal
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-outline" />
            <Link href="/classes" className="hover:text-primary transition-colors font-medium">
              Classes
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-outline" />
            <span className="text-on-surface font-semibold">INF212 Algorithms</span>
          </nav>

          {/* Course Cohort Header & Action Buttons */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">
                  INF212 Algorithms
                </h1>
                <span className="px-3 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-md text-label-md font-medium">
                  Semester 2, 2024/2025
                </span>
                <span className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-surface-container-high text-primary font-caption text-caption font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                  Biometrics Enabled
                </span>
              </div>

              <p className="font-body-md text-label-md text-secondary flex items-center gap-2 flex-wrap">
                <span>52 enrolled students</span>
                <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                <span>BSc Computer Science</span>
                <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                <span className="inline-flex items-center gap-1 text-on-surface font-medium">
                  <DoorClosed className="h-4 w-4 text-secondary" />
                  Lecture Hall B (Main Campus)
                </span>
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                className="h-11 px-4 rounded-xl bg-surface-container-lowest text-secondary shadow-sm border border-surface-container-high hover:bg-surface-container-low hover:text-on-surface transition-all flex items-center gap-2 font-label-lg text-label-md cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Export Roster (CSV)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="h-11 px-5 rounded-xl bg-primary-container text-on-primary shadow-sm hover:opacity-95 transition-all flex items-center gap-2 font-label-lg text-label-md font-semibold active:scale-95 cursor-pointer"
              >
                <CloudUpload className="h-4 w-4" />
                <span>Import class list</span>
              </button>
            </div>
          </div>

          {/* MD3 Tabs */}
          <div className="flex items-center gap-4 bg-surface-container-lowest rounded-2xl px-4 pt-2 shadow-sm border border-surface-container-high">
            <button
              type="button"
              onClick={() => setActiveTab("roster")}
              className={`relative pb-3.5 px-3 font-title-md text-title-md flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === "roster"
                  ? "text-primary font-semibold"
                  : "text-secondary hover:text-on-surface"
              }`}
            >
              <span>Roster</span>
              <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-md text-caption font-semibold">
                52
              </span>
              {activeTab === "roster" && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full"></div>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("sessions")}
              className={`relative pb-3.5 px-3 font-title-md text-title-md flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === "sessions"
                  ? "text-primary font-semibold"
                  : "text-secondary hover:text-on-surface"
              }`}
            >
              <span>Sessions</span>
              <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-md text-caption font-semibold">
                14
              </span>
              {activeTab === "sessions" && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full"></div>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              className={`relative pb-3.5 px-3 font-title-md text-title-md flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === "settings"
                  ? "text-primary font-semibold"
                  : "text-secondary hover:text-on-surface"
              }`}
            >
              <span>Class Settings</span>
              {activeTab === "settings" && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full"></div>
              )}
            </button>
          </div>

          {/* Filter & Action Controls */}
          <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-surface-container-high flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[260px] max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-outline" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or index number..."
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-surface-container-low text-on-surface placeholder:text-outline font-body-md text-label-md border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <select
                value={programmeFilter}
                onChange={(e) => setProgrammeFilter(e.target.value)}
                className="h-11 px-4 rounded-xl bg-surface-container-low text-on-surface font-label-md text-label-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 border-0"
              >
                <option value="all">Programme: All</option>
                <option value="Computer Science">BSc Computer Science</option>
                <option value="Computer Engineering">BSc Computer Engineering</option>
                <option value="Information Tech">BSc Information Tech</option>
              </select>

              <select
                value={photoFilter}
                onChange={(e) => setPhotoFilter(e.target.value)}
                className="h-11 px-4 rounded-xl bg-surface-container-low text-on-surface font-label-md text-label-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 border-0"
              >
                <option value="all">Photo status: All</option>
                <option value="verified">Photo Verified (50)</option>
                <option value="missing">Missing Photo (2)</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-secondary font-caption text-caption self-end md:self-center">
              <span className="w-2 h-2 rounded-full bg-tertiary-container"></span>
              <span>
                Showing <strong className="text-on-surface font-semibold">{filteredStudents.length}</strong> of 52 registered students
              </span>
            </div>
          </div>

          {/* Roster Data Table */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container-high overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-secondary font-label-md text-label-md">
                    <th className="py-3.5 px-6 font-semibold">Student Name</th>
                    <th className="py-3.5 px-4 font-semibold">Index Number</th>
                    <th className="py-3.5 px-4 font-semibold">Programme</th>
                    <th className="py-3.5 px-4 font-semibold">Level</th>
                    <th className="py-3.5 px-4 font-semibold">Biometric Status</th>
                    <th className="py-3.5 px-6 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high font-body-md text-label-md text-on-surface">
                  {filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      className={`hover:bg-surface-container-low/60 transition-colors ${
                        student.photoStatus === "missing" ? "bg-error-container/10" : ""
                      }`}
                    >
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold text-caption shadow-sm flex-shrink-0">
                            {student.initials}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-title-md text-title-md text-on-surface font-semibold truncate">
                              {student.name}
                            </span>
                            <span className="font-caption text-caption text-secondary">
                              {student.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-label-md text-on-surface-variant font-medium">
                        {student.indexNumber}
                      </td>

                      <td className="py-3.5 px-4 text-secondary">
                        {student.programme}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-md bg-surface-container-high text-on-surface font-caption text-caption font-semibold">
                          {student.level}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {student.photoStatus === "verified" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant font-label-md text-caption font-semibold">
                            <CheckCircle2 className="h-4 w-4 text-tertiary-container" />
                            <span>Photo OK</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-error-container text-on-error-container font-label-md text-caption font-semibold">
                            <AlertTriangle className="h-4 w-4" />
                            <span>Missing photo</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {student.photoStatus === "missing" ? (
                            <button
                              type="button"
                              className="h-8 px-2.5 rounded-lg bg-surface-container text-primary hover:bg-primary hover:text-on-primary transition-all font-label-md text-caption font-semibold flex items-center gap-1 cursor-pointer"
                              title="Capture Photo"
                            >
                              <Camera className="h-3.5 w-3.5" />
                              <span>Capture</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="w-9 h-9 rounded-lg flex items-center justify-center text-secondary hover:bg-surface-container-high hover:text-primary transition-colors cursor-pointer"
                              title="View Biometric Card"
                            >
                              <IdCard className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-secondary hover:bg-surface-container-high hover:text-primary transition-colors cursor-pointer"
                            title="Edit Student Record"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Pagination Footer */}
            <div className="px-6 py-3.5 bg-surface-container-low flex items-center justify-between text-secondary font-caption text-caption border-t border-surface-container-high">
              <div className="flex items-center gap-2">
                <span>Rows per page:</span>
                <select className="bg-surface-container-lowest rounded-md px-2 py-1 font-medium text-on-surface outline-none border border-surface-container-high">
                  <option>10</option>
                  <option defaultValue="25">25</option>
                  <option>50</option>
                </select>
                <span>1 - 4 of 52 items</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="w-8 h-8 rounded-lg flex items-center justify-center opacity-40 cursor-not-allowed"
                  disabled
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="w-8 h-8 rounded-lg flex items-center justify-center opacity-40 cursor-not-allowed"
                  disabled
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-2 font-medium text-on-surface">Page 1 of 2</span>
                <button
                  type="button"
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-container-high text-on-surface cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-container-high text-on-surface cursor-pointer"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ── Modal Wizard: Import Class List & Reference Biometrics ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-inverse-surface/60 backdrop-blur-sm transition-opacity">
          <div className="relative w-full max-w-3xl bg-surface-container-lowest rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-surface-container-high animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 sm:px-8 pt-6 pb-4 flex items-start justify-between border-b border-surface-container-high bg-surface-container-lowest">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-primary text-on-primary">
                    <CloudUpload className="h-5 w-5" />
                  </div>
                  <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    Import Class List &amp; Reference Biometrics
                  </h2>
                </div>
                <p className="font-body-md text-caption text-secondary">
                  Upload student registry data and baseline photos for on-device facial verification kiosks.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-outline hover:bg-surface-container-high hover:text-on-surface transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 3-Step Wizard Navigation Indicator */}
            <div className="px-6 sm:px-8 py-3 bg-surface-container-low border-b border-surface-container-high flex items-center justify-between">
              {/* Step 1: Completed */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shadow-xs">
                  <Check className="h-4 w-4 font-bold" />
                </div>
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-on-surface font-semibold">
                    1. Upload CSV
                  </span>
                  <span className="font-caption text-caption text-tertiary-container font-medium">
                    class_roster_sem2.csv
                  </span>
                </div>
              </div>

              <div className="h-[2px] flex-1 mx-3 bg-tertiary-fixed"></div>

              {/* Step 2: Completed */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shadow-xs">
                  <Check className="h-4 w-4 font-bold" />
                </div>
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-on-surface font-semibold">
                    2. Bulk Photos
                  </span>
                  <span className="font-caption text-caption text-tertiary-container font-medium">
                    51 files indexed
                  </span>
                </div>
              </div>

              <div className="h-[2px] flex-1 mx-3 bg-primary-fixed"></div>

              {/* Step 3: Active */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-xs shadow-sm ring-4 ring-primary-fixed/50">
                  3
                </div>
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-primary font-bold">
                    3. Review &amp; Validate
                  </span>
                  <span className="font-caption text-caption text-primary font-semibold">
                    3 Anomalies flagged
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Body (Scrollable Review Content) */}
            <div className="px-6 sm:px-8 py-5 overflow-y-auto space-y-4 flex-1">
              {/* Summary Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-title-lg text-title-lg text-on-surface font-bold leading-tight">
                      50 Ready
                    </span>
                    <span className="font-caption text-caption text-secondary">
                      Verified &amp; matched
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-secondary-fixed text-on-secondary-fixed-variant flex items-center justify-center flex-shrink-0">
                    <ImageOff className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-title-lg text-title-lg text-on-surface font-bold leading-tight">
                      2 Missing
                    </span>
                    <span className="font-caption text-caption text-secondary">
                      Photo not found
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-error-container text-on-error-container flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-title-lg text-title-lg text-on-surface font-bold leading-tight">
                      1 Conflict
                    </span>
                    <span className="font-caption text-caption text-secondary">
                      Duplicate index ID
                    </span>
                  </div>
                </div>
              </div>

              {/* Informational Warning Banner */}
              <div className="p-4 rounded-xl bg-surface-container border border-surface-container-high flex items-start gap-3">
                <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <p className="font-body-md text-caption text-on-surface leading-relaxed">
                  Review anomalies below before finalizing import. Students with missing photos will require manual check-in or rapid on-site camera enrollment during the first lecture. Duplicate IDs cannot be imported automatically.
                </p>
              </div>

              {/* Template Rule Reference */}
              <div className="p-3 bg-surface-container-low rounded-xl flex items-center justify-between text-secondary font-caption text-caption border border-surface-container-high">
                <div className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  <span>
                    Files matched against rule: <code className="px-1.5 py-0.5 rounded bg-surface-container-lowest text-primary font-mono font-medium">[index_number].jpg</code>
                  </span>
                </div>
                <button
                  type="button"
                  className="text-primary hover:underline font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download CSV template</span>
                </button>
              </div>

              {/* Parsed Data Preview Table */}
              <div className="rounded-xl overflow-hidden border border-surface-container-high bg-surface-container-lowest">
                <div className="px-4 py-2.5 bg-surface-container-high flex items-center justify-between">
                  <span className="font-label-md text-label-md text-on-surface font-semibold">
                    Parsed Records Preview (Sample of 4)
                  </span>
                  <span className="font-caption text-caption text-secondary font-mono">
                    Total: 53 entries processed
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-caption text-caption">
                    <thead>
                      <tr className="bg-surface-container-low text-secondary font-semibold">
                        <th className="py-2.5 px-4">Student &amp; Index</th>
                        <th className="py-2.5 px-3">Programme</th>
                        <th className="py-2.5 px-3">Biometric Asset</th>
                        <th className="py-2.5 px-3">Validation Status</th>
                        <th className="py-2.5 px-4 text-right">Resolution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container-high text-on-surface">
                      {/* Row 1: Valid */}
                      <tr className="hover:bg-surface-container-low/40">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold text-xs">
                              SM
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-on-surface">Sarah Mensah</span>
                              <span className="font-mono text-secondary">20234102</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-secondary">BSc CS (L200)</td>
                        <td className="py-3 px-3">
                          <span className="font-mono text-tertiary-container flex items-center gap-1 font-medium">
                            <ImageIcon className="h-3.5 w-3.5" />
                            20234102.jpg
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-semibold">
                            <Check className="h-3 w-3" />
                            Valid
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-secondary">Auto-linked</td>
                      </tr>

                      {/* Row 2: Missing Photo */}
                      <tr className="bg-secondary-fixed/30 hover:bg-secondary-fixed/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-xs">
                              KB
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-on-surface">Kofi Boateng</span>
                              <span className="font-mono text-secondary">20231894</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-secondary">BSc CS (L200)</td>
                        <td className="py-3 px-3">
                          <span className="text-secondary italic flex items-center gap-1">
                            <ImageOff className="h-3.5 w-3.5" />
                            None provided
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-semibold">
                            <AlertTriangle className="h-3 w-3" />
                            Missing photo
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            className="text-primary hover:underline font-semibold flex items-center gap-0.5 ml-auto cursor-pointer"
                          >
                            <CloudUpload className="h-3.5 w-3.5" />
                            <span>Attach</span>
                          </button>
                        </td>
                      </tr>

                      {/* Row 3: Duplicate conflict */}
                      <tr className="bg-error-container/25 hover:bg-error-container/35 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-error-container text-on-error-container flex items-center justify-center font-bold text-xs">
                              DO
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-on-surface">Daniel Osei</span>
                              <span className="font-mono text-error font-bold">20231045</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-secondary">BSc IT (L200)</td>
                        <td className="py-3 px-3">
                          <span className="font-mono text-secondary flex items-center gap-1">
                            <ImageIcon className="h-3.5 w-3.5" />
                            20231045.jpg
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-semibold">
                            <X className="h-3 w-3" />
                            Duplicate index
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-error font-medium">Skip row</span>
                          </div>
                        </td>
                      </tr>

                      {/* Row 4: Valid */}
                      <tr className="hover:bg-surface-container-low/40">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold text-xs">
                              AA
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-on-surface">Ama Asante</span>
                              <span className="font-mono text-secondary">20239021</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-secondary">BSc CS (L200)</td>
                        <td className="py-3 px-3">
                          <span className="font-mono text-tertiary-container flex items-center gap-1 font-medium">
                            <ImageIcon className="h-3.5 w-3.5" />
                            20239021.jpg
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-semibold">
                            <Check className="h-3 w-3" />
                            Valid
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-secondary">Auto-linked</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer Action Bar */}
            <div className="px-6 sm:px-8 py-4 bg-surface-container-low border-t border-surface-container-high flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-11 px-4 rounded-xl bg-surface-container-lowest text-secondary hover:bg-surface-container hover:text-on-surface transition-colors font-label-md text-label-md flex items-center gap-1.5 shadow-xs border border-surface-container-high cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Step 2</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-secondary hover:text-on-surface font-label-md text-label-md underline-offset-4 hover:underline cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <span className="font-caption text-caption text-secondary hidden md:inline">
                  2 flagged records held for review
                </span>
                <button
                  type="button"
                  onClick={handleFinalizeImport}
                  disabled={importingState !== "idle"}
                  className="w-full sm:w-auto h-11 px-5 rounded-xl bg-primary-container text-on-primary hover:opacity-95 shadow-md flex items-center justify-center gap-2 font-label-lg text-label-md font-semibold active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {importingState === "idle" && (
                    <>
                      <span>Import 50 verified students</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                  {importingState === "importing" && (
                    <>
                      <Sparkles className="h-4 w-4 animate-spin" />
                      <span>Importing records...</span>
                    </>
                  )}
                  {importingState === "done" && (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Completed!</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
