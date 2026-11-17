import { GraduationCap } from "lucide-react";

export function AttendMark({
  className = "h-10 w-10 rounded-xl",
  iconClassName = "h-5 w-5",
  tone = "solid",
}: {
  className?: string;
  iconClassName?: string;
  tone?: "solid" | "inverse";
}) {
  const surface =
    tone === "inverse" ? "bg-surface-container-lowest text-primary" : "bg-primary text-on-primary";
  return (
    <div className={`flex shrink-0 items-center justify-center shadow-sm ${surface} ${className}`}>
      <GraduationCap className={iconClassName} />
    </div>
  );
}
