import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ReportsClientView from "@/components/lecturer/reports-client-view";
import {
  getLecturerClassesForReportsAction,
  getClassReportDataAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const classes = await getLecturerClassesForReportsAction();
  const defaultReportData =
    classes.length > 0 ? await getClassReportDataAction(classes[0].id) : null;

  return (
    <ReportsClientView
      classes={classes}
      initialReportData={defaultReportData}
    />
  );
}
