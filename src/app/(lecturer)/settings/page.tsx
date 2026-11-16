import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SettingsClientView, {
  type SettingsViewData,
} from "@/components/lecturer/settings-client-view";

export const dynamic = "force-dynamic";

function asWindow(value: number): 15 | 30 | 45 | 60 {
  if (value === 30 || value === 45 || value === 60) return value;
  return 15;
}

function formatUpdated(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(iso));
}

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("lecturers")
    .select("full_name, institution, campus, photo_path")
    .eq("id", user.id)
    .maybeSingle();

  let { data: settings, error: settingsError } = await supabase
    .from("lecturer_settings")
    .select(
      "default_radius_m, default_window_minutes, default_require_liveness, default_allow_second_checkin, email_fake_identity, email_out_of_bounds, email_shared_device, email_session_summary, updated_at"
    )
    .eq("lecturer_id", user.id)
    .maybeSingle();

  if (!settings && !settingsError) {
    const inserted = await supabase
      .from("lecturer_settings")
      .insert({ lecturer_id: user.id })
      .select(
        "default_radius_m, default_window_minutes, default_require_liveness, default_allow_second_checkin, email_fake_identity, email_out_of_bounds, email_shared_device, email_session_summary, updated_at"
      )
      .single();
    settings = inserted.data;
    settingsError = inserted.error;
  }

  if (profileError || settingsError || !settings) {
    const detail = `${profileError?.message ?? ""} ${settingsError?.message ?? ""}`;
    const needsMigration = /column|schema cache|photo_path|email_/i.test(detail);
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-3 px-6">
        <h1 className="font-headline-sm text-headline-sm text-on-surface">
          {needsMigration ? "Settings need a database update" : "Settings could not be loaded"}
        </h1>
        <p className="font-body-md text-body-md text-secondary">
          {needsMigration
            ? "Open the Supabase SQL Editor and run db/migrations/2026_settings_photo_and_email.sql, then refresh this page."
            : "Refresh the page. If this keeps happening, check that you are signed in."}
        </p>
      </main>
    );
  }

  let photoUrl: string | null = null;
  if (profile?.photo_path) {
    const { data: signed } = await supabase.storage
      .from("lecturer-photos")
      .createSignedUrl(profile.photo_path, 60 * 60);
    photoUrl = signed?.signedUrl ?? null;
  }

  const fullName =
    profile?.full_name ||
    (user.user_metadata?.full_name as string) ||
    "Lecturer";

  const data: SettingsViewData = {
    fullName,
    email: user.email || "",
    institution: profile?.institution || "Faculty of Science",
    campus: profile?.campus || "Main Campus",
    photoUrl,
    radiusM: settings.default_radius_m,
    windowMinutes: asWindow(settings.default_window_minutes),
    requireLiveness: settings.default_require_liveness,
    allowSecondCheckin: settings.default_allow_second_checkin,
    emailFakeIdentity: settings.email_fake_identity,
    emailOutOfBounds: settings.email_out_of_bounds,
    emailSharedDevice: settings.email_shared_device,
    emailSessionSummary: settings.email_session_summary,
    updatedLabel: formatUpdated(settings.updated_at),
  };

  return <SettingsClientView data={data} />;
}
