import { AttendMark } from "@/components/brand/attend-mark";

export default function LecturerLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <AttendMark className="h-12 w-12 animate-pulse rounded-xl" iconClassName="h-6 w-6" />
    </div>
  );
}
