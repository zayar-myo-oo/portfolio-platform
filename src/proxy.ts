import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic gate for /admin: redirect visitors without a session cookie
 * before any admin code renders. This is a UX optimisation only — the real
 * authorization check runs in the Data Access Layer (requireAdmin) for every
 * admin page and Server Action.
 */
const SESSION_COOKIE = process.env.NODE_ENV === "production" ? "__Host-pf_session" : "pf_session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  if (!request.cookies.has(SESSION_COOKIE)) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = pathname === "/admin" ? "" : `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
