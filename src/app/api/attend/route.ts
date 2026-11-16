import { NextResponse } from "next/server";
import { z } from "zod";
import { runAttendCheck } from "@/lib/attend/check-in";

const bodySchema = z.object({
  token: z.string().min(20).max(80).regex(/^[A-Za-z0-9]+$/),
  phase: z.enum(["index", "location", "submit"]),
  indexNumber: z.string().trim().min(3).max(30).regex(/^[A-Za-z0-9/\-]+$/),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  accuracy: z.number().min(0).max(50000).optional(),
  turnstileToken: z.string().min(1).optional(),
  deviceId: z.string().min(8).max(80).optional(),
  frames: z
    .array(z.string().regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/).max(450_000))
    .min(3)
    .max(5)
    .optional(),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ code: "error" });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ code: "error" });

  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || undefined;

  try {
    const result = await runAttendCheck({ ...parsed.data, ip });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ code: "error" });
  }
}
