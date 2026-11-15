export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      allowed_domains: {
        Row: {
          domain: string;
          institution_name: string;
          created_at: string;
        };
        Insert: {
          domain: string;
          institution_name: string;
          created_at?: string;
        };
        Update: {
          domain?: string;
          institution_name?: string;
          created_at?: string;
        };
      };
      lecturers: {
        Row: {
          id: string;
          full_name: string;
          institution: string | null;
          campus: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          institution?: string | null;
          campus?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          institution?: string | null;
          campus?: string | null;
          created_at?: string;
        };
      };
      lecturer_settings: {
        Row: {
          lecturer_id: string;
          default_radius_m: number;
          default_window_minutes: number;
          default_require_liveness: boolean;
          default_require_face_match: boolean;
          updated_at: string;
        };
        Insert: {
          lecturer_id: string;
          default_radius_m?: number;
          default_window_minutes?: number;
          default_require_liveness?: boolean;
          default_require_face_match?: boolean;
          updated_at?: string;
        };
        Update: {
          lecturer_id?: string;
          default_radius_m?: number;
          default_window_minutes?: number;
          default_require_liveness?: boolean;
          default_require_face_match?: boolean;
          updated_at?: string;
        };
      };
      classes: {
        Row: {
          id: string;
          lecturer_id: string;
          course_code: string;
          course_title: string;
          academic_period: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          lecturer_id: string;
          course_code: string;
          course_title: string;
          academic_period?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          lecturer_id?: string;
          course_code?: string;
          course_title?: string;
          academic_period?: string;
          created_at?: string;
        };
      };
      students: {
        Row: {
          id: string;
          class_id: string;
          index_number: string;
          full_name: string;
          reference_photo_path: string | null;
          reference_face_vector: number[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          index_number: string;
          full_name: string;
          reference_photo_path?: string | null;
          reference_face_vector?: number[] | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          class_id?: string;
          index_number?: string;
          full_name?: string;
          reference_photo_path?: string | null;
          reference_face_vector?: number[] | null;
          created_at?: string;
        };
      };
      sessions: {
        Row: {
          id: string;
          class_id: string;
          lecturer_id: string;
          session_token: string;
          window_start: string;
          window_end: string;
          is_open: boolean;
          location_lat: number;
          location_lon: number;
          radius_m: number;
          require_liveness: boolean;
          require_face_match: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          lecturer_id: string;
          session_token?: string;
          window_start: string;
          window_end: string;
          is_open?: boolean;
          location_lat: number;
          location_lon: number;
          radius_m?: number;
          require_liveness?: boolean;
          require_face_match?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          class_id?: string;
          lecturer_id?: string;
          session_token?: string;
          window_start?: string;
          window_end?: string;
          is_open?: boolean;
          location_lat?: number;
          location_lon?: number;
          radius_m?: number;
          require_liveness?: boolean;
          require_face_match?: boolean;
          created_at?: string;
        };
      };
      attendance: {
        Row: {
          id: number;
          session_id: string;
          student_id: string;
          status: "verified" | "manual";
          verified_at: string;
          distance_m: number | null;
          match_score: number | null;
          device_hash: string | null;
          override_reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: never;
          session_id: string;
          student_id: string;
          status?: "verified" | "manual";
          verified_at?: string;
          distance_m?: number | null;
          match_score?: number | null;
          device_hash?: string | null;
          override_reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: never;
          session_id?: string;
          student_id?: string;
          status?: "verified" | "manual";
          verified_at?: string;
          distance_m?: number | null;
          match_score?: number | null;
          device_hash?: string | null;
          override_reason?: string | null;
          created_at?: string;
        };
      };
      alerts: {
        Row: {
          id: string;
          session_id: string;
          type:
            | "fake_identity"
            | "low_match"
            | "out_of_bounds"
            | "multi_index_device"
            | "window_cutoff";
          severity: "high" | "medium" | "low";
          claimed_index: string | null;
          student_id: string | null;
          distance_m: number | null;
          match_score: number | null;
          device_hash: string | null;
          ip_hash: string | null;
          details: Json;
          evidence_photo_path: string | null;
          evidence_expires_at: string | null;
          status: "new" | "reviewed" | "dismissed";
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          type:
            | "fake_identity"
            | "low_match"
            | "out_of_bounds"
            | "multi_index_device"
            | "window_cutoff";
          severity?: "high" | "medium" | "low";
          claimed_index?: string | null;
          student_id?: string | null;
          distance_m?: number | null;
          match_score?: number | null;
          device_hash?: string | null;
          ip_hash?: string | null;
          details?: Json;
          evidence_photo_path?: string | null;
          evidence_expires_at?: string | null;
          status?: "new" | "reviewed" | "dismissed";
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          type?:
            | "fake_identity"
            | "low_match"
            | "out_of_bounds"
            | "multi_index_device"
            | "window_cutoff";
          severity?: "high" | "medium" | "low";
          claimed_index?: string | null;
          student_id?: string | null;
          distance_m?: number | null;
          match_score?: number | null;
          device_hash?: string | null;
          ip_hash?: string | null;
          details?: Json;
          evidence_photo_path?: string | null;
          evidence_expires_at?: string | null;
          status?: "new" | "reviewed" | "dismissed";
          created_at?: string;
        };
      };
      attempts: {
        Row: {
          id: number;
          session_id: string;
          device_hash: string | null;
          ip_hash: string | null;
          claimed_index: string | null;
          outcome: string;
          created_at: string;
        };
        Insert: {
          id?: never;
          session_id: string;
          device_hash?: string | null;
          ip_hash?: string | null;
          claimed_index?: string | null;
          outcome: string;
          created_at?: string;
        };
        Update: {
          id?: never;
          session_id?: string;
          device_hash?: string | null;
          ip_hash?: string | null;
          claimed_index?: string | null;
          outcome?: string;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      purge_expired_alert_evidence: {
        Args: Record<PropertyKey, never>;
        Returns: { purged_path: string }[];
      };
    };
    Enums: Record<string, never>;
  };
}
