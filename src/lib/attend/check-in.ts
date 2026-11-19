import { createHash } from "crypto";
import { getAdminClient } from "@/lib/supabase/admin";
import type { AttendSession } from "@/components/student/attend-client-view";

export type AttendResult = {
  code: AttendCode;
  distanceM?: number;
  radiusM?: number;
  recordedAt?: string;
  reference?: string;
};

export type AttendCode =
  | "ok"
  | "closed"
  | "not_open"
  | "not_on_list"
  | "already"
  | "bounds"
  | "imprecise"
  | "identity"
  | "flagged"
  | "verified"
  | "turnstile"
  | "error";

type Phase = "index" | "location" | "submit";

type SessionRow = {
  id: string;
  class_id: string;
  lecturer_id: string;
  title: string;
  status: "open" | "closed";
  starts_at: string;
  ends_at: string;
  venue_name: string | null;
  center_lat: number;
  center_lng: number;
  radius_m: number;
  allow_second_checkin: boolean;
  require_liveness: boolean;
  second_checkin_window_minutes: number;
};

const ACCRA = "Africa/Accra";

function accraDay(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ACCRA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function accraClock(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: ACCRA,
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function accraMeridian(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: ACCRA,
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatRecorded(at: Date, now: Date) {
  const time = accraMeridian(at);
  if (accraDay(at) === accraDay(now)) return `${time} Today`;
  const day = new Intl.DateTimeFormat("en-GB", {
    timeZone: ACCRA,
    day: "numeric",
    month: "short",
  }).format(at);
  return `${time} ${day}`;
}

export function detectedAtLabel(date = new Date()) {
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: ACCRA,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);
  return { time, zone: ACCRA };
}

export function haversineMetres(lat1: number, lng1: number, lat2: number, lng2: number) {
  const earth = 6371000;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * earth * Math.asin(Math.sqrt(a));
}

function hashValue(value: string) {
  const pepper = process.env.DEVICE_PEPPER_SECRET;
  if (!pepper) return null;
  return createHash("sha256").update(`${pepper}:${value}`).digest("hex");
}

function windowCode(session: SessionRow, now: Date): AttendCode | null {
  if (session.status === "closed" || now.getTime() > new Date(session.ends_at).getTime()) return "closed";
  if (now.getTime() < new Date(session.starts_at).getTime()) return "not_open";
  return null;
}

async function loadSession(token: string) {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("sessions")
    .select(
      "id, class_id, lecturer_id, title, status, starts_at, ends_at, venue_name, center_lat, center_lng, radius_m, allow_second_checkin, second_checkin_window_minutes, require_liveness",
    )
    .eq("token", token)
    .maybeSingle();
  if (error || !data) return null;
  return data as SessionRow;
}

export async function loadAttendView(token: string): Promise<
  | { step: "landing"; session: AttendSession }
  | { step: "closed" | "not-open"; session: AttendSession }
> {
  const blank: AttendSession = {
    code: "",
    title: "",
    lecturer: "",
    venue: "",
    whenLabel: "",
    closesIn: "",
    windowClock: "",
    nowClock: "",
    radiusM: 0,
  };
  try {
    const session = await loadSession(token);
    if (!session) return { step: "closed", session: blank };
    const admin = getAdminClient();
    const [{ data: course }, { data: lecturer }] = await Promise.all([
      admin.from("classes").select("code, title").eq("id", session.class_id).maybeSingle(),
      admin.from("lecturers").select("full_name").eq("id", session.lecturer_id).maybeSingle(),
    ]);
    if (!course) return { step: "closed", session: blank };

    const start = new Date(session.starts_at);
    const end = new Date(session.ends_at);
    const now = new Date();
    const remaining = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    const dayPrefix = accraDay(now) === accraDay(start) ? "Today, " : "";
    const day = new Intl.DateTimeFormat("en-GB", {
      timeZone: ACCRA,
      day: "numeric",
      month: "short",
    }).format(start);

    const view: AttendSession = {
      code: course.code,
      title: course.title,
      lecturer: lecturer?.full_name ?? "",
      venue: session.venue_name || "the classroom",
      whenLabel: `${dayPrefix}${day} · ${accraClock(start)} – ${accraClock(end)}`,
      closesIn: `${minutes}:${seconds.toString().padStart(2, "0")}`,
      windowClock: `${accraMeridian(start)} – ${accraMeridian(end)}`,
      nowClock: accraMeridian(now),
      radiusM: session.radius_m,
    };

    const closed = windowCode(session, now);
    if (closed === "closed") return { step: "closed", session: view };
    if (closed === "not_open") return { step: "not-open", session: view };
    return { step: "landing", session: view };
  } catch {
    return { step: "closed", session: blank };
  }
}

async function verifyTurnstile(token: string | undefined) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  const body = new URLSearchParams({ secret, response: token });
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
  });
  const data = (await response.json()) as { success?: boolean };
  return data.success === true;
}

