"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import {
  Badge,
  Field,
  Table,
  Td,
  Th,
  buttonVariants,
  inputClasses,
} from "@/components/admin/ui";
import { api, ApiClientError } from "@/lib/api-client";
import { ROLE_LABELS } from "@/lib/rbac";
import type { Role } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";

export interface ManagedUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  active: boolean;
  articles: number;
  auditLogs: number;
}

const ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "EDITOR"];

export function UserManager({
  initial,
  currentUserId,
}: {
  initial: ManagedUser[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [users, setUsers] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<Record<string, string[]>>({});

  async function patch(id: string, body: Record<string, unknown>) {
    setBusyId(id);
    setError(null);
    try {
      const updated = await api.put<ManagedUser & { _count?: unknown }>(
        `/api/users/${id}`,
        body
      );
      setUsers((prev) =>
        prev.map((u) =>
          u.id === id ? { ...u, role: updated.role, active: updated.active } : u
        )
      );
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Could not update");
    } finally {
      setBusyId(null);
    }
  }

  async function resetPassword(user: ManagedUser) {
    const next = window.prompt(
      `New password for ${user.email}.\n\nAt least 12 characters. They will not be emailed it, so pass it on yourself.`
    );
    if (!next) return;
    await patch(user.id, { password: next });
    if (!error) window.alert("Password changed.");
  }

  async function onCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIssues({});
    const form = new FormData(event.currentTarget);
    try {
      const created = await api.post<ManagedUser>("/api/users", {
        email: String(form.get("email") ?? "").trim(),
        name: String(form.get("name") ?? "").trim() || undefined,
        password: String(form.get("password") ?? ""),
        role: String(form.get("role") ?? "EDITOR"),
      });
      setUsers((prev) => [
        ...prev,
        { ...created, articles: 0, auditLogs: 0 },
      ]);
      setAdding(false);
      router.refresh();
    } catch (e) {
      if (e instanceof ApiClientError) {
        setError(e.message);
        if (e.issues) setIssues(e.issues);
      } else {
        setError("Could not create the account");
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-small text-slate">
          {users.length} account{users.length === 1 ? "" : "s"}.
        </p>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className={buttonVariants.secondary}
        >
          <Plus aria-hidden="true" className="size-4" />
          {adding ? "Cancel" : "Add user"}
        </button>
      </div>

      {error && (
        <p role="alert" className="border-l-2 border-danger bg-pure-white px-4 py-3 text-small text-graphite">
          {error}
        </p>
      )}

      {adding && (
        <form
          onSubmit={onCreate}
          className="grid gap-5 border border-border-grey bg-pure-white p-5 sm:grid-cols-2"
        >
          <Field label="Email" htmlFor="new-email" required error={issues.email?.[0]}>
            <input id="new-email" name="email" type="email" required className={inputClasses} />
          </Field>
          <Field label="Name" htmlFor="new-name" error={issues.name?.[0]}>
            <input id="new-name" name="name" className={inputClasses} />
          </Field>
          <Field
            label="Password"
            htmlFor="new-password"
            required
            error={issues.password?.[0]}
            hint="At least 12 characters. Nothing is emailed; pass it on yourself."
          >
            <input
              id="new-password"
              name="password"
              type="password"
              required
              minLength={12}
              autoComplete="new-password"
              className={inputClasses}
            />
          </Field>
          <Field label="Role" htmlFor="new-role" error={issues.role?.[0]}>
            <select id="new-role" name="role" defaultValue="EDITOR" className={inputClasses}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <button type="submit" className={buttonVariants.primary}>
              Create account
            </button>
          </div>
        </form>
      )}

      <Table>
        <thead>
          <tr>
            <Th>Email</Th>
            <Th className="w-32">Name</Th>
            <Th className="w-40">Role</Th>
            <Th className="w-24">Active</Th>
            <Th className="w-28">Authored</Th>
            <Th className="w-32 text-right">Password</Th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isSelf = user.id === currentUserId;
            const busy = busyId === user.id;
            return (
              <tr key={user.id}>
                <Td>
                  <span className="font-medium">{user.email}</span>
                  {isSelf && (
                    <span className="ml-2">
                      <Badge tone="navy">you</Badge>
                    </span>
                  )}
                </Td>
                <Td className="text-slate">{user.name ?? "—"}</Td>
                <Td>
                  <select
                    aria-label={`Role for ${user.email}`}
                    value={user.role}
                    disabled={isSelf || busy}
                    onChange={(e) => patch(user.id, { role: e.target.value })}
                    className={cn(inputClasses, "min-h-11")}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                </Td>
                <Td>
                  <button
                    type="button"
                    onClick={() => patch(user.id, { active: !user.active })}
                    disabled={isSelf || busy}
                    aria-pressed={user.active}
                    title={
                      isSelf
                        ? "You cannot deactivate your own account"
                        : user.active
                          ? "Deactivate"
                          : "Reactivate"
                    }
                    className={cn(
                      "inline-flex min-h-11 items-center text-caption tracking-caption uppercase transition-colors duration-fast disabled:opacity-40",
                      user.active ? "text-success" : "text-slate"
                    )}
                  >
                    {busy ? (
                      <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
                    ) : user.active ? (
                      "Active"
                    ) : (
                      "Disabled"
                    )}
                  </button>
                </Td>
                <Td className="text-slate">
                  {user.articles} article{user.articles === 1 ? "" : "s"}
                </Td>
                <Td className="text-right">
                  <button
                    type="button"
                    onClick={() => resetPassword(user)}
                    disabled={busy}
                    className="inline-flex min-h-11 items-center text-small font-medium text-navy transition-colors duration-fast hover:text-navy-dark disabled:opacity-50"
                  >
                    Reset
                  </button>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </Table>

      <p className="text-caption text-slate">
        Accounts are deactivated rather than deleted. An account that authored
        articles or wrote audit records cannot be removed without taking that
        history with it.
      </p>
    </div>
  );
}

export default UserManager;
