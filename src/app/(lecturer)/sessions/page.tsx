import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  BarChart3,
  Bell,
  BookOpen,
  Clock,
  DoorClosed,
  GraduationCap,
  LayoutGrid,
  LogOut,
  MapPin,
  Plus,
  Settings,
  User,
} from "lucide-react";
import { signOutAction } from "@/app/auth/actions";
import HeaderSearch from "@/components/lecturer/header-search";

export const dynamic = "force-dynamic";

type SessionRow = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  venue_name: string | null;
  status: "open" | "closed";
  classes: { code: string; title: string } | { code: string; title: string }[] | null;
};

function courseOf(row: SessionRow) {
  const course = Array.isArray(row.classes) ? row.classes[0] : row.classes;
  return { code: course?.code || "Class", title: course?.title || row.title };
}

function whenLabel(startIso: string, endIso: string) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const date = start.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const clock = (value: Date) =>
    value.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const minutes = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));
  return { date, range: `${clock(start)} – ${clock(end)}`, window: `${minutes}m window` };
}

function phase(row: SessionRow, now: number) {
  const start = new Date(row.starts_at).getTime();
  const end = new Date(row.ends_at).getTime();
  if (row.status === "closed" || now > end) return "Completed";
  if (now < start) return "Scheduled";
  return "Live";
}