export async function runAttendCheck(input: {
  token: string;
  phase: Phase;
  indexNumber: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  turnstileToken?: string;
  deviceId?: string;
  ip?: string;
  frames?: string[];
}): Promise<AttendResult> {
  const now = new Date();
  let session: SessionRow | null = null;
  try {
    session = await loadSession(input.token);
  } catch {
    return { code: "error" };
  }
  if (!session) return { code: "closed" };

  const timing = windowCode(session, now);
  if (timing) return { code: timing };

  const admin = getAdminClient();
  const ipHash = input.ip ? hashValue(input.ip) : null;
  const deviceHash = input.deviceId ? hashValue(input.deviceId) : null;

  if (ipHash) {
    const since = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
    const { count } = await admin
      .from("attempts")
      .select("id", { count: "exact", head: true })
      .eq("session_id", session.id)
      .eq("ip_hash", ipHash)
      .gte("created_at", since);
    if ((count ?? 0) >= 8) return { code: "error" };
  }

  const humanOk = await verifyTurnstile(input.turnstileToken);
  if (!humanOk) return { code: "turnstile" };

  const indexNumber = input.indexNumber.trim();
  const { data: student } = await admin
    .from("students")
    .select("id, index_number, reference_photo_path")
    .eq("class_id", session.class_id)
    .ilike("index_number", indexNumber)
    .maybeSingle();

  if (!student) {
    await admin.from("attempts").insert({
      session_id: session.id,
      ip_hash: ipHash,
      device_hash: deviceHash,
      claimed_index: indexNumber,
      outcome: "not_on_list",
    });
    return { code: "not_on_list" };
  }

  const { data: existing } = await admin
    .from("attendance")
    .select("id, created_at, checkin_number")
    .eq("session_id", session.id)
    .eq("student_id", student.id);

  const rows = existing ?? [];
  if (rows.length > 0) {
    const canSecond =
      session.allow_second_checkin &&
      rows.length === 1 &&
      now.getTime() <= new Date(rows[0].created_at).getTime() + session.second_checkin_window_minutes * 60 * 1000;
    const first = rows[0];
    if (!canSecond && first) {
      return {
        code: "already",
        recordedAt: formatRecorded(new Date(first.created_at), now),
        reference: `#${first.id.replace(/-/g, "").slice(0, 10).toUpperCase()}`,
      };
    }
    if (!canSecond) return { code: "already" };
  }

  if (input.phase === "index") return { code: "ok" };

  if (input.latitude == null || input.longitude == null || input.accuracy == null) {
    return { code: "imprecise" };
  }
  if (input.accuracy > 100) return { code: "imprecise" };

  const distance = haversineMetres(session.center_lat, session.center_lng, input.latitude, input.longitude);
  const allowance = Math.min(input.accuracy, 50);
  if (distance > session.radius_m + allowance) {
    await admin.from("alerts").insert({
      session_id: session.id,
      type: "out_of_bounds",
      severity: "medium",
      claimed_index: student.index_number,
      student_id: student.id,
      distance_m: distance,
      device_hash: deviceHash,
      ip_hash: ipHash,
    });
    await admin.from("attempts").insert({
      session_id: session.id,
      ip_hash: ipHash,
      device_hash: deviceHash,
      claimed_index: student.index_number,
      outcome: "out_of_bounds",
    });
    return { code: "bounds", distanceM: Math.round(distance), radiusM: session.radius_m };
  }

  if (input.phase === "location") return { code: "ok" };

  if (deviceHash) {
    const { data: other } = await admin
      .from("attempts")
      .select("claimed_index")
      .eq("session_id", session.id)
      .eq("device_hash", deviceHash)
      .neq("claimed_index", student.index_number)
      .limit(1);
    if (other && other.length > 0) {
      await admin.from("alerts").insert({
        session_id: session.id,
        type: "multi_index_device",
        severity: "high",
        claimed_index: student.index_number,
        student_id: student.id,
        device_hash: deviceHash,
        ip_hash: ipHash,
      });
    }
  }

  const frames = (input.frames ?? []).flatMap((value) => {
    const frame = jpegBytes(value);
    return frame ? [frame] : [];
  });
  if (frames.length < 3) {
    await admin.from("attempts").insert({
      session_id: session.id,
      ip_hash: ipHash,
      device_hash: deviceHash,
      claimed_index: student.index_number,
      outcome: "unscored",
    });
    return { code: "identity" };
  }

  let scored: Awaited<ReturnType<typeof import("@/lib/attend/face-score").scoreCheckInFaces>>;
  try {
    const { scoreCheckInFaces } = await import("@/lib/attend/face-score");
    const { loadReferenceDescriptor } = await import("@/lib/attend/reference-face");
    // The roster photo's saved face fingerprint, so its slow face search is skipped.
    const reference = student.reference_photo_path
      ? await loadReferenceDescriptor(admin, student.reference_photo_path)
      : null;
    scored = await scoreCheckInFaces(frames, reference, session.require_liveness !== false);
  } catch (error) {
    console.error("Face check could not run", error);
    await admin.from("attempts").insert({
      session_id: session.id,
      ip_hash: ipHash,
      device_hash: deviceHash,
      claimed_index: student.index_number,
      outcome: "unscored",
    });
    return { code: "identity" };
  }

  if (scored.decision === "verified" && scored.match != null) {
    const checkinNumber = rows.length === 0 ? 1 : 2;
    const { error } = await admin.from("attendance").insert({
      session_id: session.id,
      student_id: student.id,
      checkin_number: checkinNumber,
      status: "verified",
      distance_m: distance,
      gps_accuracy_m: input.accuracy,
      match_score: scored.match,
      liveness_passed: scored.livenessPassed,
      device_hash: deviceHash,
    });
    if (error) return { code: "already" };
    await admin.from("attempts").insert({
      session_id: session.id,
      ip_hash: ipHash,
      device_hash: deviceHash,
      claimed_index: student.index_number,
      outcome: "verified",
    });
    return { code: "verified" };
  }

  const review = scored.decision === "review";
  const { data: alert } = await admin
    .from("alerts")
    .insert({
      session_id: session.id,
      type: review ? "low_match" : "fake_identity",
      severity: review ? "medium" : "high",
      claimed_index: student.index_number,
      student_id: student.id,
      distance_m: distance,
      match_score: scored.match,
      device_hash: deviceHash,
      ip_hash: ipHash,
      details: { reason: scored.reason, liveness: Number(scored.liveness.toFixed(3)) },
    })
    .select("id")
    .single();

  if (alert && scored.evidence) {
    const evidencePath = `${session.id}/${alert.id}.jpg`;
    const uploaded = await admin.storage.from("alert-evidence").upload(evidencePath, scored.evidence, {
      contentType: "image/jpeg",
      upsert: false,
    });
    if (!uploaded.error) {
      await admin.from("alerts").update({ evidence_photo_path: evidencePath }).eq("id", alert.id);
    }
  }

  await admin.from("attempts").insert({
    session_id: session.id,
    ip_hash: ipHash,
    device_hash: deviceHash,
    claimed_index: student.index_number,
    outcome: review ? "low_match" : "failed_identity",
  });
  return { code: review ? "flagged" : "identity" };
}

function jpegBytes(value: string): Buffer | null {
  const payload = value.match(/^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/)?.[1];
  if (!payload) return null;
  const bytes = Buffer.from(payload, "base64");
  if (bytes.length < 1000 || bytes.length > 350_000) return null;
  return bytes;
}
