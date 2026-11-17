import { getLecturer, getOpenAlertCount } from "@/lib/lecturer/session";
import { redirect } from "next/navigation";
import ReportsClientView from "@/components/lecturer/reports-client-view";
import {
  getLecturerClassesForReportsAction,
  getClassReportDataAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const { user } = await getLecturer();

  if (!user) {
    redirect("/login");
  }

  const [classes, openAlertCount] = await Promise.all([
    getLecturerClassesForReportsAction(),
    getOpenAlertCount(),
  ]);
  const defaultReportData =
    classes.length > 0 ? await getClassReportDataAction(classes[0].id) : null;

  return (
    <ReportsClientView
      classes={classes}
      initialReportData={defaultReportData}
      openAlertCount={openAlertCount}
    />
  );
}
