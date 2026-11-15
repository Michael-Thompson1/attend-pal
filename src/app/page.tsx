import Link from "next/link";
import { GraduationCap, ArrowRight, UserPlus, LogIn } from "lucide-react";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 bg-surface text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-container text-on-primary shadow-lg">
        <GraduationCap className="h-9 w-9 text-on-primary" />
      </div>
      <div>
        <h1 className="text-display-lg text-primary font-bold">Attend Pal</h1>
        <p className="mt-2 text-body-lg text-secondary">
          University attendance verification system
        </p>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row items-center gap-4">
        <Link
          href="/login"
          className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-primary-container px-6 py-3 font-label-lg text-label-lg font-semibold text-on-primary shadow-md transition-all hover:bg-primary"
        >
          <LogIn className="h-5 w-5" />
          <span>Lecturer Log In</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/register"
          className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-surface-container-low px-6 py-3 font-label-lg text-label-lg font-semibold text-on-surface shadow-sm transition-all hover:bg-surface-container"
        >
          <UserPlus className="h-5 w-5" />
          <span>Lecturer Registration</span>
        </Link>
      </div>
      <p className="mt-8 font-caption text-caption text-outline">
        Pass 1: UI Look &amp; Feel Active
      </p>
    </main>
  );
}
