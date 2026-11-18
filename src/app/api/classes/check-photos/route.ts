import { NextResponse } from "next/server";
import { z } from "zod";
import { checkReferencePhoto, type ReferenceStatus } from "@/lib/attend/reference-face";
import { getLecturer } from "@/lib/lecturer/session";
import { getAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
// Each photo takes a few seconds on the server, so the dialog sends a few at a time.
export const maxDuration = 60;
const MAX_PHOTOS_PER_REQUEST = 2;

const bodySchema = z.object({
  classId: z.string().uuid(),
  keys: z
    .array(z.string().regex(/^[A-Z0-9]{1,40}$/))
    .min(1)
    .max(MAX_PHOTOS_PER_REQUEST),
});

type PhotoCheckResult = { key: string; indexNumber: string; status: ReferenceStatus };

export async function POST(request: Request) {
  const { supabase, user } = await getLecturer();
  if (!user) return NextResponse.json({ error: "You need to be signed in." }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "The photo check request is not valid." }, { status: 400 });
  const { classId, keys } = parsed.data;

  const { data: course } = await supabase
    .from("classes")
    .select("id")
    .eq("id", classId)
    .eq("lecturer_id", user.id)
    .maybeSingle();
  if (!course) return NextResponse.json({ error: "That class is not on your account." }, { status: 403 });

  // Same path the import uses: {class_id}/{KEY}.jpg
  const paths = keys.map((key) => `${classId}/${key}.jpg`);
  const { data: students } = await supabase
    .from("students")
    .select("index_number, reference_photo_path")
    .eq("class_id", classId)
    .in("reference_photo_path", paths);

  const admin = getAdminClient();
  const results: PhotoCheckResult[] = [];
  try {
    for (const key of keys) {
      const path = `${classId}/${key}.jpg`;
      const student = students?.find((row) => row.reference_photo_path === path);
      if (!student) continue;
      results.push({ key, indexNumber: student.index_number, status: await checkReferencePhoto(admin, path) });
    }
  } catch (error) {
    console.error("Photo check could not run", error);
    return NextResponse.json({ error: "The photo check could not run on the server." }, { status: 500 });
  }

  return NextResponse.json({ results });
}
