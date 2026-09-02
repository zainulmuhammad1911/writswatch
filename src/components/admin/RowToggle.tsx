"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Minus } from "lucide-react";
import { api, ApiClientError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export interface RowToggleProps {
  endpoint: string;
  field: string;
  value: boolean;
  label: string;
  disabled?: boolean;
}

/**
 * In-table boolean toggle.
 *
 * Optimistic, but it reverts on failure rather than leaving the row showing a
 * state the server rejected, and the error surfaces as a title so a 403 is not
 * silent.
 */
export function RowToggle({
  endpoint,
  field,
  value,
  label,
  disabled,
}: RowToggleProps) {
  const router = useRouter();
  const [on, setOn] = useState(value);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function toggle() {
    const next = !on;
    setOn(next);
    setBusy(true);
    setError(null);
    try {
      await api.put(endpoint, { [field]: next });
      startTransition(() => router.refresh());
    } catch (e) {
      setOn(!next);
      setError(e instanceof ApiClientError ? e.message : "Could not update");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled || busy}
      aria-pressed={on}
      title={error ?? label}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 px-2 text-caption tracking-caption uppercase transition-colors duration-fast disabled:opacity-50",
        on ? "text-success" : "text-slate hover:text-graphite",
        error && "text-danger"
      )}
    >
      {busy ? (
        <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
      ) : on ? (
        <Check aria-hidden="true" className="size-3.5" />
      ) : (
        <Minus aria-hidden="true" className="size-3.5" />
      )}
      <span className="sr-only">{label}: </span>
      {on ? "Yes" : "No"}
    </button>
  );
}

export default RowToggle;
