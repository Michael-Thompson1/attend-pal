import { getLecturer } from "@/lib/lecturer/session";
import { redirect } from "next/navigation";
import AlertsClientView from "@/components/lecturer/alerts-client-view";
import {
  getAllAlertsAction,
  getLecturerSessionsForFilterAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  const { user } = await getLecturer();

  if (!user) {
    redirect("/login");
  }

  const [alerts, sessionOptions] = await Promise.all([
    getAllAlertsAction(),
    getLecturerSessionsForFilterAction(),
  ]);

  return <AlertsClientView initialAlerts={alerts} sessionOptions={sessionOptions} />;
}
