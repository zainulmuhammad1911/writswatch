"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { RichTextField } from "@/components/admin/RichTextField";
import { Field, buttonVariants, inputClasses } from "@/components/admin/ui";
import { api, ApiClientError, slugify } from "@/lib/api-client";
import type { ArticleFormValues } from "@/lib/admin-forms";
import { cn } from "@/lib/utils";

const CATEGORIES: { value: ArticleFormValues["category"]; label: string }[] = [
  { value: "STORY", label: "Story" },
  { value: "ESSAY", label: "Essay" },
  { value: "ARCHIVE", label: "Archive" },
  { value: "NEWS", label: "News" },
];

export function ArticleForm({
  initial,
  canDelete,
}: {
  initial: ArticleFormValues;
  canDelete: boolean;
}) {
  const router = useRouter();
  const isEdit = Boolean(initial.id);

  const [title, setTitle] = useState(initial.title);
  const [slug, setSlug] = useState(initial.slug);
  const [slugLocked, setSlugLocked] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<Record<string, string[]>>({});

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setIssues({});

    const form = new FormData(event.currentTarget);
    const text = (key: string) => {
      const v = String(form.get(key) ?? "").trim();
      return v || undefined;
    };
    const tagList = String(form.get("tags") ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const date = text("publishedAt");

    const payload = {
      slug: String(form.get("slug") ?? "").trim(),
      title: String(form.get("title") ?? "").trim(),
      subtitle: text("subtitle"),
      category: String(form.get("category") ?? "STORY"),
      excerpt: text("excerpt"),
      content: String(form.get("content") ?? "").trim(),
      coverImage: text("coverImage"),
      coverImageAlt: text("coverImageAlt"),
      tags: tagList.length ? tagList : undefined,
      published: form.get("published") === "on",
      featured: form.get("featured") === "on",
      publishedAt: date ? new Date(`${date}T00:00:00Z`).toISOString() : undefined,
    };

    try {
      if (isEdit) await api.put(`/api/journal/${initial.id}`, payload);
      else await api.post("/api/journal", payload);
      router.push("/admin/journal");
      router.refresh();
    } catch (e) {
      if (e instanceof ApiClientError) {
        setError(e.message);
        if (e.issues) setIssues(e.issues);
      } else {
        setError("Could not save. Try again.");
      }
      setSaving(false);
    }
  }

  async function onDelete() {
    if (
      !window.confirm(
        `Delete "${title}"? The article and its tags are removed permanently. This cannot be undone.`
      )
    ) {
      return;
    }
    setSaving(true);
    try {
      await api.del(`/api/journal/${initial.id}`);
      router.push("/admin/journal");
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Could not delete.");
      setSaving(false);
    }
  }

  const issue = (k: string) => issues[k]?.[0];

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-10">
      {error && (
        <p
          role="alert"
          className="border-l-2 border-danger bg-pure-white px-4 py-3 text-small text-graphite"
        >
          {error}
        </p>
      )}

      <section className="flex flex-col gap-5">
        <h2 className="eyebrow">The piece</h2>

        <Field label="Title" htmlFor="title" required error={issue("title")}>
          <input
            id="title"
            name="title"
            required
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!slugLocked) setSlug(slugify(e.target.value));
            }}
            className={inputClasses}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Slug"
            htmlFor="slug"
            required
            error={issue("slug")}
            hint={
              isEdit
                ? "Changing this breaks the existing public URL."
                : "Generated from the title."
            }
          >
            <input
              id="slug"
              name="slug"
              required
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugLocked(true);
              }}
              className={cn(inputClasses, "font-mono text-caption")}
            />
          </Field>

          <Field label="Category" htmlFor="category" error={issue("category")}>
            <select
              id="category"
              name="category"
              defaultValue={initial.category}
              className={inputClasses}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Subtitle" htmlFor="subtitle" error={issue("subtitle")}>
          <input
            id="subtitle"
            name="subtitle"
            defaultValue={initial.subtitle}
            className={inputClasses}
          />
        </Field>

        <Field
          label="Excerpt"
          htmlFor="excerpt"
          error={issue("excerpt")}
          hint="Shown on the journal listing and used as the meta description."
        >
          <textarea
            id="excerpt"
            name="excerpt"
            rows={3}
            defaultValue={initial.excerpt}
            className={cn(inputClasses, "min-h-24 py-2.5 leading-[1.6]")}
          />
        </Field>
      </section>

      <section className="flex flex-col gap-5 border-t border-border-grey pt-8">
        <h2 className="eyebrow">Cover</h2>
        <MediaPicker
          name="coverImage"
          altName="coverImageAlt"
          value={initial.coverImage}
          altValue={initial.coverImageAlt}
          folder="journal"
        />
      </section>

      <section className="flex flex-col gap-6 border-t border-border-grey pt-8">
        <h2 className="eyebrow">Body</h2>
        <RichTextField
          label="Content"
          name="content"
          defaultValue={initial.content}
          error={issue("content")}
          required
          rows={24}
        />
      </section>

      <section className="flex flex-col gap-5 border-t border-border-grey pt-8">
        <h2 className="eyebrow">Publishing</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Publish date"
            htmlFor="publishedAt"
            error={issue("publishedAt")}
            hint="Leave blank and today's date is used when you publish."
          >
            <input
              id="publishedAt"
              name="publishedAt"
              type="date"
              defaultValue={initial.publishedAt}
              className={inputClasses}
            />
          </Field>

          <Field
            label="Tags"
            htmlFor="tags"
            error={issue("tags")}
            hint="Comma separated."
          >
            <input
              id="tags"
              name="tags"
              defaultValue={initial.tags}
              placeholder="restoration, rolex"
              className={inputClasses}
            />
          </Field>
        </div>

        <label className="flex items-center gap-3 text-small text-graphite">
          <input
            type="checkbox"
            name="published"
            defaultChecked={initial.published}
            className="size-4 accent-navy"
          />
          Published. Drafts are hidden from the public journal.
        </label>
        <label className="flex items-center gap-3 text-small text-graphite">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={initial.featured}
            className="size-4 accent-navy"
          />
          Featured at the top of the journal. Only one piece should be.
        </label>
      </section>

      <div className="flex flex-wrap items-center gap-3 border-t border-border-grey pt-8">
        <button type="submit" disabled={saving} className={buttonVariants.primary}>
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create article"}
        </button>
        <Link href="/admin/journal" className={buttonVariants.secondary}>
          Cancel
        </Link>
        {isEdit && canDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={saving}
            className={cn(buttonVariants.danger, "ml-auto")}
          >
            Delete
          </button>
        )}
      </div>
    </form>
  );
}

export default ArticleForm;
