"use server";

import { getLecturer } from "@/lib/lecturer/session";
import { getAdminClient } from "@/lib/supabase/admin";
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
  const { supabase, user } = await getLecturer();

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
  const { supabase, user } = await getLecturer();

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
      semester: formData.semester?.trim() || "Current semester",
      programme: formData.programme?.trim() || null,
      default_venue: formData.default_venue?.trim() || null,
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

export async function updateClassAction(
  classId: string,
  formData: {
    code: string;
    title: string;
    semester?: string;
    programme?: string;
    default_venue?: string;
  },
) {
  const { supabase, user } = await getLecturer();
  if (!user) return { error: "Authentication required" };
  if (!formData.code.trim() || !formData.title.trim()) {
    return { error: "Course code and title are required" };
  }

  const { error } = await supabase
    .from("classes")
    .update({
      code: formData.code.trim().toUpperCase(),
      title: formData.title.trim(),
      semester: formData.semester?.trim() || "Semester 2, 2024/2025",
      programme: formData.programme?.trim() || null,
      default_venue: formData.default_venue?.trim() || null,
    })
    .eq("id", classId)
    .eq("lecturer_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/classes");
  revalidatePath("/sessions");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function deleteClassAction(classId: string) {
  const { supabase, user } = await getLecturer();
  if (!user) return { error: "You need to be signed in." };

  const { data: students } = await supabase
    .from("students")
    .select("reference_photo_path")
    .eq("class_id", classId);
  const photoPaths = (students || [])
    .map((student) => student.reference_photo_path)
    .filter((path): path is string => Boolean(path));

  const { data: removed, error } = await supabase
    .from("classes")
    .delete()
    .eq("id", classId)
    .eq("lecturer_id", user.id)
    .select("id");
  if (error) return { error: error.message };
  if (!removed?.length) return { error: "That class is not on your account." };

  if (photoPaths.length > 0) {
    try {
      const admin = getAdminClient();
      await admin.storage.from("reference-photos").remove(photoPaths);
    } catch {
      // The class row is already gone. Leftover photo files can be removed later.
    }
  }

  revalidatePath("/classes");
  revalidatePath("/sessions");
  revalidatePath("/dashboard");
  revalidatePath("/alerts");
  revalidatePath("/reports");
  return { error: null };
}

export async function deleteStudentAction(studentId: string) {
  const { supabase, user } = await getLecturer();
  if (!user) return { error: "You need to be signed in." };

  const { data: student } = await supabase
    .from("students")
    .select("id, class_id, reference_photo_path")
    .eq("id", studentId)
    .maybeSingle();
  if (!student) return { error: "That student is not on your class list." };

  const { data: course } = await supabase
    .from("classes")
    .select("id")
    .eq("id", student.class_id)
    .eq("lecturer_id", user.id)
    .maybeSingle();
  if (!course) return { error: "That student is not on your class list." };

  const { error } = await supabase.from("students").delete().eq("id", studentId);
  if (error) return { error: error.message };

  if (student.reference_photo_path) {
    try {
      const admin = getAdminClient();
      await admin.storage.from("reference-photos").remove([student.reference_photo_path]);
    } catch {
      // The roster row is already gone. A leftover photo file can be removed later.
    }
  }

  revalidatePath("/classes");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function deleteSessionAction(sessionId: string) {
  const { supabase, user } = await getLecturer();
  if (!user) return { error: "You need to be signed in." };

  const { error } = await supabase
    .from("sessions")
    .delete()
    .eq("id", sessionId)
    .eq("lecturer_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/classes");
  revalidatePath("/sessions");
  revalidatePath("/dashboard");
  return { error: null };
}

/**
 * Fetch students enrolled in a class.
 */
export async function getClassStudentsAction(classId: string) {
  const { supabase, user } = await getLecturer();

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
  const { supabase, user } = await getLecturer();

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
