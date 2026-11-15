import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionDetailsAction } from "../../actions";
import SessionMonitorClientView from "@/components/lecturer/session-monitor-client-view";

export const dynamic = "force-dynamic";

const DEMO_MONITOR_SESSION = {
  class_id: "demo-class",
  class_code: "INF212",
  class_title: "Data Structures & Algorithms",
  title: "Lecture 14: Binary Search Trees & Balancing",
  starts_at: "2025-10-24T10:00:00.000Z",
  ends_at: "2025-10-24T10:15:00.000Z",
  venue_name: "Lecture Hall B",
  radius_m: 100,
  status: "open" as const,
  student_count: 52,
  checked_in_count: 38,
};

interface SessionMonitorPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SessionMonitorPage({
  params,
}: SessionMonitorPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const session = await getSessionDetailsAction(id);

  const sessionData = session
    ? {
        id: session.id,
        class_id: session.class_id,
        class_code: session.class_code,
        class_title: session.class_title,
        title: session.title,
        starts_at: session.starts_at,
        ends_at: session.ends_at,
        venue_name: session.venue_name,
        radius_m: session.radius_m,
        status: session.status,
        student_count: session.student_count,
        checked_in_count: session.checked_in_count,
      }
    : {
        id,
        ...DEMO_MONITOR_SESSION,
      };

  return <SessionMonitorClientView session={sessionData} />;
}
