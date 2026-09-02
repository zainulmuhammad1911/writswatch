import type { NextAuthConfig } from "next-auth";
import type { DefaultSession } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { Role } from "@/generated/prisma/client";

/**
 * The half of the auth config that can run on the Edge runtime.
 *
 * Middleware is bundled for Edge, where Node built-ins do not exist. The full
 * config in `auth.ts` pulls in Prisma and bcrypt through the credentials
 * provider, so importing it from the proxy fails at module load with
 * "Native module not found: node:util/types".
 *
 * This file therefore carries everything the proxy needs (cookie names,
 * session strategy, the jwt/session callbacks) and no providers. Verifying an
 * existing JWT only needs the secret and Web Crypto, both of which Edge has.
 * Signing in happens in the Node runtime, through `auth.ts`.
 */

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }
  interface User {
    role: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}

// Referenced so the import above is not elided.
export type SessionToken = JWT;

/** 24 hours, per the PRD. */
export const SESSION_MAX_AGE_SECONDS = 24 * 60 * 60;

export const authConfig = {
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE_SECONDS },
  jwt: { maxAge: SESSION_MAX_AGE_SECONDS },
  pages: { signIn: "/login", error: "/login" },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.session-token"
          : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
  // Filled in by auth.ts. Middleware never signs anyone in, so it needs none.
  providers: [],
  trustHost: true,
} satisfies NextAuthConfig;
