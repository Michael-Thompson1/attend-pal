import Link from "next/link";
import { Link2Off } from "lucide-react";

export const metadata = {
  title: "Check in · Attend Pal",
};

export default function AttendIndexPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col items-center justify-center gap-4 bg-surface px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-error-container text-error">
        <Link2Off className="h-7 w-7" />
      </div>
      <h1 className="font-headline-sm text-headline-sm text-on-surface">Link no longer active</h1>
      <p className="font-body-md text-body-md text-secondary">
        Open the class link from your lecturer, or scan the code they shared.
      </p>
      <Link
        href="/attend/demo"
        className="inline-flex h-14 w-full items-center justify-center rounded-xl bg-primary font-title-md text-title-md text-on-primary"
      >
        Open a sample check-in
      </Link>
    </main>
  );
}
