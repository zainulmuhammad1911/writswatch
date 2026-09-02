import NextAuth from "next-auth";
import { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig } from "@/lib/auth.config";
import { db } from "@/lib/db";
import { clientIp, forgive, hit } from "@/lib/rate-limit";

/**
 * The full auth config, Node runtime only.
 *
 * Extends the edge-safe half in `auth.config.ts` with the credentials
 * provider, which needs bcrypt and Prisma. Anything importing this file lands
 * in the Node bundle, so middleware must not.
 *
 * Sessions are JWTs in an httpOnly cookie, which the credentials provider
 * requires: it cannot use database sessions. That is why the PRD's `Session`
 * model stays empty. It is left in the schema for an OAuth provider later,
 * which would use it.
 */

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(200),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw, request) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        // 5 attempts per 15 minutes per IP, counted before the password is
        // checked so a brute force cannot buy attempts with wrong guesses.
        const ip = clientIp(request);
        const limit = hit("login", ip);
        if (!limit.ok) {
          throw new RateLimitedError();
        }

        if (!db) {
          throw new Error("DATABASE_URL is not set; cannot sign in.");
        }

        const user = await db.user.findUnique({ where: { email } });

        // Compare against a dummy hash when the user does not exist, so the
        // response time does not reveal which emails are registered.
        const hash = user?.hashedPassword ?? DUMMY_HASH;
        const valid = await bcrypt.compare(password, hash);

        if (!user || !valid) return null;

        forgive("login", ip);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
});

/**
 * A bcrypt hash of a value nobody will submit, at the same cost factor as real
 * ones, so an unknown email costs the same time as a wrong password.
 */
const DUMMY_HASH =
  "$2b$12$C6UzMDM.H6dfI/f/IKcEe.rXwSRfCP0Cn5t3bZMuvSt4Wc0.MOxRO";

/**
 * Signals a throttled sign-in to the login page.
 *
 * Extends CredentialsSignin rather than Error on purpose. NextAuth v5 wraps
 * any other exception thrown from `authorize` as a generic "Configuration"
 * error, which the form would then report as a server misconfiguration.
 * CredentialsSignin subclasses get their `code` passed through to the client,
 * so the form can tell a throttle apart from a wrong password.
 */
export class RateLimitedError extends CredentialsSignin {
  code = "rate_limited";
}

/** bcrypt cost factor, per the PRD. Used by the seed and by user creation. */
export const BCRYPT_COST = 12;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}
