import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SettingsClientView from "@/components/lecturer/settings-client-view";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <SettingsClientView />;
}
