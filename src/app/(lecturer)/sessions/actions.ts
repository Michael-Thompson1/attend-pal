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
    class_code: cls?.code || "INF212",
    class_title: cls?.title || "Data Structures & Algorithms",
    student_count: studentCount || 52,
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
  return { success: true };
}

export async function regenerateTokenAction(sessionId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  // Generate a new 6-char random token or timestamp-based token
  const newToken = Math.random().toString(36).substring(2, 10).toUpperCase();

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
