import type { getAdminClient } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof getAdminClient>;

const BUCKET = "reference-photos";
const VERSION = 1;

/** What the photo check found in a roster photo. */
export type ReferenceStatus = "ok" | "no_face" | "small_face" | "several_faces" | "missing";

type Saved = { v: number; descriptor: number[] | null; faceWidth: number; faces: number };

/** The face fingerprint lives next to its photo: {class_id}/{KEY}.jpg -> {class_id}/{KEY}.face.json */
export function fingerprintPath(photoPath: string) {
  return `${photoPath.replace(/\.jpe?g$/i, "")}.face.json`;
}

function statusOf(saved: Saved, minFace: number): ReferenceStatus {
  if (!saved.descriptor) return "no_face";
  if (saved.faces > 1) return "several_faces";
  if (saved.faceWidth < minFace) return "small_face";
  return "ok";
}

/**
 * Reads the roster photo with the face model, saves its fingerprint next to
 * the photo, and returns it. Throws if the face model cannot run.
 */
async function computeAndSave(admin: Admin, photoPath: string): Promise<Saved | null> {
  const downloaded = await admin.storage.from(BUCKET).download(photoPath);
  if (!downloaded.data) return null;
  const photo = Buffer.from(await downloaded.data.arrayBuffer());
  const { referenceFingerprint } = await import("@/lib/attend/face-score");
  const saved: Saved = { v: VERSION, ...(await referenceFingerprint(photo)) };
  // Saving is only a speed-up: if it fails, the next check-in reads the photo again.
  await admin.storage
    .from(BUCKET)
    .upload(fingerprintPath(photoPath), JSON.stringify(saved), { upsert: true, contentType: "application/json" })
    .catch(() => undefined);
  return saved;
}

/** Photo check at import: reads the photo, saves its fingerprint, and reports any problem. */
export async function checkReferencePhoto(admin: Admin, photoPath: string): Promise<ReferenceStatus> {
  const saved = await computeAndSave(admin, photoPath);
  if (!saved) return "missing";
  const { MIN_REFERENCE_FACE_PX } = await import("@/lib/attend/face-score");
  return statusOf(saved, MIN_REFERENCE_FACE_PX);
}

/**
 * Check-in: returns the roster photo's face fingerprint, from the saved file
 * when there is one, so the slow face search on the photo is skipped. Photos
 * imported before fingerprints existed are read once and saved here.
 */
export async function loadReferenceDescriptor(admin: Admin, photoPath: string): Promise<Float32Array | null> {
  let saved: Saved | null = null;
  const cached = await admin.storage.from(BUCKET).download(fingerprintPath(photoPath));
  if (cached.data) {
    try {
      const parsed = JSON.parse(await cached.data.text()) as Saved;
      const valid =
        parsed.v === VERSION && (parsed.descriptor === null || (Array.isArray(parsed.descriptor) && parsed.descriptor.length === 128));
      if (valid) saved = parsed;
    } catch {
      saved = null;
    }
  }
  if (!saved) saved = await computeAndSave(admin, photoPath);
  return saved?.descriptor ? Float32Array.from(saved.descriptor) : null;
}
