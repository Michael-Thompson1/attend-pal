"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createSessionAction(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const classId = formData.get("class_id") as string;
  const title = formData.get("title") as string;
  const startsAt = formData.get("starts_at") as string;
  const endsAt = formData.get("ends_at") as string;
  const radiusM = parseInt(formData.get("radius_m") as string, 10) || 100;
  const venueName = (formData.get("venue_name") as string) || null;
  const requireLiveness = formData.get("require_liveness") === "true";
  const allowSecondCheckin = formData.get("allow_second_checkin") === "true";
  const notifySuspicious = formData.get("notify_suspicious") === "true";

  // UCC main campus coordinates (default)
  const centerLat = parseFloat(
    (formData.get("center_lat") as string) || "5.1155"
  );
  const centerLng = parseFloat(
    (formData.get("center_lng") as string) || "-1.2909"
  );

  if (!classId || !title || !startsAt || !endsAt) {
    return { error: "Please fill in all required fields." };
  }

  const { data, error } = await supabase
    .from("sessions")
    .insert({
      class_id: classId,
      lecturer_id: user.id,
      title,
      starts_at: startsAt,
      ends_at: endsAt,
      radius_m: radiusM,
      venue_name: venueName,
      center_lat: centerLat,
      center_lng: centerLng,
      require_liveness: requireLiveness,
      allow_second_checkin: allowSecondCheckin,
      notify_suspicious: notifySuspicious,
      status: "open",
    })
    .select("id, token")
    .single();

  if (error) {
    console.error("createSessionAction error:", error);
    return { error: error.message };
  }

  redirect(`/sessions/${data.id}/qr`);
}

export async function getLecturerClassesAction() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("classes")
    .select("id, code, title, default_venue")
    .eq("lecturer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return [];

  return data ?? [];
}

export async function getSessionDetailsAction(sessionId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: session, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (error || !session) return null;

  // Get class details
  const { data: cls } = await supabase
    .from("classes")
    .select("id, code, title, default_venue")
    .eq("id", session.class_id)
    .single();

  // Get student count for this class
  const { count: studentCount } = await supabase
    .from("students")
    .select("*", { count: "exact", head: true })
    .eq("class_id", session.class_id);

  // Get checked-in count for this session
  const { count: checkedInCount } = await supabase
    .from("attendance")
    .select("*", { count: "exact", head: true })
    .eq("session_id", session.id)
    .eq("status", "verified");

  return {
    ...session,
    class_code: cls?.code || "Class",
    class_title: cls?.title || session.title,
    student_count: studentCount ?? 0,
    checked_in_count: checkedInCount || 0,
  };
}

export async function closeSessionAction(sessionId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("sessions")
    .update({
      status: "closed",
      closed_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("lecturer_id", user.id);

  if (error) return { error: error.message };

  revalidatePath(`/sessions/${sessionId}/qr`);
  revalidatePath(`/sessions/${sessionId}/monitor`);
  revalidatePath("/sessions");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function regenerateTokenAction(sessionId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const newToken = `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, "");

  const { error } = await supabase
    .from("sessions")
    .update({
      token: newToken,
    })
    .eq("id", sessionId)
    .eq("lecturer_id", user.id);

  if (error) return { error: error.message };

  revalidatePath(`/sessions/${sessionId}/qr`);
  return { success: true, token: newToken };
}

export async function getSessionAttendanceAction(sessionId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // Fetch attendance records for this session
  const { data: attendance, error } = await supabase
    .from("attendance")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false });

  if (error || !attendance) return [];

  // Collect student IDs
  const studentIds = Array.from(new Set(attendance.map((a) => a.student_id)));

  // Fetch student info
  let studentsMap = new Map<string, { full_name: string; index_number: string }>();
  if (studentIds.length > 0) {
    const { data: students } = await supabase
      .from("students")
      .select("id, full_name, index_number")
      .in("id", studentIds);

    if (students) {
      studentsMap = new Map(students.map((s) => [s.id, s]));
    }
  }

  return attendance.map((a) => {
    const st = studentsMap.get(a.student_id);
    return {
      ...a,
      student_name: st?.full_name || "Unknown Student",
      student_index: st?.index_number || "N/A",
    };
  });
}

export async function getSessionAlertsAction(sessionId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: alerts, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false });

  if (error || !alerts) return [];

  return alerts;
}

export async function manualAttendanceOverrideAction(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const sessionId = formData.get("session_id") as string;
  const studentId = formData.get("student_id") as string;
  const reason = formData.get("reason") as string;
  const note = formData.get("note") as string;
  const fullReason = note ? `${reason}: ${note}` : reason;

  const { error } = await supabase
    .from("attendance")
    .upsert({
      session_id: sessionId,
      student_id: studentId,
      status: "manual",
      manual_reason: fullReason,
      match_score: 100,
      distance_m: 0,
      checkin_number: 1,
    });

  if (error) return { error: error.message };

  // If there's an alert for this student in this session, mark reviewed
  await supabase
    .from("alerts")
    .update({ status: "reviewed" })
    .eq("session_id", sessionId)
    .eq("student_id", studentId);

  revalidatePath(`/sessions/${sessionId}/monitor`);
  return { success: true };
}

export async function extendSessionWindowAction(
  sessionId: string,
  additionalMinutes: number = 5
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { data: session } = await supabase
    .from("sessions")
    .select("ends_at")
    .eq("id", sessionId)
    .single();

  if (!session) return { error: "Session not found" };

  const currentEnd = new Date(session.ends_at);
  const newEnd = new Date(
    currentEnd.getTime() + additionalMinutes * 60 * 1000
  );

  const { error } = await supabase
    .from("sessions")
    .update({ ends_at: newEnd.toISOString() })
    .eq("id", sessionId);

  if (error) return { error: error.message };

  revalidatePath(`/sessions/${sessionId}/monitor`);
  return { success: true, newEndsAt: newEnd.toISOString() };
}

export async function dismissAlertAction(alertId: string, sessionId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("alerts")
    .update({ status: "dismissed" })
    .eq("id", alertId);

  if (error) return { error: error.message };

  revalidatePath(`/sessions/${sessionId}/monitor`);
  return { success: true };
}
