import AttendClientView from "@/components/student/attend-client-view";

export const metadata = {
  title: "Check in · Attend Pal",
};

const SAMPLE_SESSION = {
  code: "INF212",
  title: "Algorithms",
  lecturer: "Dr. Mensah",
  venue: "Lecture Hall B",
  whenLabel: "Today, 24 Oct · 10:00 AM – 11:30 AM",
  closesIn: "12:34",
};

export default async function AttendTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return <AttendClientView session={SAMPLE_SESSION} token={token} />;
}
