import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLecturerClassesAction } from "../actions";
import CreateSessionClientView from "@/components/lecturer/create-session-client-view";

export const dynamic = "force-dynamic";

export default async function CreateSessionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const classes = await getLecturerClassesAction();

  const { data: settings } = await supabase
    .from("lecturer_settings")
    .select(
      "default_radius_m, default_window_minutes, default_require_liveness, default_allow_second_checkin, notify_suspicious"
    )
    .eq("lecturer_id", user.id)
    .maybeSingle();

  return (
    <CreateSessionClientView
      classes={classes}
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
