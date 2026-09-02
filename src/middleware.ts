import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Built from the edge-safe config, not from @/lib/auth: the latter imports
// bcrypt and Prisma through the credentials provider, which cannot load in
// the Edge runtime middleware is bundled for.
const { auth } = NextAuth(authConfig);

/**
 * Gate for everything behind a login: the admin pages and the CMS API.
 *
 * Only the session cookie is inspected here. The role rides on the JWT, so no
 * database query is needed, which matters because middleware has no access to
 * Prisma. Per-resource role checks happen in the route handlers, where a 403
 * can say which permission was missing.
 *
 * A browser navigation gets a redirect to /login with the destination in
 * ?next=. An API call gets a 401 JSON body in the same envelope as every other
 * endpoint, because a fetch() should not have to parse an HTML login page to
 * discover it was signed out.
 */
export default auth((request) => {
  const { pathname, search } = request.nextUrl;
  const isApi = pathname.startsWith("/api/");

  if (request.auth) return NextResponse.next();

  if (isApi) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const login = new URL("/login", request.nextUrl.origin);
  // Only a same-site path is preserved, so ?next= cannot be used to bounce
  // someone to another origin after signing in.
  login.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(login);
});

export const config = {
  matcher: [
    /*
     * Protect /admin and /api, with three exclusions:
     *   api/auth   NextAuth's own endpoints, or signing in would need a session
     *   _next      build output
     *   uploads    already-public media served from /public
     */
    "/admin/:path*",
    "/api/((?!auth/).*)",
  ],
};
