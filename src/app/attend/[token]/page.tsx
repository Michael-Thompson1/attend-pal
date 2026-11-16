import AttendClientView from "@/components/student/attend-client-view";
import { detectedAtLabel, loadAttendView } from "@/lib/attend/check-in";

export const metadata = {
  title: "Check in · Attend Pal",
};

export default async function AttendTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const view = await loadAttendView(token);
  const detected = detectedAtLabel();

  return (
    <AttendClientView
      session={view.session}
      token={token}
      initialStep={view.step}
      detectedTime={detected.time}
      detectedZone={detected.zone}
    />
  );
}
