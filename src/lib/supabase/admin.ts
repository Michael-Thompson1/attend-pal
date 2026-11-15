/**
 * Supabase admin client — service-role key.
 * USE ONLY in server Route Handlers that handle student check-in,
 * or for admin-only operations like purge jobs.
 *
 * NEVER import this in Client Components.
 * NEVER expose SUPABASE_SERVICE_ROLE_KEY in any NEXT_PUBLIC_ variable.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// Singleton — the module is only ever loaded server-side.
let _adminClient: ReturnType<typeof createClient<Database>> | null = null;

export function getAdminClient() {
  if (_adminClient) return _adminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
        "Check your .env.local."
    );
  }

  _adminClient = createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _adminClient;
}
