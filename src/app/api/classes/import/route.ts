import JSZip from "jszip";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getLecturer } from "@/lib/lecturer/session";
import { getAdminClient } from "@/lib/supabase/admin";
import { indexKey, pairPhotos, parseRosterCsv, type RosterPhoto } from "@/lib/roster/match";

export const runtime = "nodejs";

const MAX_CSV_BYTES = 2 * 1024 * 1024;
const MAX_ZIP_BYTES = 20 * 1024 * 1024;
const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
const MAX_ROWS = 2000;

export async function POST(request: Request) {
  const { supabase, user } = await getLecturer();
  if (!user) {
    return NextResponse.json({ error: "You need to be signed in." }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "The upload could not be read." }, { status: 400 });
  }

  const classId = String(form.get("classId") ?? "");
  const csvFile = form.get("csv");
  const zipFile = form.get("zip");
  if (!classId) return NextResponse.json({ error: "Choose a class first." }, { status: 400 });
  if (!(csvFile instanceof File)) return NextResponse.json({ error: "Choose the class CSV." }, { status: 400 });
  if (csvFile.size > MAX_CSV_BYTES) {
    return NextResponse.json({ error: "The CSV must be 2MB or smaller." }, { status: 400 });
  }
  if (zipFile instanceof File && zipFile.size > MAX_ZIP_BYTES) {
    return NextResponse.json({ error: "The photo zip must be 20MB or smaller." }, { status: 400 });
  }

  const { data: course } = await supabase
    .from("classes")
    .select("id")
    .eq("id", classId)
    .eq("lecturer_id", user.id)
    .maybeSingle();
  if (!course) return NextResponse.json({ error: "That class is not on your account." }, { status: 403 });

  const parsed = parseRosterCsv(await csvFile.text());
  if (parsed.rows.length === 0) {
    return NextResponse.json({ error: "The CSV has no students to import." }, { status: 400 });
  }
  if (parsed.rows.length > MAX_ROWS) {
    return NextResponse.json({ error: "A class import can contain up to 2000 students." }, { status: 400 });
  }

  let photos: RosterPhoto[] = [];
  let rejectedPhotos: string[] = [];
  if (zipFile instanceof File && zipFile.size > 0) {
    const opened = await readPhotoZip(await zipFile.arrayBuffer());
    if (opened.error) return NextResponse.json({ error: opened.error }, { status: 400 });
    photos = opened.photos;
    rejectedPhotos = opened.rejected;
  }

  const paired = pairPhotos(parsed.rows, photos);
  const photoPaths = new Map<string, string>();
  const photoErrors: string[] = [];

  if (paired.matched.size > 0) {
    let admin: ReturnType<typeof getAdminClient>;
    try {
      admin = getAdminClient();
    } catch {
      return NextResponse.json({ error: "Photo storage is not configured on the server." }, { status: 500 });
    }

    for (const [key, photo] of paired.matched) {
      const path = `${classId}/${key}.jpg`;
      const { error } = await admin.storage.from("reference-photos").upload(path, photo.bytes, {
        upsert: true,
        contentType: "image/jpeg",
      });
      if (error) {
        photoErrors.push(photo.filename);
        if (/bucket|not found/i.test(error.message)) {
          return NextResponse.json(
            { error: "Create a private Storage bucket named reference-photos in Supabase, then import again." },
            { status: 500 },
          );
        }
        continue;
      }
      photoPaths.set(key, path);
    }
  }

  const withPhoto = parsed.rows.filter((row) => photoPaths.has(row.key));
  const withoutPhoto = parsed.rows.filter((row) => !photoPaths.has(row.key));

  const savedWithPhoto = await upsertRows(supabase, classId, withPhoto, photoPaths);
  if (savedWithPhoto.error) return NextResponse.json({ error: savedWithPhoto.error }, { status: 500 });
  const savedWithoutPhoto = await upsertRows(supabase, classId, withoutPhoto, new Map());
  if (savedWithoutPhoto.error) return NextResponse.json({ error: savedWithoutPhoto.error }, { status: 500 });

  revalidatePath("/classes");
  revalidatePath("/dashboard");

  return NextResponse.json({
    imported: parsed.rows.length,
    withPhoto: withPhoto.length,
    missingPhoto: withoutPhoto.length,
    duplicates: parsed.duplicates + paired.duplicatePhotos,
    unmatchedPhotos: paired.unmatchedPhotos.slice(0, 20),
    rejectedPhotos: rejectedPhotos.slice(0, 20),
    photoErrors,
    skipped: parsed.skipped.slice(0, 20),
  });
}

async function upsertRows(
  supabase: Awaited<ReturnType<typeof getLecturer>>["supabase"],
  classId: string,
  rows: { indexNumber: string; fullName: string; email: string | null; programme: string | null; level: string | null; key: string }[],
  photoPaths: Map<string, string>,
) {
  if (rows.length === 0) return { error: null };
  const payload = rows.map((row) => {
    const record: {
      class_id: string;
      index_number: string;
      full_name: string;
      email: string | null;
      programme: string | null;
      level: string | null;
      reference_photo_path?: string;
    } = {
      class_id: classId,
      index_number: row.indexNumber,
      full_name: row.fullName,
      email: row.email,
      programme: row.programme,
      level: row.level,
    };
    const path = photoPaths.get(row.key);
    if (path) record.reference_photo_path = path;
    return record;
  });

  for (let start = 0; start < payload.length; start += 200) {
    const { error } = await supabase.from("students").upsert(payload.slice(start, start + 200), {
      onConflict: "class_id,index_number",
    });
    if (error) return { error: error.message };
  }
  return { error: null };
}

async function readPhotoZip(bytes: ArrayBuffer) {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(bytes);
  } catch {
    return { error: "The photo file is not a zip archive.", photos: [], rejected: [] };
  }

  const photos: RosterPhoto[] = [];
  const rejected: string[] = [];
  const entries = Object.values(zip.files);
  for (const entry of entries) {
    if (entry.dir) continue;
    const filename = entry.name.split("/").pop() || entry.name;
    if (!filename || filename.startsWith(".") || entry.name.includes("__MACOSX")) continue;
    const extension = filename.split(".").pop()?.toLowerCase() ?? "";
    if (!["jpg", "jpeg"].includes(extension)) {
      if (["png", "webp", "gif", "heic"].includes(extension)) rejected.push(filename);
      continue;
    }
    const fileBytes = await entry.async("uint8array");
    if (fileBytes.byteLength > MAX_PHOTO_BYTES) {
      rejected.push(filename);
      continue;
    }
    const stem = filename.slice(0, filename.lastIndexOf("."));
    const key = indexKey(stem);
    if (!key) continue;
    photos.push({ filename, key, bytes: fileBytes });
  }
  return { error: null, photos, rejected };
}
