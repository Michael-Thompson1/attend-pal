import type { NextResponse } from "next/server";

/** New cookie name so a previously shared login is no longer read. */
export const AUTH_COOKIE_OPTIONS = { name: "attend-pal-auth" };

export function clearLegacyAuthCookies(
  response: NextResponse,
  cookies: { name: string }[],
) {
  for (const cookie of cookies) {
    if (cookie.name.startsWith("sb-") && cookie.name.includes("auth-token")) {
      response.cookies.set(cookie.name, "", { path: "/", maxAge: 0 });
    }
  }
}

export function applyAuthHeaders(response: NextResponse, headers: Record<string, string>) {
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
}
