"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type SettingsActionResult = {
  success?: boolean;
  error?: string;
  photoUrl?: string | null;
  filename?: string;
  json?: string;
};

const PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_PHOTO_BYTES = 4 * 1024 * 1024;

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

function asWindow(value: number): 15 | 30 | 45 | 60 {
  if (value === 30 || value === 45 || value === 60) return value;
  return 15;
}

export async function updateProfileAction(input: {
  fullName: string;
  institution: string;
}): Promise<SettingsActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "You need to be signed in." };

  const fullName = input.fullName.trim();
  const institution = input.institution.trim();
  if (!fullName) return { error: "Enter your full name." };
  if (fullName.length > 120) return { error: "Name is too long." };
  if (!institution) return { error: "Enter your institution." };
  if (institution.length > 160) return { error: "Institution name is too long." };

  const { error } = await supabase
    .from("lecturers")
    .update({ full_name: fullName, institution })
    .eq("id", user.id);

  if (error) return { error: "Could not save your profile. Try again." };

  revalidatePath("/settings");
  return { success: true };
}

export async function uploadProfilePhotoAction(
  formData: FormData
): Promise<SettingsActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "You need to be signed in." };

  const photo = formData.get("photo");
  if (!photo || typeof photo === "string") return { error: "Choose a photo first." };

  const file = photo as File;
  const extension = PHOTO_TYPES[file.type];
  if (!extension) return { error: "Use a JPG, PNG, or WEBP photo." };
  if (file.size > MAX_PHOTO_BYTES) return { error: "Photo must be 4MB or smaller." };

  const path = `${user.id}/profile.${extension}`;
  const bytes = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from("lecturer-photos")
    .upload(path, bytes, { upsert: true, contentType: file.type });

  if (uploadError) {
    if (/bucket|not found/i.test(uploadError.message)) {
      return {
        error:
          "Photo storage is not ready yet. Run the settings database update in Supabase, then try again.",
      };
    }
    return { error: "Could not upload that photo. Try again." };
  }

  const { error: updateError } = await supabase
    .from("lecturers")
    .update({ photo_path: path })
    .eq("id", user.id);

  if (updateError) return { error: "The photo uploaded, but it could not be saved on your profile." };

  const { data: signed } = await supabase.storage
    .from("lecturer-photos")
    .createSignedUrl(path, 60 * 60);

  revalidatePath("/settings");
  return { success: true, photoUrl: signed?.signedUrl ?? null };
}

export async function removeProfilePhotoAction(): Promise<SettingsActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "You need to be signed in." };

  const { data: profile } = await supabase
    .from("lecturers")
    .select("photo_path")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.photo_path) {
    await supabase.storage.from("lecturer-photos").remove([profile.photo_path]);
  }

  const { error } = await supabase
    .from("lecturers")
    .update({ photo_path: null })
    .eq("id", user.id);

  if (error) return { error: "Could not remove your photo. Try again." };

  revalidatePath("/settings");
  return { success: true, photoUrl: null };
}

export async function updateSessionDefaultsAction(input: {
  radiusM: number;
  windowMinutes: number;
  requireLiveness: boolean;
  allowSecondCheckin: boolean;
}): Promise<SettingsActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "You need to be signed in." };

  const radiusM = Math.round(input.radiusM);
  if (radiusM < 20 || radiusM > 300) {
    return { error: "Class area must be between 20 and 300 metres." };
  }

  const { error } = await supabase
    .from("lecturer_settings")
    .update({
      default_radius_m: radiusM,
      default_window_minutes: asWindow(input.windowMinutes),
      default_require_liveness: input.requireLiveness,
      default_allow_second_checkin: input.allowSecondCheckin,
      updated_at: new Date().toISOString(),
    })
    .eq("lecturer_id", user.id);

  if (error) return { error: "Could not save session defaults. Try again." };

  revalidatePath("/settings");
  revalidatePath("/sessions/new");
  return { success: true };
}

