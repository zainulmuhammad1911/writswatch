"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { MediaPicker } from "@/components/admin/MediaPicker";
import {
  buttonVariants,
  inputClasses,
  textareaClasses,
} from "@/components/admin/ui";
import { api, ApiClientError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export interface ContentEntry {
  page: string;
  section: string;
  key: string;
  value: string;
  type: "TEXT" | "RICHTEXT" | "IMAGE" | "NUMBER" | "URL";
}

export interface PageContentEditorProps {
  page: string;
  previewHref: string;
  entries: ContentEntry[];
  canEdit: boolean;
}

/**
 * Edits the PageContent rows for one page.
 *
 * Only changed fields are sent, as one batch, so a save touches nothing the
 * editor did not actually alter.
 */
export function PageContentEditor({
  page,
  previewHref,
  entries,
  canEdit,
}: PageContentEditorProps) {
  const initial = useMemo(
    () => Object.fromEntries(entries.map((e) => [rowKey(e), e.value])),
    [entries]
  );
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const dirty = Object.keys(values).filter((k) => values[k] !== initial[k]);

  const sections = useMemo(() => {
    const grouped = new Map<string, ContentEntry[]>();
    for (const entry of entries) {
      const list = grouped.get(entry.section) ?? [];
      list.push(entry);
      grouped.set(entry.section, list);
    }
    return [...grouped.entries()];
  }, [entries]);

  async function onSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await api.put("/api/pages", {
        entries: dirty.map((key) => {
          const entry = entries.find((e) => rowKey(e) === key)!;
          return {
            page: entry.page,
            section: entry.section,
            key: entry.key,
            value: values[key],
            type: entry.type,
          };
        }),
      });
      setSaved(true);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  if (!entries.length) {
    return (
      <p className="border border-dashed border-border-grey px-6 py-12 text-center text-small text-slate">
        No editable copy recorded for this page. Run{" "}
        <code className="text-navy">npm run db:seed</code> to populate it from
        the current content.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-grey pb-4">
        <Link
          href={previewHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center gap-1.5 text-small font-medium text-navy transition-colors duration-fast hover:text-navy-dark"
        >
          Preview {page} page
          <ArrowUpRight aria-hidden="true" className="size-3.5" />
        </Link>

        {canEdit && (
          <div className="flex items-center gap-3">
            {saved && !dirty.length && (
              <span className="text-caption text-success">Saved</span>
            )}
            <span className="text-caption text-slate">
              {dirty.length
                ? `${dirty.length} change${dirty.length === 1 ? "" : "s"}`
                : "No changes"}
            </span>
            <button
              type="button"
              onClick={onSave}
              disabled={saving || !dirty.length}
              className={buttonVariants.primary}
            >
              {saving && (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              )}
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="border-l-2 border-danger bg-pure-white px-4 py-3 text-small text-graphite"
        >
          {error}
        </p>
      )}

      {sections.map(([section, rows]) => (
        <section key={section} className="flex flex-col gap-5">
          <h2 className="eyebrow border-b border-border-grey pb-2">
            {section.replace(/-/g, " ")}
          </h2>

          {rows.map((entry) => {
            const key = rowKey(entry);
            const id = `content-${key.replace(/[^a-z0-9]/gi, "-")}`;
            const value = values[key] ?? "";

            return (
              <div key={key} className="flex flex-col gap-2">
                <label htmlFor={id} className="text-caption tracking-caption text-slate uppercase">
                  {entry.key}
                </label>

                {entry.type === "IMAGE" ? (
                  <MediaPicker
                    key={`${id}-picker`}
                    name={id}
                    value={value}
                    folder="general"
                    label="Choose from library"
                  />
                ) : entry.type === "RICHTEXT" ? (
                  <textarea
                    id={id}
                    rows={5}
                    value={value}
                    disabled={!canEdit}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [key]: e.target.value }))
                    }
                    className={cn(textareaClasses, "min-h-28")}
                  />
                ) : (
                  <input
                    id={id}
                    type={entry.type === "NUMBER" ? "text" : entry.type === "URL" ? "url" : "text"}
                    inputMode={entry.type === "NUMBER" ? "numeric" : undefined}
                    value={value}
                    disabled={!canEdit}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [key]: e.target.value }))
                    }
                    className={inputClasses}
                  />
                )}
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}

function rowKey(entry: ContentEntry): string {
  return `${entry.page}.${entry.section}.${entry.key}`;
}

export default PageContentEditor;
