"use client";

import { ProfilePhoto } from "@/components/lecturer/profile-photo";

import { AttendMark } from "@/components/brand/attend-mark";

import { useState, useTransition } from "react";
import Link from "next/link";
import HeaderSearch from "@/components/lecturer/header-search";
import {
  LayoutGrid,
  BookOpen,
  Clock,
  Bell,
  BarChart3,
  Settings,
  MapPin,
  Search,
  Download,
  CloudUpload,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  CheckCircle2,
  AlertTriangle,
  DoorClosed,
  Pencil,
  IdCard,
  Camera,
  Trash2,
  X,
  LogOut,
  Plus,
} from "lucide-react";
import { signOutAction } from "@/app/auth/actions";
import { ClassImportDialog } from "@/components/lecturer/class-import-dialog";
import {
  createClassAction,
  deleteClassAction,
  deleteSessionAction,
  deleteStudentAction,
  getClassStudentsAction,
  updateClassAction,
} from "@/app/(lecturer)/classes/actions";

export interface ClassItem {
  id: string;
  code: string;
  title: string;
  semester: string;
  programme: string | null;
  default_venue: string | null;
  created_at: string;
}

export interface ClassSession {
  id: string;
  class_id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  venue_name: string | null;
  status: "open" | "closed";
}

export interface StudentRecord {
  id: string;
  class_id: string;
  index_number: string;
  full_name: string;
  email: string | null;
  programme: string | null;
  level: string | null;
  reference_photo_path: string | null;
  created_at?: string;
}

interface ClassesClientViewProps {
  initialClasses: ClassItem[];
  initialStudents: StudentRecord[];
  initialSessions: ClassSession[];
  openAlertCount?: number;
  userProfile: {
    fullName: string;
    firstName: string;
    email: string;
    institution: string;
    campus: string;
  };
}

