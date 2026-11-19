import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Deploy probe. Vercel sets these variables on every build, so opening
 * /api/version shows which commit and environment is actually serving traffic.
 */
export function GET() {
  return NextResponse.json({
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? null,
    faceModelOverride: Boolean(process.env.FACE_MODEL_DIR),
  });
}
