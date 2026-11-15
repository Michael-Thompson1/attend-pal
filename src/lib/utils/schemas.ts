/**
 * Zod schemas shared across the app.
 * Keep validation logic here — never duplicate in route handlers.
 */
import { z } from "zod";

// ── Index number ─────────────────────────────────────────────────────────────
// Format observed in Stitch: AH/BMS/24/0024 — alphanumeric with slashes.
// Server validates against the students table; we only do format sanity here.
export const indexNumberSchema = z
  .string()
  .min(3, "Enter your index number")
  .max(30, "Index number is too long")
  .regex(
    /^[A-Za-z0-9/\-]+$/,
    "Index number may only contain letters, numbers, / and -"
  );

// ── Student check-in payload ──────────────────────────────────────────────────
export const checkInPayloadSchema = z.object({
  sessionToken: z.string().uuid("Invalid session token"),
  indexNumber: indexNumberSchema,
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracyMetres: z.number().min(0).max(50_000),
  turnstileToken: z.string().min(1, "Complete the security check"),
  deviceFingerprint: z.string().min(1),
});

export type CheckInPayload = z.infer<typeof checkInPayloadSchema>;

// ── Lecturer registration ─────────────────────────────────────────────────────
export const lecturerSignUpSchema = z.object({
  fullName: z.string().min(2, "Enter your full name").max(100),
  email: z
    .string()
    .email("Enter a valid email address")
    .toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72),
});

export type LecturerSignUp = z.infer<typeof lecturerSignUpSchema>;

// ── Create session ────────────────────────────────────────────────────────────
export const createSessionSchema = z.object({
  classId: z.string().uuid(),
  windowStart: z.string().datetime(),
  windowEnd: z.string().datetime(),
  locationLat: z.number().min(-90).max(90),
  locationLon: z.number().min(-180).max(180),
  radiusMetres: z.number().min(10).max(2000),
  note: z.string().max(500).optional(),
});

export type CreateSession = z.infer<typeof createSessionSchema>;

// ── Roster CSV row ────────────────────────────────────────────────────────────
export const rosterRowSchema = z.object({
  index_number: indexNumberSchema,
  full_name: z.string().min(1).max(200),
  photo_url: z.string().url().optional().or(z.literal("")),
});

export type RosterRow = z.infer<typeof rosterRowSchema>;
