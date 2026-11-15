import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AlertsClientView from "@/components/lecturer/alerts-client-view";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <AlertsClientView />;
}
