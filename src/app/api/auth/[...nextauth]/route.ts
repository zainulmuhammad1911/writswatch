import { handlers } from "@/lib/auth";

/**
 * NextAuth's own endpoints: sign in, sign out, session, and the CSRF token it
 * requires on every credentials POST.
 *
 * Excluded from the middleware matcher, or signing in would need a session.
 */
export const { GET, POST } = handlers;
