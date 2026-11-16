import LinkInactiveView from "@/components/student/link-inactive-view";
import { detectedAtLabel } from "@/lib/attend/check-in";

export const metadata = {
  title: "Check in · Attend Pal",
};

export default function AttendIndexPage() {
  const detected = detectedAtLabel();

  return (
    <main className="min-h-screen bg-surface text-on-surface">
      <div className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col">
        <LinkInactiveView
          venue=""
          course=""
          sessionId=""
          kioskName=""
          detectedTime={detected.time}
          detectedZone={detected.zone}
        />
      </div>
    </main>
  );
}
