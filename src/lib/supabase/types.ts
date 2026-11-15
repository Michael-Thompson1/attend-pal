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
        Relationships: [];
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
        Relationships: [];
      };
      lecturer_settings: {
        Row: {
          lecturer_id: string;
          default_radius_m: number;
          default_window_minutes: number;
          default_require_liveness: boolean;
          default_allow_second_checkin: boolean;
          notify_suspicious: boolean;
          updated_at: string;
        };
        Insert: {
          lecturer_id: string;
          default_radius_m?: number;
          default_window_minutes?: number;
          default_require_liveness?: boolean;
          default_allow_second_checkin?: boolean;
          notify_suspicious?: boolean;
          updated_at?: string;
        };
        Update: {
          lecturer_id?: string;
          default_radius_m?: number;
          default_window_minutes?: number;
          default_require_liveness?: boolean;
          default_allow_second_checkin?: boolean;
          notify_suspicious?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      classes: {
        Row: {
          id: string;
          lecturer_id: string;
          code: string;
          title: string;
          semester: string;
          programme: string | null;
          default_venue: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lecturer_id: string;
          code: string;
          title: string;
          semester?: string;
          programme?: string | null;
          default_venue?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          lecturer_id?: string;
          code?: string;
          title?: string;
          semester?: string;
          programme?: string | null;
          default_venue?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      students: {
        Row: {
          id: string;
          class_id: string;
          index_number: string;
          full_name: string;
          email: string | null;
          programme: string | null;
          level: string | null;
          reference_photo_path: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          index_number: string;
          full_name: string;
          email?: string | null;
          programme?: string | null;
          level?: string | null;
          reference_photo_path?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          class_id?: string;
          index_number?: string;
          full_name?: string;
          email?: string | null;
          programme?: string | null;
          level?: string | null;
          reference_photo_path?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      sessions: {
        Row: {
          id: string;
          class_id: string;
          lecturer_id: string;
          title: string;
          token: string;
          starts_at: string;
          ends_at: string;
          venue_name: string | null;
          center_lat: number;
          center_lng: number;
          radius_m: number;
          require_liveness: boolean;
          allow_second_checkin: boolean;
          second_checkin_window_minutes: number;
          notify_suspicious: boolean;
          status: "open" | "closed";
          created_at: string;
          closed_at: string | null;
        };
        Insert: {
          id?: string;
          class_id: string;
          lecturer_id: string;
          title: string;
          token?: string;
          starts_at: string;
          ends_at: string;
          venue_name?: string | null;
          center_lat: number;
          center_lng: number;
          radius_m?: number;
          require_liveness?: boolean;
          allow_second_checkin?: boolean;
          second_checkin_window_minutes?: number;
          notify_suspicious?: boolean;
          status?: "open" | "closed";
          created_at?: string;
          closed_at?: string | null;
        };
        Update: {
          id?: string;
          class_id?: string;
          lecturer_id?: string;
          title?: string;
          token?: string;
          starts_at?: string;
          ends_at?: string;
          venue_name?: string | null;
          center_lat?: number;
          center_lng?: number;
          radius_m?: number;
          require_liveness?: boolean;
          allow_second_checkin?: boolean;
          second_checkin_window_minutes?: number;
          notify_suspicious?: boolean;
          status?: "open" | "closed";
          created_at?: string;
          closed_at?: string | null;
        };
        Relationships: [];
      };
      attendance: {
        Row: {
          id: string;
          session_id: string;
          student_id: string;
          checkin_number: number;
          status: "verified" | "manual";
          distance_m: number | null;
          gps_accuracy_m: number | null;
          match_score: number | null;
          liveness_passed: boolean | null;
          device_hash: string | null;
          manual_reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          student_id: string;
          checkin_number?: number;
          status: "verified" | "manual";
          distance_m?: number | null;
          gps_accuracy_m?: number | null;
          match_score?: number | null;
          liveness_passed?: boolean | null;
          device_hash?: string | null;
          manual_reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          student_id?: string;
          checkin_number?: number;
          status?: "verified" | "manual";
          distance_m?: number | null;
          gps_accuracy_m?: number | null;
          match_score?: number | null;
          liveness_passed?: boolean | null;
          device_hash?: string | null;
          manual_reason?: string | null;
          created_at?: string;
        };
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
