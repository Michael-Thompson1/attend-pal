import { getLecturer, getLecturerRecord, getOpenAlertCount } from "@/lib/lecturer/session";
import { redirect } from "next/navigation";
import ClassesClientView, {
  type ClassItem,
  type ClassSession,
  type StudentRecord,
} from "@/components/lecturer/classes-client-view";

export default async function ClassesPage() {
  const { supabase, user } = await getLecturer();

  if (!user) {
    redirect("/login");
  }

  const [{ profile }, { data: rawClasses }, { data: rawSessions }, openAlertCount] = await Promise.all([
    getLecturerRecord(),
    supabase
      .from("classes")
      .select("id, code, title, semester, programme, default_venue, created_at")
      .eq("lecturer_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("sessions")
      .select("id, class_id, title, starts_at, ends_at, venue_name, status")
      .eq("lecturer_id", user.id)
      .order("starts_at", { ascending: false }),
    getOpenAlertCount(),
  ]);

  const fullName =
    profile?.full_name ||
    (user.user_metadata?.full_name as string) ||
    user.email?.split("@")[0] ||
    "Lecturer";
  const firstName = fullName.split(" ")[0];
  const institutionName = profile?.institution || "Faculty of Science";
  const campusName = profile?.campus || "UCC Main Campus • North Wing";

  const classes: ClassItem[] = (rawClasses as unknown as ClassItem[]) || [];

  // If classes exist, fetch students for the first class
  let students: StudentRecord[] = [];
  if (classes.length > 0) {
    const { data: rawStudents } = await supabase
      .from("students")
      .select("id, class_id, index_number, full_name, email, programme, level, reference_photo_path, created_at")
      .eq("class_id", classes[0].id)
      .order("index_number", { ascending: true });

    students = (rawStudents as unknown as StudentRecord[]) || [];
  }

  return (
    <ClassesClientView
      initialClasses={classes}
      initialStudents={students}
      initialSessions={(rawSessions as unknown as ClassSession[]) || []}
      openAlertCount={openAlertCount}
      userProfile={{
        fullName,
        firstName,
        email: user.email || "",
        institution: institutionName,
        campus: campusName,
      }}
    />
  );
}
