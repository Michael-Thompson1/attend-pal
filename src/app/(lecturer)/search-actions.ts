"use server";

import { getLecturer } from "@/lib/lecturer/session";

export type SearchHit = {
  kind: "Class" | "Session" | "Student";
  label: string;
  detail: string;
  href: string;
};

export async function searchPortalAction(query: string): Promise<SearchHit[]> {
  const safe = query.trim().replace(/[%_,]/g, "");
  if (safe.length < 2) return [];

  const { supabase, user } = await getLecturer();
  if (!user) return [];

  const pattern = `%${safe}%`;
  const [classes, sessions, students] = await Promise.all([
    supabase
      .from("classes")
      .select("id, code, title")
      .eq("lecturer_id", user.id)
      .or(`code.ilike.${pattern},title.ilike.${pattern}`)
      .limit(5),
    supabase
      .from("sessions")
      .select("id, title, venue_name, classes(code)")
      .eq("lecturer_id", user.id)
      .or(`title.ilike.${pattern},venue_name.ilike.${pattern}`)
      .limit(5),
    supabase
      .from("students")
      .select("id, full_name, index_number, classes!inner(code, lecturer_id)")
      .eq("classes.lecturer_id", user.id)
      .or(`full_name.ilike.${pattern},index_number.ilike.${pattern}`)
      .limit(5),
  ]);

  const hits: SearchHit[] = [];

  for (const row of classes.data ?? []) {
    hits.push({
      kind: "Class",
      label: row.code,
      detail: row.title,
      href: "/classes",
    });
  }

  for (const row of sessions.data ?? []) {
    const course = row.classes as { code?: string } | { code?: string }[] | null;
    const code = Array.isArray(course) ? course[0]?.code : course?.code;
    hits.push({
      kind: "Session",
      label: row.title,
      detail: [code, row.venue_name].filter(Boolean).join(" · "),
      href: `/sessions/${row.id}/qr`,
    });
  }

  for (const row of students.data ?? []) {
    const course = row.classes as { code?: string } | { code?: string }[] | null;
    const code = Array.isArray(course) ? course[0]?.code : course?.code;
    hits.push({
      kind: "Student",
      label: row.full_name,
      detail: [row.index_number, code].filter(Boolean).join(" · "),
      href: "/classes",
    });
  }

  return hits;
}
