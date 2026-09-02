"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, Menu, X } from "lucide-react";
import type { NavItem } from "@/lib/admin";
import { ROLE_LABELS } from "@/lib/rbac";
import type { Role } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";

export interface AdminShellProps {
  nav: NavItem[];
  user: { email: string; name: string | null; role: Role };
  children: React.ReactNode;
}

/**
 * Sidebar plus topbar.
 *
 * The nav is computed on the server from the signed-in role, so a link a role
 * cannot use is never rendered. That is presentation only; the pages check
 * again with `requirePermission`, because a hidden link is not a control.
 */
export function AdminShell({ nav, user, children }: AdminShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the drawer on navigation. Stored against the path rather than
  // cleared in an effect, so there is no second render.
  const [openedAt, setOpenedAt] = useState(pathname);
  const drawerOpen = open && openedAt === pathname;

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  function toggle() {
    setOpenedAt(pathname);
    setOpen((v) => !v);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-cool-white lg:flex-row">
      {/* ---- Sidebar ------------------------------------------------- */}
      <aside
        className={cn(
          "border-border-grey bg-pure-white lg:w-64 lg:shrink-0 lg:border-r",
          "lg:sticky lg:top-0 lg:h-dvh lg:overflow-y-auto"
        )}
      >
        <div className="flex items-center justify-between gap-4 border-b border-border-grey px-5 py-4 lg:block lg:border-b-0 lg:py-6">
          <Link
            href="/admin"
            className="flex items-center gap-3 rounded-sm focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-pure-white focus-visible:outline-none"
          >
            <Image
              src="/images/logo.png"
              alt=""
              width={34}
              height={34}
              sizes="34px"
              priority
              className="h-[34px] w-auto"
            />
            <span
              aria-hidden="true"
              className="text-[0.5625rem] leading-[1.35] font-medium tracking-[0.18em] text-graphite uppercase"
            >
              Indonesia
              <br />
              Wristwatch
              <br />
              Museum
            </span>
          </Link>

          <button
            type="button"
            onClick={toggle}
            aria-expanded={drawerOpen}
            aria-controls="admin-nav"
            aria-label={drawerOpen ? "Close menu" : "Open menu"}
            className="-mr-2 inline-flex size-11 items-center justify-center rounded-full text-graphite transition-colors duration-fast hover:bg-soft-grey lg:hidden"
          >
            {drawerOpen ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
          </button>
        </div>

        <nav
          id="admin-nav"
          aria-label="Admin sections"
          // Not the `hidden` attribute: Tailwind's preflight declares
          // [hidden] { display: none !important }, which lg:block cannot
          // override, so the sidebar would stay invisible on desktop.
          className={cn(
            "border-b border-border-grey px-3 py-3 lg:block lg:border-b-0 lg:py-0",
            drawerOpen ? "block" : "hidden"
          )}
        >
          <ul className="flex flex-col gap-0.5">
            {nav.map((item) => {
              // /admin must not match every child route.
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 items-center rounded-sm px-3 text-small transition-colors duration-fast",
                      active
                        ? "bg-navy/8 font-medium text-navy"
                        : "text-slate hover:bg-soft-grey hover:text-graphite"
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* ---- Main column --------------------------------------------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border-grey bg-pure-white px-5 py-3 lg:px-8">
          <div className="min-w-0">
            <p className="truncate text-small font-medium text-graphite">
              {user.name || user.email}
            </p>
            <p className="text-caption tracking-caption text-slate uppercase">
              {ROLE_LABELS[user.role]}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center px-3 text-small text-slate transition-colors duration-fast hover:text-graphite"
            >
              View site
            </Link>
            <button
              type="button"
              onClick={() => signOut({ redirectTo: "/login" })}
              className="inline-flex min-h-11 items-center gap-2 border border-border-grey px-4 text-small font-medium text-graphite transition-colors duration-base hover:border-navy/40 hover:bg-cool-white focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-pure-white focus-visible:outline-none"
            >
              <LogOut aria-hidden="true" className="size-4" />
              Sign out
            </button>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-5 py-8 lg:px-8 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AdminShell;
