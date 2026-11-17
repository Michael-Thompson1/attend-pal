import type { Metadata } from "next";
import Link from "next/link";
import { AttendMark } from "@/components/brand/attend-mark";

export const metadata: Metadata = {
  title: "Privacy policy - Attend Pal",
  description: "How Attend Pal handles lecturer accounts, class lists, check-ins, photos, and location.",
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-surface text-on-surface">
      <header className="sticky top-0 z-50 w-full border-b border-outline-variant/30 bg-surface-container-lowest shadow-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <AttendMark />
            <span className="font-headline-sm text-headline-sm font-bold tracking-tight text-primary">Attend Pal</span>
          </Link>
          <Link href="/login" className="font-label-md text-label-md font-semibold text-primary">
            Lecturer log in
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <p className="font-caption text-caption font-semibold tracking-wider text-primary">PRIVACY POLICY</p>
        <h1 className="mt-2 font-headline-lg text-headline-lg font-bold tracking-tight text-primary">
          How Attend Pal handles data
        </h1>
        <p className="mt-3 font-body-md text-body-md text-secondary">Last updated 17 November 2026.</p>

        <div className="mt-10 flex flex-col gap-8 font-body-md text-body-md leading-relaxed text-on-surface">
          <section>
            <h2 className="font-title-lg text-title-lg font-semibold">What this covers</h2>
            <p className="mt-2 text-secondary">
              Attend Pal is a class attendance tool. Lecturers have accounts. Students do not. A student checks in from a link or QR code with an index number, a location check, and a face photo.
            </p>
          </section>

          <section>
            <h2 className="font-title-lg text-title-lg font-semibold">We do not sell or share your data</h2>
            <p className="mt-2 text-secondary">
              We do not sell personal information. We do not give it to advertisers, data brokers, or other universities. A lecturer sees the classes, students, and check-ins on their own account. Nobody else gets that information from us.
            </p>
            <p className="mt-2 text-secondary">
              The site is hosted so it can run. The pages are served by Vercel and the records are stored in Supabase. Those companies process the data only to operate Attend Pal. That is not a sale and it is not shared for their own use.
            </p>
          </section>

          <section>
            <h2 className="font-title-lg text-title-lg font-semibold">Lecturer accounts</h2>
            <p className="mt-2 text-secondary">
              When a lecturer creates an account we keep their name, school email, institution, and campus. The password is stored by the sign-in service as a protected secret. We cannot read it. An optional profile photo is kept in a private store and shown only inside that lecturer&apos;s portal.
            </p>
            <p className="mt-2 text-secondary">
              We also keep the classes, session times, class-center coordinates, check-in radius, and any named places the lecturer saves for later sessions.
            </p>
          </section>

          <section>
            <h2 className="font-title-lg text-title-lg font-semibold">Class lists</h2>
            <p className="mt-2 text-secondary">
              A lecturer uploads the class list. We keep each student&apos;s index number and name. Email, programme, and level are stored only if the lecturer includes them. A student email is not required, and Attend Pal does not send mail to students.
            </p>
            <p className="mt-2 text-secondary">
              A reference photo, if the lecturer uploads one, is kept in a private store and used only to compare the person in front of the camera with the person on the class list.
            </p>
          </section>

          <section>
            <h2 className="font-title-lg text-title-lg font-semibold">Check-in</h2>
            <p className="mt-2 text-secondary">
              A check-in uses the index number, the time, and whether the phone is inside the class area. We keep the distance from the class center and how accurate the reading was. We do not keep a trail of where the phone goes before or after that check, and we do not keep following the phone.
            </p>
            <p className="mt-2 text-secondary">
              The network address and a device marker are turned into a one-way code. We use that code to notice repeated attempts and a phone used for more than one index number. We do not store the address or the device marker itself.
            </p>
          </section>

          <section>
            <h2 className="font-title-lg text-title-lg font-semibold">Photos</h2>
            <p className="mt-2 text-secondary">
              A selfie from a successful check-in is used for the face check and then discarded. It is not saved.
            </p>
            <p className="mt-2 text-secondary">
              If the face check fails or needs review, one photo may be kept with the alert so the lecturer can look at it. That photo is deleted after 7 days.
            </p>
          </section>

          <section>
            <h2 className="font-title-lg text-title-lg font-semibold">How long we keep it</h2>
            <p className="mt-2 text-secondary">
              Class lists, attendance results, and alerts stay on the lecturer&apos;s account until the lecturer deletes the class, the session, or the account. Failed-check photos expire after 7 days. Signing out ends the session in that browser.
            </p>
          </section>

          <section>
            <h2 className="font-title-lg text-title-lg font-semibold">Your choices</h2>
            <p className="mt-2 text-secondary">
              A lecturer can download a copy of their account data, or delete the account, from Settings. Deleting the account removes their classes, sessions, and attendance records. A student who wants a record corrected should ask the lecturer for that class.
            </p>
          </section>

          <section>
            <h2 className="font-title-lg text-title-lg font-semibold">Changes</h2>
            <p className="mt-2 text-secondary">
              If this policy changes, the new version will be on this page with a new date.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-outline-variant/30 bg-surface-container-low py-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6">
          <p className="font-caption text-caption text-secondary">© 2025 Attend Pal</p>
          <Link href="/" className="font-label-md text-label-md text-secondary hover:text-primary">
            Home
          </Link>
        </div>
      </footer>
    </div>
  );
}
