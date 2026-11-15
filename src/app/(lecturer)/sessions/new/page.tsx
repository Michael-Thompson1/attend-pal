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

  return <CreateSessionClientView classes={classes} />;
}
