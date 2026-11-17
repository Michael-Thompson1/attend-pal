"use client";

import { ProfilePhoto, useLecturerProfile } from "@/components/lecturer/profile-photo";

import { AttendMark } from "@/components/brand/attend-mark";

import { useEffect, useState, useTransition } from "react";
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
  Sliders,
  Terminal,
  ChevronDown,
  BookMarked,
  Calendar,
  Hourglass,
  ShieldCheck,
  Crosshair,
  Smartphone,
  Compass,
  Layers,
  Plus,
  Minus,
  Bluetooth,
  Radio,
  ArrowRight,
  Info,
  LogOut,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { signOutAction } from "@/app/auth/actions";
import { createSessionAction } from "@/app/(lecturer)/sessions/actions";

interface ClassRow {
  id: string;
  code: string;
  title: string;
  default_venue: string | null;
}

interface SessionDefaults {
  radiusM: number;
  windowMinutes: number;
  requireLiveness: boolean;
  allowSecondCheckin: boolean;
  notifySuspicious: boolean;
}

interface CreateSessionClientProps {
  classes: ClassRow[];
  defaults: SessionDefaults;
  initialClassId?: string;
  openAlertCount?: number;
}

function addMinutes(start: string, minutes: number) {
  const [hours, mins] = start.split(":").map(Number);
  const total = hours * 60 + mins + minutes;
  const nextHours = Math.floor(total / 60) % 24;
  const nextMins = total % 60;
  return `${String(nextHours).padStart(2, "0")}:${String(nextMins).padStart(2, "0")}`;
}