export default async function SessionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("lecturers")
    .select("full_name, campus")
    .eq("id", user.id)
    .single();
  const profile = profileData as { full_name?: string; campus?: string } | null;
  const fullName =
    profile?.full_name ||
    (user.user_metadata?.full_name as string) ||
    user.email?.split("@")[0] ||
    "Lecturer";
  const campusName = profile?.campus || "Campus";

  const { count: classesCount } = await supabase
    .from("classes")
    .select("id", { count: "exact", head: true })
    .eq("lecturer_id", user.id);

  const { count: openAlerts } = await supabase
    .from("alerts")
    .select("id, sessions!inner(lecturer_id)", { count: "exact", head: true })
    .eq("sessions.lecturer_id", user.id)
    .eq("status", "new");

  const { data: rawSessions } = await supabase
    .from("sessions")
    .select("id, title, starts_at, ends_at, venue_name, status, classes(code, title)")
    .eq("lecturer_id", user.id)
    .order("starts_at", { ascending: false });

  const sessions = (rawSessions as unknown as SessionRow[]) || [];
  const now = new Date().getTime();

  const linkClass =
    "flex items-center gap-3 rounded-xl px-4 py-2.5 font-label-lg text-label-md font-medium text-on-surface-variant transition-all hover:bg-surface-container-high hover:text-on-surface";

  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="fixed top-0 left-0 z-50 hidden h-full w-72 flex-col justify-between border-r border-surface-container-high bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] md:flex">
        <div>
          <div className="flex h-16 items-center gap-3 border-b border-surface-container-high px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-on-primary shadow-sm">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-title-lg text-title-lg font-bold tracking-tight text-primary">Attend Pal</span>
              <span className="font-caption text-caption text-secondary">Lecturer Portal</span>
            </div>
          </div>
          <nav className="flex flex-col gap-1 px-4 pt-6">
            <Link href="/dashboard" className={linkClass}>
              <LayoutGrid className="h-5 w-5" />
              Dashboard
            </Link>
            <Link href="/classes" className={linkClass}>
              <BookOpen className="h-5 w-5" />
              Classes
              {classesCount ? (
                <span className="ml-auto rounded-full bg-surface-container px-2 py-0.5 font-caption text-caption font-semibold text-on-surface-variant">
                  {classesCount}
                </span>
              ) : null}
            </Link>
            <Link
              href="/sessions"
              aria-current="page"
              className="flex items-center gap-3 rounded-xl bg-primary-container px-4 py-2.5 font-label-lg text-label-md font-semibold text-on-primary shadow-sm"
            >
              <Clock className="h-5 w-5" />
              Sessions
            </Link>
            <Link href="/alerts" className="flex items-center justify-between rounded-xl px-4 py-2.5 font-label-lg text-label-md font-medium text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface">
              <span className="flex items-center gap-3">
                <Bell className="h-5 w-5" />
                Alerts
              </span>
              <span className="rounded-full bg-error-container px-2 py-0.5 font-caption text-caption font-bold text-on-error-container">
                {openAlerts ?? 0}
              </span>
            </Link>
            <Link href="/reports" className={linkClass}>
              <BarChart3 className="h-5 w-5" />
              Reports
            </Link>
            <Link href="/settings" className={linkClass}>
              <Settings className="h-5 w-5" />
              Settings
            </Link>
          </nav>
        </div>
        <div className="space-y-4 border-t border-surface-container-high p-4">
          <div className="rounded-xl border border-surface-container-high bg-surface-container-low p-3">
            <div className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
              <div className="min-w-0">
                <span className="font-caption text-[11px] font-semibold tracking-wider text-secondary uppercase">Campus</span>
                <span className="block truncate font-label-md text-label-md font-semibold text-on-surface">{campusName}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-container font-caption font-bold text-on-primary">
                {fullName.charAt(0)}
              </div>
              <div className="min-w-0">
                <span className="block truncate font-label-md text-label-md font-semibold text-on-surface">{fullName}</span>
                <span className="block truncate font-caption text-[11px] text-secondary">{user.email}</span>
              </div>
            </div>
            <form action={signOutAction}>
              <button type="submit" title="Sign out" className="rounded-lg p-1.5 text-secondary hover:bg-error-container/20 hover:text-error">
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col md:pl-72">
        <header className="fixed top-0 right-0 left-0 z-40 flex h-16 items-center justify-between border-b border-surface-container-high bg-surface-container-lowest/90 px-6 backdrop-blur-xl md:left-72 lg:px-10">
          <HeaderSearch />
          <div className="flex items-center gap-4">
            <Link href="/alerts" aria-label="Notifications" className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high">
              <Bell className="h-5 w-5" />
            </Link>
            <div className="hidden items-center gap-2.5 rounded-full bg-surface-container-low py-1.5 pr-3.5 pl-2 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-on-primary">
                <User className="h-4 w-4" />
              </div>
              <span className="font-label-md text-label-md font-semibold text-on-surface">{fullName}</span>
            </div>
          </div>
        </header>

        <main className="flex flex-col gap-6 px-6 pt-24 pb-12 lg:px-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface">Sessions</h1>
              <p className="font-body-md text-body-md text-secondary">Open a QR pass, watch the room, or review a finished session.</p>
            </div>
            <Link href="/sessions/new" className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary-container px-4 font-label-lg text-label-lg font-semibold text-on-primary shadow-sm">
              <Plus className="h-5 w-5" />
              New session
            </Link>
          </div>

          <section className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-6 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead>
                  <tr className="bg-surface-container-low font-label-md text-label-md text-secondary">
                    <th className="rounded-l-xl px-4 py-3">Course &amp; Code</th>
                    <th className="px-4 py-3">Date &amp; Time</th>
                    <th className="px-4 py-3">Window</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="rounded-r-xl px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high font-body-md text-label-md text-on-surface">
                  {sessions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-secondary">
                        No sessions yet. Create one when the class is about to start.
                      </td>
                    </tr>
                  ) : (
                    sessions.map((session) => {
                      const course = courseOf(session);
                      const when = whenLabel(session.starts_at, session.ends_at);
                      const status = phase(session, now);
                      return (
                        <tr key={session.id} className="hover:bg-surface-container-low/70">
                          <td className="px-4 py-4">
                            <span className="block font-title-md text-title-md font-semibold">{course.code} · {session.title}</span>
                            <span className="font-caption text-caption text-secondary">{course.title}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="block font-semibold">{when.date}</span>
                            <span className="font-caption text-caption text-secondary">{when.range}</span>
                          </td>
                          <td className="px-4 py-4 text-secondary">{when.window}</td>
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center gap-1.5">
                              <DoorClosed className="h-4 w-4 text-secondary" />
                              {session.venue_name || "Classroom"}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex rounded-full px-2.5 py-1 font-caption text-caption font-bold ${status === "Live" ? "bg-tertiary-container/15 text-tertiary-container" : "bg-surface-container text-primary"}`}>
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
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
