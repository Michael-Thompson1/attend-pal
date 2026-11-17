import { getLecturer, getOpenAlertCount } from "@/lib/lecturer/session";
import { redirect } from "next/navigation";
import { getLecturerClassesAction } from "../actions";
import type { SavedPlace } from "../actions";
import CreateSessionClientView from "@/components/lecturer/create-session-client-view";

export const dynamic = "force-dynamic";

export default async function CreateSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string }>;
}) {
  const { class: classId } = await searchParams;
  const { supabase, user } = await getLecturer();

  if (!user) {
    redirect("/login");
  }

  const [classes, openAlertCount, { data: settings }, placesResult] = await Promise.all([
    getLecturerClassesAction(),
    getOpenAlertCount(),
    supabase
      .from("lecturer_settings")
      .select(
        "default_radius_m, default_window_minutes, default_require_liveness, default_allow_second_checkin, notify_suspicious"
      )
      .eq("lecturer_id", user.id)
      .maybeSingle(),
    supabase.from("lecturer_settings").select("saved_places").eq("lecturer_id", user.id).maybeSingle(),
  ]);
  const initialPlaces: SavedPlace[] = placesResult.error ? [] : (placesResult.data?.saved_places ?? []);

  return (
    <CreateSessionClientView
      classes={classes}
      openAlertCount={openAlertCount}
      initialPlaces={initialPlaces}
      initialClassId={classId}
      defaults={{
        radiusM: settings?.default_radius_m ?? 100,
        windowMinutes: settings?.default_window_minutes ?? 15,
        requireLiveness: settings?.default_require_liveness ?? true,
        allowSecondCheckin: settings?.default_allow_second_checkin ?? false,
        notifySuspicious: settings?.notify_suspicious ?? true,
      }}
    />
  );
}
