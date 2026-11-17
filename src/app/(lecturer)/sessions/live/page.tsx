import { getLecturer } from "@/lib/lecturer/session";
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";

export default async function LiveSessionRedirectPage() {
  const { supabase, user } = await getLecturer();

  if (!user) redirect("/login");

  // Fetch the latest session for this lecturer
  const { data: latestSession } = await supabase
    .from("sessions")
    .select("id")
    .eq("lecturer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (latestSession) {
    redirect(`/sessions/${latestSession.id}/qr`);
  }

  // If no session exists yet, redirect to sessions/new
  redirect("/sessions/new");
}