function NewClassForm({
  onCreated,
  onCancel,
}: {
  onCreated: (item: ClassItem) => void;
  onCancel?: () => void;
}) {
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [semester, setSemester] = useState("");
  const [programme, setProgramme] = useState("");
  const [venue, setVenue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function create() {
    setError(null);
    startTransition(async () => {
      const result = await createClassAction({
        code,
        title,
        semester,
        programme,
        default_venue: venue,
      });
      if (result.error || !result.classId) {
        setError(result.error || "Could not create the class.");
        return;
      }
      onCreated({
        id: result.classId,
        code: code.trim().toUpperCase(),
        title: title.trim(),
        semester: semester.trim() || "Current semester",
        programme: programme.trim() || null,
        default_venue: venue.trim() || null,
        created_at: new Date().toISOString(),
      });
    });
  }

  return (
    <section className="flex max-w-2xl flex-col gap-4 rounded-2xl border border-surface-container-high bg-surface-container-lowest p-6 shadow-sm">
      <div>
        <h2 className="font-title-lg text-title-lg font-semibold text-on-surface">New class</h2>
        <p className="font-body-md text-body-md text-secondary">
          Add another course on this account. Each class keeps its own roster, sessions, and attendance.
        </p>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="font-label-md text-label-md font-semibold">Course code</span>
        <input value={code} onChange={(event) => setCode(event.target.value)} placeholder="INF313" className="h-11 rounded-xl bg-surface-container-low px-4 font-label-md text-label-md outline-none focus:ring-2 focus:ring-primary/20" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="font-label-md text-label-md font-semibold">Course title</span>
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Web Technology 2" className="h-11 rounded-xl bg-surface-container-low px-4 font-label-md text-label-md outline-none focus:ring-2 focus:ring-primary/20" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="font-label-md text-label-md font-semibold">Semester</span>
        <input value={semester} onChange={(event) => setSemester(event.target.value)} placeholder="Semester 21 2026/2027" className="h-11 rounded-xl bg-surface-container-low px-4 font-label-md text-label-md outline-none focus:ring-2 focus:ring-primary/20" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="font-label-md text-label-md font-semibold">Programme</span>
        <input value={programme} onChange={(event) => setProgramme(event.target.value)} placeholder="BSc Computer Science" className="h-11 rounded-xl bg-surface-container-low px-4 font-label-md text-label-md outline-none focus:ring-2 focus:ring-primary/20" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="font-label-md text-label-md font-semibold">Default venue</span>
        <input value={venue} onChange={(event) => setVenue(event.target.value)} placeholder="NLT 8" className="h-11 rounded-xl bg-surface-container-low px-4 font-label-md text-label-md outline-none focus:ring-2 focus:ring-primary/20" />
      </label>
      {error && <p className="font-body-md text-body-md text-error">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={create}
          disabled={isPending || !code.trim() || !title.trim()}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 font-label-lg text-label-md font-semibold text-on-primary disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          {isPending ? "Creating..." : "Create class"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="h-11 rounded-xl px-4 font-label-md text-label-md font-semibold text-secondary hover:bg-surface-container">
            Cancel
          </button>
        )}
      </div>
    </section>
  );
}

function ClassSettingsForm({
  classItem,
  onSaved,
  onDelete,
  deleting,
}: {
  classItem: ClassItem;
  onSaved: (next: ClassItem) => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const [code, setCode] = useState(classItem.code);
  const [title, setTitle] = useState(classItem.title);
  const [semester, setSemester] = useState(classItem.semester);
  const [programme, setProgramme] = useState(classItem.programme || "");
  const [venue, setVenue] = useState(classItem.default_venue || "");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function save() {
    setMessage(null);
    startTransition(async () => {
      const result = await updateClassAction(classItem.id, {
        code,
        title,
        semester,
        programme,
        default_venue: venue,
      });
      if (result.error) {
        setMessage(result.error);
        return;
      }
      onSaved({
        ...classItem,
        code: code.trim().toUpperCase(),
        title: title.trim(),
        semester: semester.trim() || classItem.semester,
        programme: programme.trim() || null,
        default_venue: venue.trim() || null,
      });
      setMessage("Class settings saved.");
    });
  }

  return (
    <section className="flex max-w-2xl flex-col gap-4 rounded-2xl border border-surface-container-high bg-surface-container-lowest p-6 shadow-sm">
      <div>
        <h2 className="font-title-lg text-title-lg font-semibold text-on-surface">Class settings</h2>
        <p className="font-body-md text-body-md text-secondary">
          These details belong to {classItem.code} only. Other courses keep their own roster and sessions.
        </p>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="font-label-md text-label-md font-semibold">Course code</span>
        <input value={code} onChange={(event) => setCode(event.target.value)} className="h-11 rounded-xl bg-surface-container-low px-4 font-label-md text-label-md outline-none focus:ring-2 focus:ring-primary/20" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="font-label-md text-label-md font-semibold">Course title</span>
        <input value={title} onChange={(event) => setTitle(event.target.value)} className="h-11 rounded-xl bg-surface-container-low px-4 font-label-md text-label-md outline-none focus:ring-2 focus:ring-primary/20" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="font-label-md text-label-md font-semibold">Semester</span>
        <input value={semester} onChange={(event) => setSemester(event.target.value)} className="h-11 rounded-xl bg-surface-container-low px-4 font-label-md text-label-md outline-none focus:ring-2 focus:ring-primary/20" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="font-label-md text-label-md font-semibold">Programme</span>
        <input value={programme} onChange={(event) => setProgramme(event.target.value)} className="h-11 rounded-xl bg-surface-container-low px-4 font-label-md text-label-md outline-none focus:ring-2 focus:ring-primary/20" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="font-label-md text-label-md font-semibold">Default venue</span>
        <input value={venue} onChange={(event) => setVenue(event.target.value)} className="h-11 rounded-xl bg-surface-container-low px-4 font-label-md text-label-md outline-none focus:ring-2 focus:ring-primary/20" />
      </label>
      {message && <p className="font-body-md text-body-md text-secondary">{message}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className="inline-flex h-11 w-fit items-center rounded-xl bg-primary-container px-5 font-label-lg text-label-md font-semibold text-on-primary disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Save class settings"}
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-error/30 px-4 font-label-md text-label-md font-semibold text-error hover:bg-error-container/30 disabled:opacity-60"
        >
          <Trash2 className="h-4 w-4" />
          {deleting ? "Deleting..." : "Delete this class"}
        </button>
      </div>
    </section>
  );
}

export default function ClassesClientView({
  initialClasses,
  initialStudents,
  initialSessions,
  openAlertCount = 0,
  userProfile,
}: ClassesClientViewProps) {
  const [classes, setClasses] = useState<ClassItem[]>(initialClasses);
  const [selectedClassId, setSelectedClassId] = useState<string>(
    initialClasses[0]?.id || ""
  );
  const [students, setStudents] = useState<StudentRecord[]>(initialStudents);
  const [sessions, setSessions] = useState<ClassSession[]>(initialSessions);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"roster" | "sessions" | "settings">("roster");
  const [searchQuery, setSearchQuery] = useState("");
  const [programmeFilter, setProgrammeFilter] = useState("all");
  const [photoFilter, setPhotoFilter] = useState("all");

  // Modal & CSV Import state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showNewClass, setShowNewClass] = useState(false);

  const selectedClass =
    classes.find((c) => c.id === selectedClassId) || classes[0] || null;
  const classSessions = sessions.filter((session) => session.class_id === selectedClass?.id);
  const now = new Date().getTime();

  // Handle class selection
  const handleSelectClass = async (classId: string) => {
    setSelectedClassId(classId);
    const { students: newStudents } = await getClassStudentsAction(classId);
    if (newStudents) {
      setStudents(newStudents);
    }
  };

  async function removeStudent(student: StudentRecord) {
    const confirmed = window.confirm(`Remove ${student.full_name} from this class? Their attendance records for this class will be removed too.`);
    if (!confirmed) return;
    setDeletingId(student.id);
    setStatusMessage(null);
    const result = await deleteStudentAction(student.id);
    setDeletingId(null);
    if (result.error) {
      setStatusMessage(result.error);
      return;
    }
    setStudents((current) => current.filter((item) => item.id !== student.id));
  }

  async function removeSession(session: ClassSession) {
    const confirmed = window.confirm(`Delete the session “${session.title}”? Its attendance record will be removed too.`);
    if (!confirmed) return;
    setDeletingId(session.id);
    setStatusMessage(null);
    const result = await deleteSessionAction(session.id);
    setDeletingId(null);
    if (result.error) {
      setStatusMessage(result.error);
      return;
    }
    setSessions((current) => current.filter((item) => item.id !== session.id));
  }

  async function removeClass(course: ClassItem) {
    const confirmed = window.confirm(
      `Delete ${course.code} ${course.title}? Students, sessions, attendance, and alerts for this class will be removed. Your lecturer account stays.`,
    );
    if (!confirmed) return;
    setDeletingId(course.id);
    setStatusMessage(null);
    const result = await deleteClassAction(course.id);
    setDeletingId(null);
    if (result.error) {
      setStatusMessage(result.error);
      return;
    }
    const remaining = classes.filter((item) => item.id !== course.id);
    setClasses(remaining);
    setSessions((current) => current.filter((item) => item.class_id !== course.id));
    if (remaining[0]) {
      setSelectedClassId(remaining[0].id);
      const { students: loaded } = await getClassStudentsAction(remaining[0].id);
      setStudents(loaded || []);
    } else {
      setSelectedClassId("");
      setStudents([]);
      setShowNewClass(true);
    }
    setStatusMessage(`${course.code} deleted.`);
  }

  function handleClassCreated(item: ClassItem) {
    setClasses((current) => [item, ...current.filter((course) => course.id !== item.id)]);
    setSelectedClassId(item.id);
    setStudents([]);
    setShowNewClass(false);
    setActiveTab("roster");
    setStatusMessage(`${item.code} is ready. Import a class list when you have one.`);
  }

  // CSV Export
  const handleExportRoster = () => {
    if (students.length === 0) return;
    const header = "Index Number,Full Name,Email,Programme,Level,Photo Status\n";
    const rows = students
      .map(
        (s) =>
          `"${s.index_number}","${s.full_name}","${s.email || ""}","${s.programme || ""}","${s.level || ""}","${s.reference_photo_path ? "Verified" : "Missing"}"`
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedClass?.code || "roster"}_students.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Filter students
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.index_number.includes(searchQuery) ||
      (student.email && student.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesProgramme =
      programmeFilter === "all" ||
      (student.programme &&
        student.programme.toLowerCase().includes(programmeFilter.toLowerCase()));
    const matchesPhoto =
      photoFilter === "all" ||
      (photoFilter === "verified" && student.reference_photo_path !== null) ||
      (photoFilter === "missing" && student.reference_photo_path === null);
    return matchesSearch && matchesProgramme && matchesPhoto;
  });

  return (
    <div className="flex min-h-screen bg-surface">
      {/* ── Sidebar Navigation ── */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-r border-surface-container-high z-50 flex flex-col justify-between hidden md:flex">
        <div className="flex flex-col">
          {/* Logo & Portal Label */}
          <div className="h-16 px-6 flex items-center gap-3 border-b border-surface-container-high">
            <AttendMark />
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
                {classes.length > 0 && (
                  <span className="ml-auto px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-caption text-caption font-semibold">
                    {classes.length}
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
                {openAlertCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-caption text-caption font-bold">
                    {openAlertCount}
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
          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high">
            <div className="flex items-start gap-2.5">
              <MapPin className="h-4 w-4 text-secondary mt-0.5 flex-shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="font-caption text-[11px] text-secondary font-semibold uppercase tracking-wider">
                  Faculty &amp; Campus
                </span>
                <span className="font-label-md text-label-md text-on-surface font-semibold truncate">
                  {userProfile.institution}
                </span>
                <span className="font-caption text-caption text-secondary truncate">
                  {userProfile.campus}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <ProfilePhoto variant="initial" initial={userProfile.firstName.charAt(0)} />
              <div className="flex flex-col min-w-0">
                <span className="font-label-md text-label-md font-semibold text-on-surface truncate">
                  {userProfile.fullName}
                </span>
                <span className="font-caption text-[11px] text-secondary truncate">
                  {userProfile.email}
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
              {openAlertCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-error ring-2 ring-surface-container-lowest"></span>
              )}
            </div>

            <div className="h-8 w-[1px] bg-surface-container-high hidden sm:block"></div>

            <div className="hidden sm:flex items-center gap-2.5 p-1.5 pl-2 pr-3.5 rounded-full bg-surface-container-low hover:bg-surface-container transition-colors">
              <ProfilePhoto variant="icon" />
              <div className="flex flex-col text-left">
                <span className="font-label-md text-label-md text-on-surface font-semibold leading-tight">
                  {userProfile.fullName}
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
          {/* Status Alert Banner */}
          {statusMessage && (
            <div className="p-4 rounded-xl bg-tertiary-container/15 text-tertiary-container border border-tertiary-container/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                <span className="font-label-md font-medium">{statusMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setStatusMessage(null)}
                className="text-secondary hover:text-on-surface p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {(classes.length === 0 || showNewClass) && (
            <NewClassForm
              onCreated={handleClassCreated}
              onCancel={classes.length > 0 ? () => setShowNewClass(false) : undefined}
            />
          )}

          {selectedClass && (
          <>
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
            <span className="text-on-surface font-semibold">
              {selectedClass ? `${selectedClass.code} ${selectedClass.title}` : "Course Cohort"}
            </span>
          </nav>

          {/* Course Cohort Header & Action Buttons */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">
                  {`${selectedClass.code} ${selectedClass.title}`}
                </h1>
                <span className="px-3 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-md text-label-md font-medium">
                  {selectedClass.semester}
                </span>
                <span className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-surface-container-high text-primary font-caption text-caption font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                  Biometrics Enabled
                </span>
              </div>

              <p className="font-body-md text-label-md text-secondary flex items-center gap-2 flex-wrap">
                <span>{students.length} enrolled students</span>
                <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                <span>{selectedClass.programme || "Programme not set"}</span>
                <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                <span className="inline-flex items-center gap-1 text-on-surface font-medium">
                  <DoorClosed className="h-4 w-4 text-secondary" />
                  {selectedClass.default_venue || "Venue not set"}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={handleExportRoster}
                disabled={students.length === 0}
                className="h-11 px-4 rounded-xl bg-surface-container-lowest text-secondary shadow-sm border border-surface-container-high hover:bg-surface-container-low hover:text-on-surface transition-all flex items-center gap-2 font-label-lg text-label-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4" />
                <span>Export Roster (CSV)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowNewClass(true)}
                className="h-11 px-4 rounded-xl bg-surface-container-lowest text-primary shadow-sm border border-surface-container-high hover:bg-surface-container-low transition-all flex items-center gap-2 font-label-lg text-label-md font-semibold cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>New class</span>
              </button>

              <button
                type="button"
                onClick={() => selectedClass && removeClass(selectedClass)}
                disabled={!selectedClass || deletingId === selectedClass.id}
                className="h-11 px-4 rounded-xl bg-surface-container-lowest text-error shadow-sm border border-error/20 hover:bg-error-container/20 transition-all flex items-center gap-2 font-label-lg text-label-md font-semibold cursor-pointer disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" />
                <span>{selectedClass && deletingId === selectedClass.id ? "Deleting..." : "Delete class"}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                disabled={!selectedClass}
                className="h-11 px-5 rounded-xl bg-primary-container text-on-primary shadow-sm hover:opacity-95 transition-all flex items-center gap-2 font-label-lg text-label-md font-semibold active:scale-95 cursor-pointer disabled:opacity-40"
              >
                <CloudUpload className="h-4 w-4" />
                <span>Import class list</span>
              </button>
            </div>
          </div>

          {/* Multiple Class Cohort Selector (if more than 1 class) */}
          {classes.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="font-caption text-caption text-secondary uppercase font-semibold mr-1">
                Your Cohorts:
              </span>
              {classes.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelectClass(c.id)}
                  className={`px-3 py-1.5 rounded-xl font-label-md text-label-md font-semibold transition-all cursor-pointer ${
                    c.id === selectedClassId
                      ? "bg-primary text-on-primary shadow-sm"
                      : "bg-surface-container-lowest text-secondary hover:bg-surface-container border border-surface-container-high"
                  }`}
                >
                  {c.code}
                </button>
              ))}
            </div>
          )}

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
                {students.length}
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
                {classSessions.length}
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

          {activeTab === "sessions" && (
            <section className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-6 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-title-lg text-title-lg font-semibold text-on-surface">
                    Sessions for {selectedClass?.code || "this class"}
                  </h2>
                  <p className="font-body-md text-body-md text-secondary">
                    Attendance for this course stays with these sessions.
                  </p>
                </div>
                <Link
                  href={selectedClass ? `/sessions/new?class=${selectedClass.id}` : "/sessions/new"}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary-container px-4 font-label-lg text-label-md font-semibold text-on-primary"
                >
                  <Plus className="h-4 w-4" />
                  New session
                </Link>
              </div>
              {classSessions.length === 0 ? (
                <p className="py-8 text-center font-body-md text-body-md text-secondary">
                  No sessions for this class yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] border-collapse text-left">
                    <thead>
                      <tr className="bg-surface-container-low font-label-md text-label-md text-secondary">
                        <th className="rounded-l-xl px-4 py-3">Session</th>
                        <th className="px-4 py-3">When</th>
                        <th className="px-4 py-3">Location</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="rounded-r-xl px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container-high">
                      {classSessions.map((session) => {
                        const start = new Date(session.starts_at);
                        const end = new Date(session.ends_at);
                        const status =
                          session.status === "closed" || end.getTime() < now
                            ? "Completed"
                            : start.getTime() > now
                              ? "Scheduled"
                              : "Live";
                        return (
                          <tr key={session.id}>
                            <td className="px-4 py-4 font-title-md text-title-md font-semibold">{session.title}</td>
                            <td className="px-4 py-4">
                              <span className="block font-semibold">
                                {start.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                              </span>
                              <span className="font-caption text-caption text-secondary">
                                {start.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                                {" – "}
                                {end.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-secondary">{session.venue_name || "Classroom"}</td>
                            <td className="px-4 py-4">
                              <span className="inline-flex rounded-full bg-surface-container px-2.5 py-1 font-caption text-caption font-bold text-primary">
                                {status}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <div className="inline-flex justify-end gap-2">
                                <Link href={`/sessions/${session.id}/qr`} className="rounded-lg bg-primary-container px-3 py-1.5 font-label-md text-label-md font-semibold text-on-primary">
                                  QR pass
                                </Link>
                                <Link href={`/sessions/${session.id}/monitor`} className="rounded-lg bg-surface-container px-3 py-1.5 font-label-md text-label-md font-semibold text-primary">
                                  Monitor
                                </Link>
                                <button
                                  type="button"
                                  title="Delete session"
                                  disabled={deletingId === session.id}
                                  onClick={() => removeSession(session)}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-secondary hover:bg-error-container/40 hover:text-error disabled:opacity-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {activeTab === "settings" && selectedClass && (
            <ClassSettingsForm
              key={selectedClass.id}
              classItem={selectedClass}
              deleting={deletingId === selectedClass.id}
              onDelete={() => removeClass(selectedClass)}
              onSaved={(next) =>
                setClasses((current) => current.map((item) => (item.id === next.id ? next : item)))
              }
            />
          )}

          {activeTab === "roster" && (
          <>
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
                <option value="verified">Photo Verified</option>
                <option value="missing">Missing Photo</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-secondary font-caption text-caption self-end md:self-center">
              <span className="w-2 h-2 rounded-full bg-tertiary-container"></span>
              <span>
                Showing <strong className="text-on-surface font-semibold">{filteredStudents.length}</strong> of {students.length} registered students
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
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-secondary font-body-md">
                        {students.length === 0
                          ? "No students registered yet in this cohort. Click 'Import class list' to upload your roster."
                          : "No students matching your filter criteria."}
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => {
                      const isPhotoOk = Boolean(student.reference_photo_path);
                      const initials = student.full_name
                        .split(" ")
                        .map((p) => p.charAt(0))
                        .join("")
                        .slice(0, 2)
                        .toUpperCase();

                      return (
                        <tr
                          key={student.id}
                          className={`hover:bg-surface-container-low/60 transition-colors ${
                            !isPhotoOk ? "bg-error-container/10" : ""
                          }`}
                        >
                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold text-caption shadow-sm flex-shrink-0">
                                {initials}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-title-md text-title-md text-on-surface font-semibold truncate">
                                  {student.full_name}
                                </span>
                                <span className="font-caption text-caption text-secondary">
                                  {student.email || "No email on record"}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-mono text-label-md text-on-surface-variant font-medium">
                            {student.index_number}
                          </td>

                          <td className="py-3.5 px-4 text-secondary">
                            {student.programme || "BSc Computer Science"}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-0.5 rounded-md bg-surface-container-high text-on-surface font-caption text-caption font-semibold">
                              {student.level || "Level 200"}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            {isPhotoOk ? (
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
                              {!isPhotoOk ? (
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
                              <button
                                type="button"
                                title={`Remove ${student.full_name}`}
                                disabled={deletingId === student.id}
                                onClick={() => removeStudent(student)}
                                className="w-9 h-9 rounded-lg flex items-center justify-center text-secondary hover:bg-error-container/40 hover:text-error transition-colors cursor-pointer disabled:opacity-50"
                              >
                                <Trash2 className="h-4 w-4" />
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

            {/* Table Pagination Footer */}
            <div className="px-6 py-3.5 bg-surface-container-low flex items-center justify-between text-secondary font-caption text-caption border-t border-surface-container-high">
              <div className="flex items-center gap-2">
                <span>Rows per page:</span>
                <select className="bg-surface-container-lowest rounded-md px-2 py-1 font-medium text-on-surface outline-none border border-surface-container-high">
                  <option>10</option>
                  <option defaultValue="25">25</option>
                  <option>50</option>
                </select>
                <span>
                  1 - {filteredStudents.length} of {students.length} items
                </span>
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
                <span className="px-2 font-medium text-on-surface">Page 1 of 1</span>
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
          </>
          )}
          </>
          )}
        </main>
      </div>

      {isModalOpen && selectedClass && (
        <ClassImportDialog
          classId={selectedClass.id}
          classCode={selectedClass.code}
          onClose={() => setIsModalOpen(false)}
          onImported={async () => {
            const { students: updated } = await getClassStudentsAction(selectedClass.id);
            if (updated) setStudents(updated);
            setStatusMessage("Imported the roster for " + selectedClass.code + ".");
          }}
        />
      )}

    </div>
  );
}
