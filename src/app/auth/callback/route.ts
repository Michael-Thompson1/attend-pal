/**
 * Auth callback route handler.
 * Supabase sends the user here after they click the email confirmation link.
 * Exchanges the code for a session and redirects to the dashboard.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { applyAuthHeaders, AUTH_COOKIE_OPTIONS, clearLegacyAuthCookies } from "@/lib/supabase/auth-cookie";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const successUrl = `${origin}${next.startsWith("/") ? next : "/dashboard"}`;
  const response = NextResponse.redirect(successUrl);
  clearLegacyAuthCookies(response, request.cookies.getAll());

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookieOptions: AUTH_COOKIE_OPTIONS,
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet, headers) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
            applyAuthHeaders(response, headers);
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
