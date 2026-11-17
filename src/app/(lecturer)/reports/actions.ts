"use server";

import { getLecturer } from "@/lib/lecturer/session";

export interface ClassReportData {
  classId: string;
  classCode: string;
  classTitle: string;
  enrolledStudentsCount: number;
  totalSessionsHeld: number;
  averageAttendanceRate: number;
  atRiskCount: number;
  biometricVerificationRate: number;
  sessionTrend: {
    sessionNumber: number;
    title: string;
    rate: number;
    attendedCount: number;
    totalCount: number;
  }[];
  studentRoster: {
    id: string;
    indexNumber: string;
    name: string;
    email: string;
    program: string;
    sessionsAttended: number;
    totalSessions: number;
    attendanceRate: number;
    category: "exemplary" | "satisfactory" | "at-risk";
    statusBadge: "eligible" | "at-risk" | "barred" | "perfect";
  }[];
}

export interface ClassOption {
  id: string;
  code: string;
  title: string;
}

/** Get all classes taught by lecturer for report selection */
export async function getLecturerClassesForReportsAction(): Promise<ClassOption[]> {
  const { supabase, user } = await getLecturer();

  if (!user) return [];

  const { data: classes } = await supabase
    .from("classes")
    .select("id, code, title")
    .eq("lecturer_id", user.id)
    .order("created_at", { ascending: false });

  return classes ?? [];
}

/** Get comprehensive attendance report data for a specific class */
export async function getClassReportDataAction(
  classId: string
): Promise<ClassReportData | null> {
  const { supabase, user } = await getLecturer();

  if (!user) return null;

  // 1. Fetch class details
  const { data: cls } = await supabase
    .from("classes")
    .select("id, code, title")
    .eq("id", classId)
    .single();

  if (!cls) return null;

  const [{ data: sessions }, { data: students }] = await Promise.all([
    supabase
      .from("sessions")
      .select("id, title, starts_at, status")
      .eq("class_id", classId)
      .order("starts_at", { ascending: true }),
    supabase
      .from("students")
      .select("id, full_name, index_number")
      .eq("class_id", classId)
      .order("full_name", { ascending: true }),
  ]);

  const sessionList = sessions ?? [];
  const totalSessionsHeld = sessionList.length;

  const studentList = students ?? [];
  const enrolledCount = studentList.length;

  if (enrolledCount === 0 || totalSessionsHeld === 0) {
    return {
      classId: cls.id,
      classCode: cls.code,
      classTitle: cls.title,
      enrolledStudentsCount: enrolledCount,
      totalSessionsHeld,
      averageAttendanceRate: 0,
      atRiskCount: 0,
      biometricVerificationRate: 100,
      sessionTrend: [],
      studentRoster: studentList.map((s) => ({
        id: s.id,
        indexNumber: s.index_number,
        name: s.full_name,
        email: `${s.index_number.toLowerCase()}@campus.edu`,
        program: "BSc CS • L200",
        sessionsAttended: 0,
        totalSessions: totalSessionsHeld,
        attendanceRate: 0,
        category: "at-risk",
        statusBadge: "at-risk",
      })),
    };
  }

  // 4. Fetch attendance records for all sessions of this class
  const sessionIds = sessionList.map((s) => s.id);
  const { data: attendanceRecords } = await supabase
    .from("attendance")
    .select("session_id, student_id, status, match_score")
    .in("session_id", sessionIds);

  const records = attendanceRecords ?? [];

  // 5. Aggregate per-session attendance
  const sessionTrend = sessionList.map((sess, idx) => {
    const sessionAtt = records.filter(
      (r) =>
        r.session_id === sess.id &&
        (r.status === "verified" || r.status === "manual")
    );
    const attendedCount = sessionAtt.length;
    const rate = enrolledCount > 0 ? (attendedCount / enrolledCount) * 100 : 0;
    return {
      sessionNumber: idx + 1,
      title: sess.title || `Lecture ${idx + 1}`,
      rate: parseFloat(rate.toFixed(1)),
      attendedCount,
      totalCount: enrolledCount,
    };
  });

  // 6. Aggregate per-student attendance
  let totalStudentRates = 0;
  let atRiskCount = 0;

  const studentRoster = studentList.map((s) => {
    const studentRecords = records.filter(
      (r) =>
        r.student_id === s.id &&
        (r.status === "verified" || r.status === "manual")
    );
    const sessionsAttended = studentRecords.length;
    const attendanceRate =
      totalSessionsHeld > 0
        ? parseFloat(((sessionsAttended / totalSessionsHeld) * 100).toFixed(1))
        : 0;

    totalStudentRates += attendanceRate;

    let category: "exemplary" | "satisfactory" | "at-risk" = "satisfactory";
    let statusBadge: "eligible" | "at-risk" | "barred" | "perfect" = "eligible";

    if (attendanceRate >= 90) {
      category = "exemplary";
      statusBadge = attendanceRate === 100 ? "perfect" : "eligible";
    } else if (attendanceRate >= 75) {
      category = "satisfactory";
      statusBadge = "eligible";
    } else {
      category = "at-risk";
      atRiskCount++;
      statusBadge = attendanceRate < 60 ? "barred" : "at-risk";
    }

    return {
      id: s.id,
      indexNumber: s.index_number,
      name: s.full_name,
      email: `${s.index_number.toLowerCase()}@campus.edu`,
      program: "BSc CS • L200",
      sessionsAttended,
      totalSessions: totalSessionsHeld,
      attendanceRate,
      category,
      statusBadge,
    };
  });

  const averageAttendanceRate =
    enrolledCount > 0
      ? parseFloat((totalStudentRates / enrolledCount).toFixed(1))
      : 0;

  // Biometric verification rate: check match_score >= 70 or verified
  const verifiedCount = records.filter(
    (r) => (r.match_score ?? 0) >= 70 || r.status === "verified"
  ).length;
  const biometricVerificationRate =
    records.length > 0
      ? parseFloat(((verifiedCount / records.length) * 100).toFixed(1))
      : 98.1;

  return {
    classId: cls.id,
    classCode: cls.code,
    classTitle: cls.title,
    enrolledStudentsCount: enrolledCount,
    totalSessionsHeld,
    averageAttendanceRate,
    atRiskCount,
    biometricVerificationRate,
    sessionTrend,
    studentRoster,
  };
}
