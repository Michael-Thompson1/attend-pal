import { LecturerProfileProvider } from "@/components/lecturer/profile-photo";
import { getLecturerPhotoUrl, getLecturerRecord } from "@/lib/lecturer/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LecturerLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getLecturerRecord();
  const photoUrl = user ? await getLecturerPhotoUrl() : null;
  const name =
    profile?.full_name ||
    (user?.user_metadata?.full_name as string) ||
    user?.email?.split("@")[0] ||
    "Lecturer";

  return (
    <LecturerProfileProvider photoUrl={photoUrl} name={name}>
      {children}
    </LecturerProfileProvider>
  );
}