export default function CreateSessionClientView({
  classes,
  defaults,
  initialClassId,
  openAlertCount = 0,
}: CreateSessionClientProps) {
  const { name: lecturerName } = useLecturerProfile();
  const [selectedClassId, setSelectedClassId] = useState<string>(
    classes.some((course) => course.id === initialClassId) ? initialClassId || "" : classes[0]?.id ?? ""
  );
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [radiusM, setRadiusM] = useState<number>(defaults.radiusM);
  const [sessionTitle, setSessionTitle] = useState("");
  const [requireLiveness, setRequireLiveness] = useState(defaults.requireLiveness);
  const [allowSecondCheckin, setAllowSecondCheckin] = useState(defaults.allowSecondCheckin);
  const [notifySuspicious, setNotifySuspicious] = useState(defaults.notifySuspicious);
  const [selectedVenue, setSelectedVenue] = useState("Lecture Hall B");
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsMessage, setGpsMessage] = useState("Reading this device for the class center.");
  const [sessionDate, setSessionDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState(addMinutes("10:00", defaults.windowMinutes));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function readDeviceCenter() {
    if (!navigator.geolocation) {
      setGpsMessage("This browser cannot read a location.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCenter({ lat: position.coords.latitude, lng: position.coords.longitude });
        setGpsMessage("Class center is this device.");
      },
      () => setGpsMessage("Allow location, then press Current GPS. The class center is this device."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCenter({ lat: position.coords.latitude, lng: position.coords.longitude });
        setGpsMessage("Class center is this device.");
      },
      () => setGpsMessage("Allow location, then press Current GPS. The class center is this device."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  // Dynamic visual radius scaling for the SVG map (scale 100m -> r=105)
  const mapSvgRadius = Math.max(30, Math.min(220, (radiusM / 100) * 105));

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  // Compute duration in minutes between start and end times
  const windowDurationMinutes = (() => {
    try {
      const [sh, sm] = startTime.split(":").map(Number);
      const [eh, em] = endTime.split(":").map(Number);
      const diff = eh * 60 + em - (sh * 60 + sm);
      return diff > 0 ? diff : 15;
    } catch {
      return 15;
    }
  })();

  function handleSubmit() {
    if (!selectedClassId) {
      setError("Please select a class before creating a session.");
      return;
    }
    if (!sessionTitle.trim()) {
      setError("Please enter a session title.");
      return;
    }
    if (!center) {
      setError("Allow location so this device can be the class center.");
      readDeviceCenter();
      return;
    }
    setError(null);

    const startsAt = `${sessionDate}T${startTime}:00`;
    const endsAt = `${sessionDate}T${endTime}:00`;

    const formData = new FormData();
    formData.set("class_id", selectedClassId);
    formData.set("title", sessionTitle.trim());
    formData.set("starts_at", startsAt);
    formData.set("ends_at", endsAt);
    formData.set("radius_m", String(radiusM));
    formData.set("venue_name", selectedVenue);
    formData.set("center_lat", String(center.lat));
    formData.set("center_lng", String(center.lng));
    formData.set("require_liveness", String(requireLiveness));
    formData.set("allow_second_checkin", String(allowSecondCheckin));
    formData.set("notify_suspicious", String(notifySuspicious));

    startTransition(async () => {
      const result = await createSessionAction(formData);
      if (result && "error" in result) {
        setError(result.error);
      }
      // On success, createSessionAction does redirect() — no manual redirect needed
    });
  }

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
              <ProfilePhoto variant="initial" />
              <div className="flex flex-col min-w-0">
                <span className="font-label-md text-label-md font-semibold text-on-surface truncate">
                  {lecturerName || "Lecturer"}
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
              {openAlertCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-error ring-2 ring-surface-container-lowest"></span>
              )}
            </div>

            <div className="h-8 w-[1px] bg-surface-container-high hidden sm:block"></div>

            <div className="hidden sm:flex items-center gap-2.5 p-1.5 pl-2 pr-3.5 rounded-full bg-surface-container-low hover:bg-surface-container transition-colors">
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

        {/* ── Main Content Area ── */}
        <main className="w-full pt-20 px-6 lg:px-10 pb-32 flex flex-col gap-6">
          {/* Page Header & Metadata Ribbon */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex flex-col">
              <nav aria-label="Breadcrumb" className="flex items-center gap-2 mb-2 font-caption text-caption text-secondary">
                <Link href="/dashboard" className="hover:text-primary transition-colors">
                  Academic Portal
                </Link>
                <span className="text-outline-variant">/</span>
                <Link href="/sessions" className="hover:text-primary transition-colors">
                  Sessions
                </Link>
                <span className="text-outline-variant">/</span>
                <span className="text-primary font-semibold">New Session</span>
              </nav>

              <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">
                Create Attendance Session
              </h1>
              <p className="font-body-md text-secondary mt-1">
                Set up time windows, geofence radius, and identity verification rules for your lecture.
              </p>
            </div>

            <div className="flex items-center gap-2.5 bg-surface-container px-4 py-2 rounded-xl self-start md:self-auto shadow-sm border border-surface-container-high">
              <span className="w-2.5 h-2.5 rounded-full bg-tertiary-container animate-pulse"></span>
              <div className="flex flex-col">
                <span className="font-caption text-[11px] text-secondary font-medium leading-none">
                  Semester 2 · 2024/2025
                </span>
                <span className="font-label-md text-label-md text-on-surface font-semibold mt-0.5">
                  Faculty of Science Sandbox
                </span>
              </div>
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-error-container text-on-error-container border border-error/20">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span className="font-label-md text-label-md font-medium">{error}</span>
            </div>
          )}

          {/* No classes warning */}
          {classes.length === 0 && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary-fixed/50 border border-secondary-container">
              <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="flex flex-col gap-1">
                <span className="font-label-md text-label-md font-semibold text-on-surface">No classes found</span>
                <span className="font-caption text-caption text-secondary">
                  You need to create a class first before starting a session.{" "}
                  <Link href="/classes" className="text-primary font-semibold hover:underline">
                    Go to Classes →
                  </Link>
                </span>
              </div>
            </div>
          )}

          {/* Two-Column Configuration Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ── LEFT COLUMN: Session Setup Form Card (5 cols) ── */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container-high flex flex-col gap-5">
                {/* Form Section Header */}
                <div className="flex items-center justify-between pb-1 border-b border-surface-container-high">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                      <Sliders className="h-4 w-4" />
                    </div>
                    <h2 className="font-title-lg text-title-lg font-bold text-on-surface">
                      Configuration Parameters
                    </h2>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-surface-container-low font-caption text-caption text-primary font-semibold border border-surface-container-high">
                    Step 1 of 2
                  </span>
                </div>

                {/* Class Selector Dropdown */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-md text-label-md text-on-surface font-semibold flex items-center justify-between">
                    <span>Select Class</span>
                    <span className="font-caption text-caption text-secondary font-normal">
                      Active Cohort
                    </span>
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowClassDropdown((v) => !v)}
                      className="w-full h-14 pl-11 pr-10 rounded-xl bg-surface-container-low border border-surface-container-high flex items-center justify-between cursor-pointer hover:bg-surface-container transition-all text-left"
                    >
                      <Terminal className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary h-5 w-5" />
                      {selectedClass ? (
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-label-lg text-label-md text-on-surface font-bold">
                            {selectedClass.code}
                          </span>
                          <span className="text-outline">·</span>
                          <span className="font-body-md text-label-md text-on-surface truncate">
                            {selectedClass.title}
                          </span>
                        </div>
                      ) : (
                        <span className="text-outline font-body-md text-label-md">
                          {classes.length === 0 ? "No classes available" : "Select a class…"}
                        </span>
                      )}
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-secondary h-4 w-4" />
                    </button>

                    {/* Dropdown list */}
                    {showClassDropdown && classes.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-surface-container-lowest rounded-xl border border-surface-container-high shadow-lg z-20 overflow-hidden">
                        {classes.map((cls) => (
                          <button
                            key={cls.id}
                            type="button"
                            onClick={() => {
                              setSelectedClassId(cls.id);
                              if (cls.default_venue) setSelectedVenue(cls.default_venue);
                              setShowClassDropdown(false);
                            }}
                            className={`w-full px-4 py-3 text-left flex items-center gap-2 hover:bg-surface-container transition-colors ${
                              selectedClassId === cls.id ? "bg-primary-container/30" : ""
                            }`}
                          >
                            <span className="font-label-md text-label-md text-on-surface font-bold shrink-0">
                              {cls.code}
                            </span>
                            <span className="text-outline">·</span>
                            <span className="font-body-md text-label-md text-on-surface truncate">
                              {cls.title}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Session Title Input */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-md text-label-md text-on-surface font-semibold flex items-center justify-between">
                    <span>Session Title</span>
                    <span className="font-caption text-caption text-secondary font-normal">
                      Syllabus Topic
                    </span>
                  </label>
                  <div className="relative">
                    <BookMarked className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary h-4 w-4" />
                    <input
                      type="text"
                      value={sessionTitle}
                      onChange={(e) => setSessionTitle(e.target.value)}
                      placeholder="e.g. Lecture 14: Binary Search Trees"
                      className="w-full h-12 pl-10 pr-4 rounded-xl bg-surface-container-low border border-surface-container-high text-on-surface font-body-md text-label-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Date & Window Grid */}
                <div className="flex flex-col gap-3 bg-surface-container-low/70 p-4 rounded-xl border border-surface-container-high">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-md text-label-md text-on-surface font-semibold flex items-center gap-1.5">
                      <Calendar className="text-primary h-4 w-4" />
                      <span>Session Date</span>
                    </label>
                    <input
                      type="date"
                      value={sessionDate}
                      onChange={(e) => setSessionDate(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl bg-surface-container-lowest border border-surface-container-high text-on-surface font-label-lg text-label-md font-semibold shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 pt-1">
                    <label className="font-label-md text-label-md text-on-surface font-semibold">
                      Check-in Window
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <span className="font-caption text-caption text-secondary">Start Time</span>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary h-4 w-4 pointer-events-none" />
                          <input
                            type="time"
                            value={startTime}
                            onChange={(e) => {
                              const newStart = e.target.value;
                              setStartTime(newStart);
                              // Auto-advance end time by 15 mins if end time falls before or equals new start
                              try {
                                const [h, m] = newStart.split(":").map(Number);
                                const totalM = h * 60 + m + 15;
                                const newEh = String(Math.floor(totalM / 60) % 24).padStart(2, "0");
                                const newEm = String(totalM % 60).padStart(2, "0");
                                setEndTime(`${newEh}:${newEm}`);
                              } catch {
                                // fallback
                              }
                            }}
                            className="w-full h-11 pl-9 pr-3 rounded-xl bg-surface-container-lowest border border-surface-container-high text-on-surface font-label-md text-label-md font-semibold shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="font-caption text-caption text-secondary">End Time</span>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary h-4 w-4 pointer-events-none" />
                          <input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-full h-11 pl-9 pr-3 rounded-xl bg-surface-container-lowest border border-surface-container-high text-on-surface font-label-md text-label-md font-semibold shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-1.5 px-3 py-2 bg-surface-container rounded-lg">
                      <Hourglass className="text-primary h-4 w-4 shrink-0" />
                      <span className="font-caption text-caption text-on-secondary-container leading-tight">
                        Students can only check in inside this {windowDurationMinutes}-minute window.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Allowed Geofence Radius Slider */}
                <div className="flex flex-col gap-2 pt-1">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-on-surface font-semibold">
                        Allowed Geofence Radius
                      </span>
                      <span className="font-caption text-caption text-secondary">
                        Standard lecture hall or lab perimeter
                      </span>
                    </div>
                    <div className="px-3 py-1 bg-primary text-on-primary rounded-full font-label-md text-label-md font-bold tracking-wide shadow-sm">
                      {radiusM} m
                    </div>
                  </div>

                  <div className="relative flex items-center py-2">
                    <input
                      type="range"
                      min={20}
                      max={300}
                      step={10}
                      value={radiusM}
                      onChange={(e) => setRadiusM(Number(e.target.value))}
                      className="w-full h-2 bg-surface-container-high rounded-full appearance-none cursor-pointer accent-primary"
                    />
                  </div>

                  <div className="flex justify-between font-caption text-caption text-secondary font-medium px-0.5">
                    <span>20 m (Tight Lab)</span>
                    <span className="text-primary font-semibold">100 m (Hall B Recommended)</span>
                    <span>300 m (Amphitheater)</span>
                  </div>
                </div>

                {/* Verification & Security Section */}
                <div className="flex flex-col gap-3 pt-2">
                  <span className="font-label-md text-label-md text-on-surface font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="text-secondary h-4 w-4" />
                    <span>Verification &amp; Security Rules</span>
                  </span>

                  {/* Liveness Checkbox */}
                  <label className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer border border-surface-container-high">
                    <input
                      type="checkbox"
                      checked={requireLiveness}
                      onChange={(e) => setRequireLiveness(e.target.checked)}
                      className="w-5 h-5 rounded-md accent-primary cursor-pointer mt-0.5"
                    />
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-on-surface font-semibold">
                        Require selfie liveness check (blink detection)
                      </span>
                      <span className="font-caption text-caption text-secondary mt-0.5">
                        Prevents spoofing and static photo submissions via automated biometric motion check.
                      </span>
                    </div>
                  </label>

                  {/* Second Check-in Checkbox */}
                  <label className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer border border-surface-container-high">
                    <input
                      type="checkbox"
                      checked={allowSecondCheckin}
                      onChange={(e) => setAllowSecondCheckin(e.target.checked)}
                      className="w-5 h-5 rounded-md accent-primary cursor-pointer mt-0.5"
                    />
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-on-surface font-semibold">
                        Allow a second check-in near the end of class
                      </span>
                      <span className="font-caption text-caption text-secondary mt-0.5">
                        Prompt students 10 mins before end of lecture to verify retention and full session attendance.
                      </span>
                    </div>
                  </label>
                </div>

                {/* Real-time Alert Toggle */}
                <div className="p-4 rounded-xl bg-surface-container-low flex items-center justify-between gap-4 border border-surface-container-high">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0 mt-0.5">
                      <Bell className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-on-surface font-semibold">
                        Notify me of suspicious attempts
                      </span>
                      <span className="font-caption text-caption text-secondary leading-tight mt-0.5">
                        Real-time pop-up notification when proxy or spoofed attempts are detected.
                      </span>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={notifySuspicious}
                      onChange={(e) => setNotifySuspicious(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN: Interactive Geofence Map Card (7 cols) ── */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container-high flex flex-col gap-4">
                {/* Map Search & Quick Selector */}
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline h-4 w-4" />
                      <input
                        type="text"
                        value={selectedVenue}
                        onChange={(event) => setSelectedVenue(event.target.value)}
                        placeholder="Lecture hall or classroom"
                        className="w-full h-11 pl-10 pr-4 rounded-xl bg-surface-container-low border border-surface-container-high text-on-surface font-label-md text-label-md font-medium focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setGpsMessage("Reading this device for the class center.");
                          readDeviceCenter();
                        }}
                        className="h-11 px-3.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md font-semibold flex items-center gap-1.5 transition-all shadow-xs border border-surface-container-high cursor-pointer"
                        title="Use current device GPS"
                      >
                        <Crosshair className="text-primary h-4 w-4" />
                        <span>Current GPS</span>
                      </button>
                      <button
                        type="button"
                        className="h-11 px-3.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md font-semibold flex items-center gap-1.5 transition-all shadow-xs border border-surface-container-high cursor-pointer"
                        title="Sync via Bluetooth Beacon"
                      >
                        <Smartphone className="text-primary h-4 w-4" />
                        <span>Phone sync</span>
                      </button>
                    </div>
                  </div>

                  {/* Landmark Quick Chips */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    <span className="font-caption text-caption text-secondary shrink-0 font-medium">
                      Quick focus:
                    </span>
                    {["Lecture Hall B", "Science Quad", "Auditorium A", "Turing Computing Lab"].map(
                      (venue) => (
                        <button
                          key={venue}
                          type="button"
                          onClick={() => setSelectedVenue(venue)}
                          className={`px-3 py-1 rounded-full font-caption text-caption font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                            selectedVenue === venue
                              ? "bg-primary text-on-primary shadow-sm"
                              : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                          }`}
                        >
                          <MapPin className="h-3 w-3" />
                          <span>{venue}</span>
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Proactive Tip Box */}
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-secondary-fixed/50 text-on-secondary-fixed border border-secondary-container">
                  <Info className="text-primary h-5 w-5 mt-0.5 shrink-0" />
                  <div className="flex flex-col font-caption text-caption">
                    <span className="font-semibold text-on-surface">Precision location tip</span>
                    <span>
                      The class center is this device. Stand in the classroom and allow location before you create the session. Laptop GPS can be rough indoors, so press Current GPS again if the first reading looks wrong.
                    </span>
                    {gpsMessage && <span className="font-semibold text-on-surface">{gpsMessage}</span>}
                  </div>
                </div>

                {/* Map Viewport Simulator (Vector Styled Campus Layout) */}
                <div className="relative w-full h-[510px] rounded-xl overflow-hidden bg-[#eaf0f8] select-none shadow-inner border border-surface-container-high flex flex-col justify-between p-4">
                  {/* Inline Vector Map Canvas */}
                  <svg
                    className="absolute inset-0 w-full h-full"
                    preserveAspectRatio="xMidYMid slice"
                    viewBox="0 0 800 600"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <pattern id="campusGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#d5e3fc" strokeOpacity="0.6" strokeWidth="0.75" />
                      </pattern>
                    </defs>

                    <rect width="800" height="600" fill="#f0f6ff" />
                    <rect width="800" height="600" fill="url(#campusGrid)" />

                    {/* Lawns */}
                    <path d="M 40,80 Q 180,60 260,140 T 360,260 L 120,380 Z" fill="#d8f3e5" opacity="0.7" />
                    <path d="M 520,340 Q 640,300 740,400 L 760,560 L 460,580 Z" fill="#d8f3e5" opacity="0.6" />

                    {/* Pathways */}
                    <path d="M -20,280 Q 240,290 400,280 T 820,310" fill="none" stroke="#ffffff" strokeLinecap="round" strokeWidth="24" />
                    <path d="M 380,-20 L 380,620" fill="none" stroke="#ffffff" strokeLinecap="round" strokeWidth="20" />
                    <path d="M 120,400 L 680,120" fill="none" stroke="#ffffff" strokeWidth="14" />
                    <path d="M -20,280 Q 240,290 400,280 T 820,310" fill="none" stroke="#cbd5e1" strokeDasharray="6,6" strokeWidth="2" />

                    {/* Mathematics Dept */}
                    <g transform="translate(80, 110)">
                      <rect width="180" height="90" rx="8" fill="#cbdcf8" stroke="#94a3b8" strokeWidth="1.5" />
                      <text x="14" y="32" fill="#334155" fontFamily="Inter" fontSize="12" fontWeight="700">Dept of Mathematics</text>
                      <text x="14" y="48" fill="#64748b" fontFamily="Inter" fontSize="10">Wing A · Lab 1-4</text>
                    </g>

                    {/* Computer Science Complex (Target Lecture Hall B) */}
                    <g transform="translate(300, 180)">
                      <rect width="260" height="170" rx="10" fill="#ffffff" stroke="#93c5fd" strokeWidth="2" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.06))" />
                      <rect x="15" y="15" width="110" height="140" rx="6" fill="#e2eeff" />
                      <text x="24" y="42" fill="#1e40af" fontFamily="Inter" fontSize="13" fontWeight="700">{selectedVenue}</text>
                      <text x="24" y="60" fill="#475569" fontFamily="Inter" fontSize="10" fontWeight="600">Cap: 180 seats</text>
                      <rect x="135" y="15" width="110" height="65" rx="6" fill="#f8fafc" />
                      <text x="145" y="42" fill="#475569" fontFamily="Inter" fontSize="11" fontWeight="600">Faculty Offices</text>
                      <rect x="135" y="90" width="110" height="65" rx="6" fill="#f8fafc" />
                      <text x="145" y="118" fill="#475569" fontFamily="Inter" fontSize="11" fontWeight="600">Server Annex</text>
                    </g>

                    {/* Library */}
                    <g transform="translate(560, 60)">
                      <rect width="180" height="120" rx="8" fill="#d9e6fa" stroke="#94a3b8" strokeWidth="1.5" />
                      <text x="18" y="36" fill="#334155" fontFamily="Inter" fontSize="12" fontWeight="700">Central Library</text>
                      <text x="18" y="52" fill="#64748b" fontFamily="Inter" fontSize="10">Science &amp; Tech Stacks</text>
                    </g>

                    {/* Student Commons */}
                    <g transform="translate(180, 430)">
                      <rect width="210" height="100" rx="8" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />
                      <text x="18" y="34" fill="#334155" fontFamily="Inter" fontSize="12" fontWeight="700">Science Pavilion</text>
                      <text x="18" y="50" fill="#64748b" fontFamily="Inter" fontSize="10">Student Commons</text>
                    </g>

                    {/* Geofence Perimeter Circle (Dynamic Radius Visualization) */}
                    <g transform="translate(370, 260)">
                      {/* Outer Pulse */}
                      <circle
                        r={mapSvgRadius * 1.15}
                        fill="#1e40af"
                        fillOpacity="0.10"
                        stroke="#1e40af"
                        strokeWidth="1.5"
                        strokeDasharray="6,4"
                      />
                      {/* Active Geofence Area */}
                      <circle
                        r={mapSvgRadius}
                        fill="#3b82f6"
                        fillOpacity="0.18"
                        stroke="#1e40af"
                        strokeWidth="2.5"
                      />
                      {/* Radius Line & Label */}
                      <line x1="0" y1="0" x2={mapSvgRadius} y2="0" stroke="#1e40af" strokeWidth="2" strokeLinecap="round" />
                      <circle cx={mapSvgRadius} cy="0" r="4" fill="#1e40af" />
                      <rect x={Math.max(10, mapSvgRadius / 2 - 35)} y="-22" width="70" height="18" rx="4" fill="#1e40af" />
                      <text
                        x={Math.max(10, mapSvgRadius / 2)}
                        y="-10"
                        fill="#ffffff"
                        fontFamily="Inter"
                        fontSize="10"
                        fontWeight="700"
                        textAnchor="middle"
                      >
                        Radius: {radiusM}m
                      </text>
                    </g>
                  </svg>

                  {/* Centerpoint Marker Overlay */}
                  <div className="absolute left-[370px] top-[260px] -translate-x-1/2 -translate-y-full flex flex-col items-center pointer-events-auto cursor-grab z-20">
                    <div className="mb-1.5 px-3 py-1 rounded-lg bg-inverse-surface text-inverse-on-surface shadow-lg flex items-center gap-1.5 whitespace-nowrap animate-bounce">
                      <span className="w-2 h-2 rounded-full bg-tertiary-fixed"></span>
                      <span className="font-label-md text-label-md font-semibold">
                        Session Centerpoint: {selectedVenue}
                      </span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-xl ring-4 ring-white">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div className="w-4 h-1.5 bg-black/20 rounded-full blur-[1px] mt-0.5"></div>
                  </div>

                  {/* Top Map Coordinates Badge */}
                  <div className="relative z-10 flex items-center justify-between w-full">
                    <div className="bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-sm border border-surface-container-high flex items-center gap-2">
                      <Radio className="text-primary h-4 w-4" />
                      <span className="font-caption text-caption font-semibold text-on-surface">
                        GPS: 5.1155° N, 1.2909° W (UCC)
                      </span>
                      <span className="w-1 h-1 rounded-full bg-outline"></span>
                      <span className="font-caption text-caption text-secondary">
                        Accurate to 3.2 m
                      </span>
                    </div>

                    <div className="bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-sm border border-surface-container-high font-caption text-caption text-on-surface font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      <span>UCC Academic Campus Layer</span>
                    </div>
                  </div>

                  {/* Bottom Map Controls */}
                  <div className="relative z-10 flex items-end justify-between w-full">
                    <div className="bg-surface-container-lowest/90 backdrop-blur-md px-2.5 py-1 rounded-md shadow-xs border border-surface-container-high flex items-center gap-2 font-caption text-caption text-secondary font-medium">
                      <div className="w-12 h-1 bg-secondary rounded-full"></div>
                      <span>50 m</span>
                    </div>

                    <div className="flex flex-col gap-1.5 bg-surface-container-lowest/95 backdrop-blur-md p-1 rounded-xl shadow-md border border-surface-container-high">
                      <button
                        type="button"
                        onClick={() => setRadiusM((prev) => Math.min(300, prev + 20))}
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
                        title="Zoom in radius"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setRadiusM((prev) => Math.max(20, prev - 20))}
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
                        title="Zoom out radius"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <div className="h-[1px] w-full bg-surface-container-high"></div>
                      <button
                        type="button"
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
                        title="Orient North"
                      >
                        <Compass className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
                        title="Toggle Layer"
                      >
                        <Layers className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Campus Hall Details Strip */}
                <div className="grid grid-cols-3 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high flex flex-col">
                    <span className="font-caption text-caption text-secondary">Assigned Venue</span>
                    <span className="font-label-md text-label-md text-on-surface font-semibold truncate">
                      {selectedVenue}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high flex flex-col">
                    <span className="font-caption text-caption text-secondary">Beacon Coverage</span>
                    <span className="font-label-md text-label-md text-on-surface font-semibold flex items-center gap-1">
                      <Bluetooth className="text-green-600 h-4 w-4" />
                      <span>4 Nodes Active</span>
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high flex flex-col">
                    <span className="font-caption text-caption text-secondary">Estimated Catchment</span>
                    <span className="font-label-md text-label-md text-on-surface font-semibold">
                      100% of seats
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Sticky Action Bar Dock */}
          <div className="fixed bottom-0 left-0 md:left-72 right-0 bg-surface-container-lowest/95 backdrop-blur-xl border-t border-surface-container-high shadow-[0_-4px_16px_rgba(0,0,0,0.06)] z-30 px-6 lg:px-10 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary shrink-0">
                <Radio className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-label-md text-label-md text-on-surface font-semibold">
                    Geofence: {radiusM} m around {selectedVenue}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  <span className="font-caption text-caption text-secondary">
                    {windowDurationMinutes}-min check-in window
                  </span>
                </div>
                <span className="font-caption text-caption text-secondary">
                  Ready to initiate dynamic rotating QR protocol
                  {selectedClass ? ` for ${selectedClass.code}` : ""}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <Link
                href="/dashboard"
                className="h-11 px-5 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-label-lg text-label-md font-semibold transition-all flex items-center justify-center border border-surface-container-high cursor-pointer"
              >
                Cancel
              </Link>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isPending || classes.length === 0 || !center}
                className="h-11 px-6 rounded-xl bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-md font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creating session…</span>
                  </>
                ) : (
                  <>
                    <span>Create session and generate QR</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
