import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ClassesClientView, {
  type ClassItem,
  type StudentRecord,
} from "@/components/lecturer/classes-client-view";

export default async function ClassesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch lecturer profile
  const { data: profileData } = await supabase
    .from("lecturers")
    .select("full_name, institution, campus")
    .eq("id", user.id)
    .single();

  const profile = profileData as {
    full_name?: string;
    institution?: string;
    campus?: string;
  } | null;

  const fullName =
    profile?.full_name ||
    (user.user_metadata?.full_name as string) ||
    user.email?.split("@")[0] ||
    "Lecturer";
  const firstName = fullName.split(" ")[0];
  const institutionName =
    profile?.institution || "Faculty of Science";
  const campusName =
    profile?.campus || "UCC Main Campus • North Wing";

  // Fetch lecturer's classes
  const { data: rawClasses } = await supabase
    .from("classes")
    .select("id, code, title, semester, programme, default_venue, created_at")
    .eq("lecturer_id", user.id)
    .order("created_at", { ascending: false });

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
