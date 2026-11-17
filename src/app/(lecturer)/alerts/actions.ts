"use server";

import { getLecturer } from "@/lib/lecturer/session";

import { revalidatePath } from "next/cache";
export type AlertSeverityType = "high" | "medium" | "low";
export type AlertKindType =
  | "fake_identity"
  | "low_match"
  | "out_of_bounds"
  | "multi_index_device"
  | "window_cutoff";

export type AlertRow = {
  id: string;
  session_id: string;
  type: string;
  severity: string;
  claimed_index: string | null;
  student_id: string | null;
  distance_m: number | null;
  match_score: number | null;
  details: string | null;
  status: string;
  created_at: string;
  // joined
  student_name: string;
  student_index: string;
  session_code: string;
  session_title: string;
  venue_name: string;
};

/** Fetch all alerts for the authenticated lecturer across all sessions */
export async function getAllAlertsAction(filters?: {
  sessionId?: string;
  severity?: string;
  type?: string;
}): Promise<AlertRow[]> {
  const { supabase, user } = await getLecturer();

  if (!user) return [];

  // 1. Get all session IDs belonging to this lecturer
  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, class_id, title, venue_name")
    .eq("lecturer_id", user.id);

  if (!sessions || sessions.length === 0) return [];

  const sessionIds = sessions.map((s) => s.id);
  const classIds = [...new Set(sessions.map((s) => s.class_id))];

  // Fetch classes for code lookup
  const { data: classesData } = await supabase
    .from("classes")
    .select("id, code")
    .in("id", classIds);

  const classMap = new Map((classesData ?? []).map((c) => [c.id, c.code]));

  // 2. Build alerts query
  let query = supabase
    .from("alerts")
    .select("*")
    .in("session_id", sessionIds)
    .order("created_at", { ascending: false });

  if (filters?.sessionId) query = query.eq("session_id", filters.sessionId);

  const validSeverities: AlertSeverityType[] = ["high", "medium", "low"];
  if (
    filters?.severity &&
    validSeverities.includes(filters.severity as AlertSeverityType)
  ) {
    query = query.eq("severity", filters.severity as AlertSeverityType);
  }

  const validTypes: AlertKindType[] = [
    "fake_identity",
    "low_match",
    "out_of_bounds",
    "multi_index_device",
    "window_cutoff",
  ];
  if (filters?.type && validTypes.includes(filters.type as AlertKindType)) {
    query = query.eq("type", filters.type as AlertKindType);
  }

  const { data: alerts, error } = await query;
  if (error || !alerts) return [];

  // 3. Build a lookup for sessions
  const sessionMap = new Map(
    sessions.map((s) => [
      s.id,
      {
        code: classMap.get(s.class_id) ?? "N/A",
        title: s.title ?? "",
        venue: s.venue_name ?? "Unknown Hall",
      },
    ])
  );

  // 4. Fetch students involved
  const studentIds = [
    ...new Set(alerts.map((a) => a.student_id).filter(Boolean)),
  ] as string[];

  const studentMap = new Map<string, { full_name: string; index_number: string }>();
  if (studentIds.length > 0) {
    const { data: students } = await supabase
      .from("students")
      .select("id, full_name, index_number")
      .in("id", studentIds);
    students?.forEach((s) =>
      studentMap.set(s.id, {
        full_name: s.full_name,
        index_number: s.index_number,
      })
    );
  }

  // 5. Join and return
  return alerts.map((a) => {
    const sess = sessionMap.get(a.session_id);
    const student = a.student_id ? studentMap.get(a.student_id) : null;

    let detailsStr: string | null = null;
    if (typeof a.details === "string") {
      detailsStr = a.details;
    } else if (a.details !== null && a.details !== undefined) {
      detailsStr = JSON.stringify(a.details);
    }

    return {
      id: a.id,
      session_id: a.session_id,
      type: a.type,
      severity: a.severity,
      claimed_index: a.claimed_index,
      student_id: a.student_id,
      distance_m: a.distance_m,
      match_score:
        a.match_score == null
          ? null
          : a.match_score <= 1
            ? Math.round(a.match_score * 100)
            : Math.round(a.match_score),
      details: detailsStr,
      status: a.status,
      created_at: a.created_at,
      student_name: student?.full_name ?? a.claimed_index ?? "Unknown Student",
      student_index: student?.index_number ?? a.claimed_index ?? "N/A",
      session_code: sess?.code ?? "N/A",
      session_title: sess?.title ?? "",
      venue_name: sess?.venue ?? "Unknown Hall",
    };
  });
}

/** Mark an alert as reviewed */
export async function markAlertReviewedAction(alertId: string) {
  const { supabase, user } = await getLecturer();

  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("alerts")
    .update({ status: "reviewed" })
    .eq("id", alertId);

  if (error) return { error: error.message };

  revalidatePath("/alerts");
  return { success: true };
}

/** Dismiss an alert */
export async function dismissAlertFromCentreAction(alertId: string) {
  const { supabase, user } = await getLecturer();

  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("alerts")
    .update({ status: "dismissed" })
    .eq("id", alertId);

  if (error) return { error: error.message };

  revalidatePath("/alerts");
  return { success: true };
}

/** Mark a student present manually from an alert (creates/upserts attendance row) */
export async function markPresentFromAlertAction(
  alertId: string,
  sessionId: string,
  studentId: string
) {
  const { supabase, user } = await getLecturer();

  if (!user) return { error: "Unauthorized" };

  const { error: attErr } = await supabase.from("attendance").upsert({
    session_id: sessionId,
    student_id: studentId,
    status: "manual",
    manual_reason: "Manually marked present by lecturer from Alerts Centre",
    match_score: 100,
    distance_m: 0,
    checkin_number: 1,
  });

  if (attErr) return { error: attErr.message };

  // Mark the alert reviewed
  await supabase
    .from("alerts")
    .update({ status: "reviewed" })
    .eq("id", alertId);

  revalidatePath("/alerts");
  return { success: true };
}

/** Get list of sessions for the session filter dropdown */
export async function getLecturerSessionsForFilterAction() {
  const { supabase, user } = await getLecturer();

  if (!user) return [];

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, class_id, title, venue_name, status")
    .eq("lecturer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (!sessions || sessions.length === 0) return [];

  const classIds = [...new Set(sessions.map((s) => s.class_id))];
  const { data: classesData } = await supabase
    .from("classes")
    .select("id, code")
    .in("id", classIds);

  const classMap = new Map((classesData ?? []).map((c) => [c.id, c.code]));

  return sessions.map((s) => ({
    id: s.id,
    code: classMap.get(s.class_id) ?? "N/A",
    title: s.title ?? "",
    status: s.status ?? "closed",
  }));
}
