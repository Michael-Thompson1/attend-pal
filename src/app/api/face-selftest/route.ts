import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { faceModelDiagnostics, referenceFingerprint, scoreCheckInFaces } from "@/lib/attend/face-score";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Temporary deploy probe: reads one roster photo with the deployed face model
 * and scores it against itself. Gated by a daily key derived from the service
 * key so it cannot be used by visitors.
 */
function dayKey() {
  const today = new Date().toISOString().slice(0, 10);
  return createHash("sha256")
    .update(`face-selftest:${today}:${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`)
    .digest("hex");
}

export async function GET(request: Request) {
  if (new URL(request.url).searchParams.get("key") !== dayKey()) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const admin = getAdminClient();
  const diagnostics = faceModelDiagnostics();
  try {
    const { data: student } = await admin
      .from("students")
      .select("reference_photo_path")
      .eq("index_number", "PS/ITC/24/0090")
      .limit(1)
      .maybeSingle();
    if (!student?.reference_photo_path) {
      return NextResponse.json({ diagnostics, error: "no reference photo" }, { status: 500 });
    }
    const photo = await admin.storage.from("reference-photos").download(student.reference_photo_path);
    if (!photo.data) {
      return NextResponse.json({ diagnostics, error: "reference photo download failed" }, { status: 500 });
    }
    const bytes = Buffer.from(await photo.data.arrayBuffer());
    const fingerprint = await referenceFingerprint(bytes);
    const scored = await scoreCheckInFaces([bytes, bytes, bytes], fingerprint.descriptor ? Float32Array.from(fingerprint.descriptor) : null, false);
    return NextResponse.json({
      diagnostics,
      fingerprint: {
        descriptorLength: fingerprint.descriptor?.length ?? 0,
        faceWidth: fingerprint.faceWidth,
        faces: fingerprint.faces,
      },
      score: {
        decision: scored.decision,
        match: scored.match,
        liveness: scored.liveness,
        reason: scored.reason,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        diagnostics,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack?.split("\n").slice(0, 6) : null,
      },
      { status: 500 },
    );
  }
}
