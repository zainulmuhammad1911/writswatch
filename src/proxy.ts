import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { newNonce, strictCsp } from "@/lib/csp";

// Built from the edge-safe config, not from @/lib/auth: the latter imports
// bcrypt and Prisma through the credentials provider, which cannot load in
// the Edge runtime this file is bundled for.
const { auth } = NextAuth(authConfig);

/**
 * Two jobs: the login gate, and the strict Content Security Policy.
 *
 * Formerly `src/middleware.ts`. Next 16 renamed the convention to `proxy` and
 * deprecated the old filename; the contract is unchanged, so this is a rename
 * and nothing else. `@next/codemod middleware-to-proxy` leaves the file alone,
 * because it only renames a function literally called `middleware` and this
 * one is an anonymous default export wrapped by NextAuth's `auth()`.
 *
 * The gate. Only the session cookie is inspected here. The role rides on the
 * JWT, so no database query is needed, which matters because this runs in the
 * Edge runtime with no access to Prisma. Per-resource role checks happen in
 * the route handlers, where a 403 can say which permission was missing.
 *
 * A browser navigation gets a redirect to /login with the destination in
 * ?next=. An API call gets a 401 JSON body in the same envelope as every other
 * endpoint, because a fetch() should not have to parse an HTML login page to
 * discover it was signed out.
 *
 * The policy. Every response from here carries a per-request nonce, including
 * the 401 and the redirect. Next reads the nonce back out of the *request*
 * header set below and stamps it on the script tags it injects itself, which
 * is the only way `strict-dynamic` can work: under it the browser ignores
 * `'self'` entirely and runs nothing that arrived without the nonce.
 *
 * The public routes are deliberately not in the matcher. See `lib/csp.ts`.
 */
export default auth((request) => {
  const { pathname, search } = request.nextUrl;
  const isApi = pathname.startsWith("/api/");
  const csp = strictCsp(newNonce());

  /** Passes the request through, with the nonce visible to the renderer. */
  const proceed = () => {
    const headers = new Headers(request.headers);
    headers.set("Content-Security-Policy", csp);
    const response = NextResponse.next({ request: { headers } });
    response.headers.set("Content-Security-Policy", csp);
    return response;
  };

  const reject = (response: NextResponse) => {
    response.headers.set("Content-Security-Policy", csp);
    return response;
  };

  // The login page is matched for its policy, not for the gate. Sending an
  // unauthenticated visitor from /login to /login would loop forever.
  if (pathname === "/login") return proceed();

  if (request.auth) return proceed();

  if (isApi) {
    return reject(
      NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    );
  }

  const login = new URL("/login", request.nextUrl.origin);
  // Only a same-site path is preserved, so ?next= cannot be used to bounce
  // someone to another origin after signing in.
  login.searchParams.set("next", `${pathname}${search}`);
  return reject(NextResponse.redirect(login));
});

export const config = {
  matcher: [
    /*
     * The authenticated surface, which is also the surface that gets the
     * strict nonce policy. Three notes:
     *   /login     matched for the policy only; the gate skips it
     *   api/auth   NextAuth's own endpoints, or signing in would need
     *              a session to sign in with
     *   everything else here is already rendered per request, so a
     *   per-request nonce costs no caching
     */
    "/admin/:path*",
    "/login",
    "/api/((?!auth/).*)",
  ],
};
