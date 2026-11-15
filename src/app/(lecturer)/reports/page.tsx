import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ReportsClientView from "@/components/lecturer/reports-client-view";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <ReportsClientView />;
}
