/**
 * Next.js Middleware — Auth guard for lecturer routes.
 *
 * Rules:
 * - / (landing), /login, /register, /attend/* and /api/attend/* are public
 * - Everything else requires a valid Supabase session
 * - If Supabase credentials are not set yet (preview mode), allow public routes
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { applyAuthHeaders, AUTH_COOKIE_OPTIONS, clearLegacyAuthCookies } from "@/lib/supabase/auth-cookie";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/auth/callback",
  "/attend",
  "/api/attend",
];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // In preview mode or when Supabase is not yet configured:
  if (!supabaseUrl || !supabaseAnonKey) {
    if (!isPublic(pathname)) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  clearLegacyAuthCookies(response, request.cookies.getAll());

  if (isPublic(pathname)) {
    return privateResponse(response);
  }

  let finalResponse = response;
  let refreshedCookies: {
    name: string;
    value: string;
    options?: Parameters<NextResponse["cookies"]["set"]>[2];
  }[] = [];

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookieOptions: AUTH_COOKIE_OPTIONS,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          refreshedCookies = cookiesToSet;
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          finalResponse = NextResponse.next({ request });
          clearLegacyAuthCookies(finalResponse, request.cookies.getAll());
          cookiesToSet.forEach(({ name, value, options }) =>
            finalResponse.cookies.set(name, value, options)
          );
          applyAuthHeaders(finalResponse, headers);
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    const redirectResponse = NextResponse.redirect(loginUrl);
    clearLegacyAuthCookies(redirectResponse, request.cookies.getAll());
    refreshedCookies.forEach(({ name, value, options }) => {
      redirectResponse.cookies.set(name, value, options);
    });
    return privateResponse(redirectResponse);
  }

  return privateResponse(finalResponse);
}

/** A shared cache must not store one lecturer's session or dashboard for the next visitor. */
function privateResponse(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store, max-age=0, must-revalidate");
  response.headers.set("Vary", "Cookie");
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
