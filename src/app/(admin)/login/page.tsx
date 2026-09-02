import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const session = await auth();
  const params = await searchParams;

  const next = typeof params.next === "string" ? params.next : "/admin";
  // Only a same-site path is accepted, so ?next=https://evil.example cannot
  // turn the login page into an open redirect.
  const destination = next.startsWith("/") && !next.startsWith("//") ? next : "/admin";

  if (session?.user) redirect(destination);

  const error = typeof params.error === "string" ? params.error : undefined;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-cool-white px-gutter py-16">
      <div className="w-full max-w-[26rem]">
        <div className="flex items-center gap-3.5">
          {/* Through next/image for the same reason the public header is:
              the source PNG is 277KB and this renders at 44px. */}
          <Image
            src="/images/logo.png"
            alt=""
            width={44}
            height={44}
            sizes="44px"
            priority
            className="h-11 w-auto shrink-0"
          />
          <span
            aria-hidden="true"
            className="text-[0.6875rem] leading-[1.35] font-medium tracking-[0.18em] text-graphite uppercase"
          >
            Indonesia
            <br />
            Wristwatch
            <br />
            Museum
          </span>
        </div>

        <h1 className="mt-10 text-h2 text-graphite">Sign in</h1>
        <p className="mt-3 text-small text-slate">
          Content management for the museum. Staff only.
        </p>

        <LoginForm destination={destination} initialError={error} />
      </div>
    </main>
  );
}