export async function updateNotificationPrefsAction(input: {
  emailFakeIdentity: boolean;
  emailOutOfBounds: boolean;
  emailSharedDevice: boolean;
  emailSessionSummary: boolean;
}): Promise<SettingsActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "You need to be signed in." };

  const notifySuspicious =
    input.emailFakeIdentity || input.emailOutOfBounds || input.emailSharedDevice;

  const { error } = await supabase
    .from("lecturer_settings")
    .update({
      email_fake_identity: input.emailFakeIdentity,
      email_out_of_bounds: input.emailOutOfBounds,
      email_shared_device: input.emailSharedDevice,
      email_session_summary: input.emailSessionSummary,
      notify_suspicious: notifySuspicious,
      updated_at: new Date().toISOString(),
    })
    .eq("lecturer_id", user.id);

  if (error) return { error: "Could not save notification preferences. Try again." };

  revalidatePath("/settings");
  revalidatePath("/sessions/new");
  return { success: true };
}

export async function changePasswordAction(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<SettingsActionResult> {
  const { supabase, user } = await requireUser();
  if (!user?.email) return { error: "You need to be signed in." };

  const currentPassword = input.currentPassword;
  const newPassword = input.newPassword;
  const confirmPassword = input.confirmPassword;

  if (!currentPassword) return { error: "Enter your current password." };
  if (newPassword !== confirmPassword) return { error: "Passwords must match." };
  if (newPassword.length < 10) return { error: "Use at least 10 characters." };
  if (!/[A-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
    return { error: "Include an uppercase letter and a number." };
  }
  if (!/[^A-Za-z0-9]/.test(newPassword)) {
    return { error: "Include a symbol." };
  }

  const { error: currentError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (currentError) return { error: "Current password is incorrect." };

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: "Could not update your password. Try again." };

  return { success: true };
}

export async function signOutOtherDevicesAction(): Promise<SettingsActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "You need to be signed in." };

  const { error } = await supabase.auth.signOut({ scope: "others" });
  if (error) return { error: "Could not sign out other devices. Try again." };

  return { success: true };
}

export async function downloadMyDataAction(): Promise<SettingsActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "You need to be signed in." };

  const { data: profile } = await supabase
    .from("lecturers")
    .select("full_name, institution, campus, photo_path, created_at")
    .eq("id", user.id)
    .maybeSingle();

  const { data: settings } = await supabase
    .from("lecturer_settings")
    .select(
      "default_radius_m, default_window_minutes, default_require_liveness, default_allow_second_checkin, notify_suspicious, email_fake_identity, email_out_of_bounds, email_shared_device, email_session_summary, updated_at"
    )
    .eq("lecturer_id", user.id)
    .maybeSingle();

  const { data: classes } = await supabase
    .from("classes")
    .select("id, code, title, semester, programme, default_venue, created_at")
    .eq("lecturer_id", user.id);

  const classIds = (classes ?? []).map((row) => row.id);
  const { data: students } = classIds.length
    ? await supabase
        .from("students")
        .select("id, class_id, index_number, full_name, email, programme, level, created_at")
        .in("class_id", classIds)
    : { data: [] };

  const { data: sessions } = await supabase
    .from("sessions")
    .select(
      "id, class_id, title, starts_at, ends_at, venue_name, radius_m, require_liveness, allow_second_checkin, notify_suspicious, status, created_at, closed_at"
    )
    .eq("lecturer_id", user.id);

  const sessionIds = (sessions ?? []).map((row) => row.id);
  const { data: attendance } = sessionIds.length
    ? await supabase
        .from("attendance")
        .select("id, session_id, student_id, checkin_number, status, created_at, manual_reason")
        .in("session_id", sessionIds)
    : { data: [] };

  const { data: alerts } = sessionIds.length
    ? await supabase
        .from("alerts")
        .select("id, session_id, type, severity, claimed_index, status, created_at, distance_m")
        .in("session_id", sessionIds)
    : { data: [] };

  const json = JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      account: { email: user.email },
      profile: profile
        ? {
            fullName: profile.full_name,
            institution: profile.institution,
            campus: profile.campus,
            hasPhoto: Boolean(profile.photo_path),
            createdAt: profile.created_at,
          }
        : null,
      settings,
      classes: classes ?? [],
      students: students ?? [],
      sessions: sessions ?? [],
      attendance: attendance ?? [],
      alerts: alerts ?? [],
    },
    null,
    2
  );

  return { success: true, filename: "attend-pal-data.json", json };
}
