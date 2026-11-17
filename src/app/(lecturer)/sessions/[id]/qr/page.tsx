import { getLecturer, getOpenAlertCount } from "@/lib/lecturer/session";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { getSessionDetailsAction } from "../../actions";
import SessionQRClientView from "@/components/lecturer/session-qr-client-view";

export const dynamic = "force-dynamic";

const DEMO_FALLBACK_SESSION = {
  class_id: "demo-class",
  class_code: "INF212",
  class_title: "Data Structures & Algorithms",
  title: "Lecture 14: Binary Search Trees & Balanced AVL Trees",
  token: "AP7842",
  starts_at: "2025-10-24T10:00:00.000Z",
  ends_at: "2025-10-24T10:15:00.000Z",
  venue_name: "Lecture Hall B",
  center_lat: 5.1155,
  center_lng: -1.2909,
  radius_m: 100,
  require_liveness: true,
  allow_second_checkin: false,
  notify_suspicious: true,
  status: "open" as const,
  student_count: 52,
  checked_in_count: 12,
};

interface SessionQRPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SessionQRPage({ params }: SessionQRPageProps) {
  const { id } = await params;
  const { user } = await getLecturer();

  if (!user) {
    redirect("/login");
  }

  const headerList = await headers();
  const host = headerList.get("host") || "localhost:3000";
  const protocol = headerList.get("x-forwarded-proto") || "http";
  const baseUrl = `${protocol}://${host}`;

  const [session, openAlertCount] = await Promise.all([
    getSessionDetailsAction(id),
    getOpenAlertCount(),
  ]);

  // If session not found in database (e.g. previewing / testing), provide demo fallback
  const sessionData = session || {
    id,
    ...DEMO_FALLBACK_SESSION,
  };
  const attendUrl = `${baseUrl}/attend/${sessionData.token}`;
  const qrDataUrl = await QRCode.toDataURL(attendUrl, {
    width: 640,
    margin: 1,
    errorCorrectionLevel: "M",
  });

  return (
    <SessionQRClientView
      session={sessionData}
      baseUrl={baseUrl}
      qrDataUrl={qrDataUrl}
      openAlertCount={openAlertCount}
    />
  );
}
