"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { Field, buttonVariants, inputClasses, textareaClasses } from "@/components/admin/ui";
import { api, ApiClientError } from "@/lib/api-client";

/** The settings the dashboard exposes, grouped as an editor would expect. */
const GROUPS = [
  {
    title: "Site",
    fields: [
      { key: "site.title", label: "Site name", kind: "text" },
      { key: "site.tagline", label: "Tagline", kind: "text" },
      { key: "site.description", label: "Description", kind: "textarea" },
      { key: "site.email", label: "Contact email", kind: "text" },
    ],
  },
  {
    title: "Social",
    fields: [
      { key: "social.instagram", label: "Instagram", kind: "url" },
      { key: "social.youtube", label: "YouTube", kind: "url" },
      { key: "social.x", label: "X", kind: "url" },
    ],
  },
  {
    title: "SEO defaults",
    fields: [
      { key: "seo.title", label: "Default meta title", kind: "text" },
      { key: "seo.description", label: "Default meta description", kind: "textarea" },
      { key: "seo.ogImage", label: "Default share image", kind: "image" },
    ],
  },
] as const;

export function SettingsForm({
  values: initial,
  canEdit,
}: {
  values: Record<string, string>;
  canEdit: boolean;
}) {
  const base = useMemo(() => {
    const out: Record<string, string> = {};
    for (const group of GROUPS) {
      for (const field of group.fields) out[field.key] = initial[field.key] ?? "";
    }
    return out;
  }, [initial]);

  const [values, setValues] = useState(base);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const dirty = Object.keys(values).filter((k) => values[k] !== base[k]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await api.put("/api/settings", {
        settings: dirty.map((key) => ({ key, value: values[key] })),
      });
      setSaved(true);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-10">
      {error && (
        <p role="alert" className="border-l-2 border-danger bg-pure-white px-4 py-3 text-small text-graphite">
          {error}
        </p>
      )}

      {GROUPS.map((group) => (
        <section key={group.title} className="flex flex-col gap-5">
          <h2 className="eyebrow border-b border-border-grey pb-2">
            {group.title}
          </h2>

          {group.fields.map((field) => {
            const id = `setting-${field.key.replace(/\./g, "-")}`;
            const value = values[field.key] ?? "";
            const set = (v: string) =>
              setValues((prev) => ({ ...prev, [field.key]: v }));

            if (field.kind === "image") {
              return (
                <Field key={field.key} label={field.label} htmlFor={id}>
                  <MediaPicker
                    name={id}
                    value={value}
                    folder="general"
                    label="Choose from library"
                  />
                </Field>
              );
            }

            return (
              <Field key={field.key} label={field.label} htmlFor={id}>
                {field.kind === "textarea" ? (
                  <textarea
                    id={id}
                    rows={3}
                    value={value}
                    disabled={!canEdit}
                    onChange={(e) => set(e.target.value)}
                    className={textareaClasses}
                  />
                ) : (
                  <input
                    id={id}
                    type={field.kind === "url" ? "url" : "text"}
                    value={value}
                    disabled={!canEdit}
                    onChange={(e) => set(e.target.value)}
                    className={inputClasses}
                  />
                )}
              </Field>
            );
          })}
        </section>
      ))}

      {canEdit && (
        <div className="flex items-center gap-4 border-t border-border-grey pt-6">
          <button
            type="submit"
            disabled={saving || !dirty.length}
            className={buttonVariants.primary}
          >
            {saving && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
            {saving ? "Saving…" : "Save settings"}
          </button>
          <span className="text-caption text-slate">
            {saved && !dirty.length
              ? "Saved"
              : dirty.length
                ? `${dirty.length} change${dirty.length === 1 ? "" : "s"}`
                : "No changes"}
          </span>
        </div>
      )}
    </form>
  );
}

export default SettingsForm;
