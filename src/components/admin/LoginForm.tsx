"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LoginFormProps {
  destination: string;
  initialError?: string;
}

/**
 * Credentials sign-in.
 *
 * `redirect: false` keeps the failure on this page so the form can render the
 * error inline instead of bouncing through ?error= and losing what was typed.
 *
 * The message is deliberately the same for an unknown email and a wrong
 * password: telling them apart would let somebody enumerate staff addresses.
 */
export function LoginForm({ destination, initialError }: LoginFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(
    initialError ? messageFor(initialError) : null
  );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      redirect: false,
    });

    if (!result || result.error) {
      setError(messageFor(result?.code ?? result?.error ?? "CredentialsSignin"));
      return;
    }

    startTransition(() => {
      router.replace(destination);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-10 flex flex-col gap-6">
      {error && (
        <p
          role="alert"
          className="border-l-2 border-navy bg-pure-white px-4 py-3 text-small text-graphite"
        >
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="eyebrow">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className="min-h-12 border border-border-grey bg-pure-white px-4 text-body text-graphite transition-colors duration-fast focus-visible:border-navy focus-visible:outline-none"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="eyebrow">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="min-h-12 border border-border-grey bg-pure-white px-4 text-body text-graphite transition-colors duration-fast focus-visible:border-navy focus-visible:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className={cn(
          "mt-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-navy px-8 text-small font-medium tracking-caption text-pure-white uppercase transition-colors duration-base ease-out-museum hover:bg-navy-dark focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-4 focus-visible:ring-offset-cool-white focus-visible:outline-none",
          pending && "opacity-70"
        )}
      >
        {pending && (
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        )}
        {pending ? "Signing in" : "Sign in"}
      </button>
    </form>
  );
}

function messageFor(code: string): string {
  if (code === "rate_limited") {
    return "Too many sign-in attempts from this address. Try again in about 15 minutes.";
  }
  if (code === "Configuration") {
    return "Sign-in is not available right now. The server could not reach the database.";
  }
  // Deliberately the same for an unknown email and a wrong password, so staff
  // addresses cannot be enumerated from the response.
  return "Those details do not match an account.";
}
