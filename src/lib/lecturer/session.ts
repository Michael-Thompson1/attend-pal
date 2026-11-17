import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/** Cookie session for page loads. Database rules still check the token. */
export const getLecturer = cache(async () => {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return { supabase, user: session?.user ?? null };
});

export type LecturerRecord = {
  full_name: string | null;
  institution: string | null;
  campus: string | null;
  photo_path: string | null;
};

/** One profile read shared by the lecturer frame and the page. */
export const getLecturerRecord = cache(async () => {
  const { supabase, user } = await getLecturer();
  if (!user) return { supabase, user, profile: null as LecturerRecord | null };
  const { data } = await supabase
    .from("lecturers")
    .select("full_name, institution, campus, photo_path")
    .eq("id", user.id)
    .maybeSingle();
  return { supabase, user, profile: data };
});

/** New alerts for this lecturer. Shared so every sidebar uses the same count. */
export const getOpenAlertCount = cache(async () => {
  const { supabase, user } = await getLecturer();
  if (!user) return 0;
  const { count } = await supabase
    .from("alerts")
    .select("id, sessions!inner(lecturer_id)", { count: "exact", head: true })
    .eq("sessions.lecturer_id", user.id)
    .eq("status", "new");
  return count ?? 0;
});

/** One signed photo URL shared by the frame and settings. */
export const getLecturerPhotoUrl = cache(async () => {
  const { supabase, profile } = await getLecturerRecord();
  if (!profile?.photo_path) return null;
  const { data } = await supabase.storage.from("lecturer-photos").createSignedUrl(profile.photo_path, 60 * 60);
  return data?.signedUrl ?? null;
});
