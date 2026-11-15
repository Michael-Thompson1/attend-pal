"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface StudentInput {
  indexNumber: string;
  fullName: string;
  email?: string;
  programme?: string;
  level?: string;
}

/**
 * Fetch all classes for the authenticated lecturer.
 */
export async function getLecturerClassesAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required", classes: [] };
  }

  const { data, error } = await supabase
    .from("classes")
    .select("id, code, title, semester, programme, default_venue, created_at")
    .eq("lecturer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return { error: error.message, classes: [] };
  }

  return { error: null, classes: data || [] };
}

/**
 * Create a new course cohort / class.
 */
export async function createClassAction(formData: {
  code: string;
  title: string;
  semester?: string;
  programme?: string;
  default_venue?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required", classId: null };
  }

  if (!formData.code || !formData.title) {
    return { error: "Course code and title are required", classId: null };
  }

  const { data, error } = await supabase
    .from("classes")
    .insert({
      lecturer_id: user.id,
      code: formData.code.trim().toUpperCase(),
      title: formData.title.trim(),
      semester: formData.semester || "Semester 2, 2024/2025",
      programme: formData.programme || "BSc Computer Science",
      default_venue: formData.default_venue || "Lecture Hall B",
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message, classId: null };
  }

  revalidatePath("/classes");
  revalidatePath("/dashboard");

  return { error: null, classId: data?.id || null };
}

/**
 * Fetch students enrolled in a class.
 */
export async function getClassStudentsAction(classId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required", students: [] };
  }

  const { data, error } = await supabase
    .from("students")
    .select("id, class_id, index_number, full_name, email, programme, level, reference_photo_path, created_at")
    .eq("class_id", classId)
    .order("index_number", { ascending: true });

  if (error) {
    return { error: error.message, students: [] };
  }

  return { error: null, students: data || [] };
}

/**
 * Bulk import a student roster for a class.
 */
export async function importRosterAction(classId: string, students: StudentInput[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required", importedCount: 0 };
  }

  if (!students || students.length === 0) {
    return { error: "No students provided for import", importedCount: 0 };
  }

  // Deduplicate on indexNumber
  const uniqueStudentsMap = new Map<string, StudentInput>();
  for (const s of students) {
    const trimmedIndex = s.indexNumber.trim();
    if (trimmedIndex) {
      uniqueStudentsMap.set(trimmedIndex, s);
    }
  }

  const payload = Array.from(uniqueStudentsMap.values()).map((s) => ({
    class_id: classId,
    index_number: s.indexNumber.trim(),
    full_name: s.fullName.trim(),
    email: s.email?.trim() || null,
    programme: s.programme || "BSc Computer Science",
    level: s.level || "Level 200",
  }));

  const { data, error } = await supabase
    .from("students")
    .upsert(payload, { onConflict: "class_id, index_number" })
    .select("id");

  if (error) {
    return { error: error.message, importedCount: 0 };
  }

  revalidatePath("/classes");
  revalidatePath("/dashboard");

  return { error: null, importedCount: data?.length || 0 };
}
