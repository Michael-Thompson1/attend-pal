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
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  Info,
  LogOut,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { signOutAction } from "@/app/auth/actions";
import { createSessionAction, deletePlaceAction, savePlaceAction, type SavedPlace } from "@/app/(lecturer)/sessions/actions";

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
  initialPlaces?: SavedPlace[];
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
  initialPlaces = [],
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
  const [selectedVenue, setSelectedVenue] = useState("");
  const [places, setPlaces] = useState<SavedPlace[]>(initialPlaces);
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsMessage, setGpsMessage] = useState("Reading this device for the class center.");
  const [placeMessage, setPlaceMessage] = useState<string | null>(null);
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

  async function saveCurrentPlace() {
    if (!center) {
      setPlaceMessage("Set the class center with Current GPS before saving a place.");
      return;
    }
    setPlaceMessage(null);
    const result = await savePlaceAction({ name: selectedVenue, lat: center.lat, lng: center.lng });
    setPlaces(result.places);
    setPlaceMessage(result.error);
  }

  async function removePlace(place: SavedPlace) {
    const confirmed = window.confirm(`Delete the saved place “${place.name}”?`);
    if (!confirmed) return;
    const result = await deletePlaceAction(place.id);
    setPlaces(result.places);
    setPlaceMessage(result.error);
  }

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
                        onClick={saveCurrentPlace}
                        className="h-11 px-3.5 rounded-xl bg-primary-container text-on-primary font-label-md text-label-md font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      >
                        <MapPin className="h-4 w-4" />
                        <span>Save place</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    <span className="font-caption text-caption text-secondary shrink-0 font-medium">
                      Saved places:
                    </span>
                    {places.length === 0 && (
                      <span className="font-caption text-caption text-secondary">None yet. Name a place, set the center, then save it.</span>
                    )}
                    {places.map((place) => (
                      <span
                        key={place.id}
                        className="inline-flex items-center gap-1 rounded-full bg-surface-container px-2 py-1 font-caption text-caption font-semibold text-on-surface"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedVenue(place.name);
                            setCenter({ lat: place.lat, lng: place.lng });
                            setGpsMessage(`Class center is ${place.name}.`);
                          }}
                          className="inline-flex items-center gap-1 px-1"
                        >
                          <MapPin className="h-3 w-3" />
                          {place.name}
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${place.name}`}
                          onClick={() => removePlace(place)}
                          className="inline-flex h-6 w-6 items-center justify-center rounded-full text-secondary hover:bg-error-container/40 hover:text-error"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  {placeMessage && <p className="font-caption text-caption text-error">{placeMessage}</p>}
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

                <div className="relative h-[510px] w-full overflow-hidden rounded-xl border border-surface-container-high bg-surface-container shadow-inner">
                  {center ? (
                    <iframe
                      title="Class center map"
                      className="absolute inset-0 h-full w-full border-0"
                      src={`https://maps.google.com/maps?q=${center.lat},${center.lng}&z=18&hl=en&output=embed`}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-6 text-center font-body-md text-body-md text-secondary">
                      Allow location, or press Current GPS, to see this place on the map.
                    </div>
                  )}
                  <div className="pointer-events-none absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2">
                    <div className="pointer-events-auto rounded-lg border border-surface-container-high bg-surface-container-lowest/95 px-3 py-1.5 font-caption text-caption font-semibold text-on-surface shadow-sm">
                      {center
                        ? `${center.lat.toFixed(5)}, ${center.lng.toFixed(5)} · radius ${radiusM} m`
                        : "Waiting for a location"}
                    </div>
                    {center && (
                      <a
                        href={`https://www.google.com/maps?q=${center.lat},${center.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="pointer-events-auto rounded-lg border border-surface-container-high bg-surface-container-lowest/95 px-3 py-1.5 font-caption text-caption font-semibold text-primary shadow-sm"
                      >
                        Open in Google Maps
                      </a>
                    )}
                  </div>
                  <div className="absolute right-3 bottom-3 z-10 flex flex-col gap-1.5 rounded-xl border border-surface-container-high bg-surface-container-lowest/95 p-1 shadow-md">
                    <button
                      type="button"
                      onClick={() => setRadiusM((prev) => Math.min(300, prev + 20))}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                      title="Increase radius"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setRadiusM((prev) => Math.max(20, prev - 20))}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                      title="Decrease radius"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-3">
                  <div className="flex flex-col rounded-xl border border-surface-container-high bg-surface-container-low p-3">
                    <span className="font-caption text-caption text-secondary">Place</span>
                    <span className="truncate font-label-md text-label-md font-semibold text-on-surface">
                      {selectedVenue.trim() || "Not named yet"}
                    </span>
                  </div>
                  <div className="flex flex-col rounded-xl border border-surface-container-high bg-surface-container-low p-3">
                    <span className="font-caption text-caption text-secondary">Coordinates</span>
                    <span className="font-label-md text-label-md font-semibold text-on-surface">
                      {center ? `${center.lat.toFixed(5)}, ${center.lng.toFixed(5)}` : "Not set"}
                    </span>
                  </div>
                  <div className="flex flex-col rounded-xl border border-surface-container-high bg-surface-container-low p-3">
                    <span className="font-caption text-caption text-secondary">Check-in radius</span>
                    <span className="font-label-md text-label-md font-semibold text-on-surface">{radiusM} m</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Sticky Action Bar Dock */}
          <div className="fixed bottom-0 left-0 md:left-72 right-0 bg-surface-container-lowest/95 backdrop-blur-xl border-t border-surface-container-high shadow-[0_-4px_16px_rgba(0,0,0,0.06)] z-30 px-6 lg:px-10 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary shrink-0">
                <Crosshair className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-label-md text-label-md text-on-surface font-semibold">
                    Geofence: {radiusM} m{selectedVenue.trim() ? ` around ${selectedVenue.trim()}` : ""}
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
