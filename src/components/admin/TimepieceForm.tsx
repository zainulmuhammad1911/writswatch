"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ImageManager, type ManagedImage } from "@/components/admin/ImageManager";
import { RichTextField } from "@/components/admin/RichTextField";
import {
  Field,
  buttonVariants,
  inputClasses,
} from "@/components/admin/ui";
import { api, ApiClientError, slugify } from "@/lib/api-client";
import type { TimepieceFormValues } from "@/lib/admin-forms";
import { cn } from "@/lib/utils";

export interface TimepieceFormProps {
  initial: TimepieceFormValues;
  /** Existing categories, so an editor picks rather than invents a new one. */
  categories: string[];
  canDelete: boolean;
}

export function TimepieceForm({
  initial,
  categories,
  canDelete,
}: TimepieceFormProps) {
  const router = useRouter();
  const isEdit = Boolean(initial.id);

  const [brand, setBrand] = useState(initial.brand);
  const [model, setModel] = useState(initial.model);
  const [slug, setSlug] = useState(initial.slug);
  // Only auto-fill the slug while creating. Changing it on an existing record
  // breaks its public URL and any link to it.
  const [slugLocked, setSlugLocked] = useState(isEdit);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<Record<string, string[]>>({});

  function suggestSlug(nextBrand: string, nextModel: string) {
    if (slugLocked) return;
    setSlug(slugify(`${nextBrand} ${nextModel}`));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setIssues({});

    const form = new FormData(event.currentTarget);
    const text = (key: string) => {
      const value = String(form.get(key) ?? "").trim();
      return value || undefined;
    };
    const yearRaw = text("year");

    const payload = {
      slug: String(form.get("slug") ?? "").trim(),
      brand: String(form.get("brand") ?? "").trim(),
      model: String(form.get("model") ?? "").trim(),
      referenceNumber: text("referenceNumber"),
      year: yearRaw ? Number(yearRaw) : undefined,
      category: text("category"),
      movement: text("movement"),
      caseSize: text("caseSize"),
      caseMaterial: text("caseMaterial"),
      dialColor: text("dialColor"),
      description: text("description"),
      story: text("story"),
      published: form.get("published") === "on",
      featured: form.get("featured") === "on",
      images: JSON.parse(String(form.get("images") ?? "[]")) as ManagedImage[],
    };

    try {
      if (isEdit) {
        await api.put(`/api/collection/${initial.id}`, payload);
      } else {
        await api.post("/api/collection", payload);
      }
      router.push("/admin/collection");
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
        `Delete ${brand} ${model}? Its photographs stay in the media library, but the record and its ordering are gone. This cannot be undone.`
      )
    ) {
      return;
    }
    setSaving(true);
    try {
      await api.del(`/api/collection/${initial.id}`);
      router.push("/admin/collection");
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Could not delete.");
      setSaving(false);
    }
  }

  const issue = (key: string) => issues[key]?.[0];

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
        <h2 className="eyebrow">Identification</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Brand" htmlFor="brand" required error={issue("brand")}>
            <input
              id="brand"
              name="brand"
              required
              value={brand}
              onChange={(e) => {
                setBrand(e.target.value);
                suggestSlug(e.target.value, model);
              }}
              className={inputClasses}
            />
          </Field>

          <Field label="Model" htmlFor="model" required error={issue("model")}>
            <input
              id="model"
              name="model"
              required
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
                suggestSlug(brand, e.target.value);
              }}
              className={inputClasses}
            />
          </Field>

          <Field
            label="Slug"
            htmlFor="slug"
            required
            error={issue("slug")}
            hint={
              isEdit
                ? "Changing this breaks the existing public URL and any link to it."
                : "Generated from brand and model. Edit to override."
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

          <Field
            label="Reference number"
            htmlFor="referenceNumber"
            error={issue("referenceNumber")}
          >
            <input
              id="referenceNumber"
              name="referenceNumber"
              defaultValue={initial.referenceNumber}
              className={inputClasses}
            />
          </Field>

          <Field label="Year" htmlFor="year" error={issue("year")}>
            <input
              id="year"
              name="year"
              type="number"
              min={1800}
              max={2100}
              inputMode="numeric"
              defaultValue={initial.year}
              className={inputClasses}
            />
          </Field>

          <Field
            label="Type"
            htmlFor="category"
            error={issue("category")}
            hint="Drives the Type filter on the collection page."
          >
            <input
              id="category"
              name="category"
              list="timepiece-categories"
              defaultValue={initial.category}
              className={inputClasses}
            />
            <datalist id="timepiece-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
        </div>
      </section>

      <section className="flex flex-col gap-5 border-t border-border-grey pt-8">
        <h2 className="eyebrow">Specifications</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Movement" htmlFor="movement" error={issue("movement")}>
            <input
              id="movement"
              name="movement"
              defaultValue={initial.movement}
              placeholder="Calibre 1570, automatic"
              className={inputClasses}
            />
          </Field>
          <Field label="Case size" htmlFor="caseSize" error={issue("caseSize")}>
            <input
              id="caseSize"
              name="caseSize"
              defaultValue={initial.caseSize}
              placeholder="34mm"
              className={inputClasses}
            />
          </Field>
          <Field
            label="Case material"
            htmlFor="caseMaterial"
            error={issue("caseMaterial")}
          >
            <input
              id="caseMaterial"
              name="caseMaterial"
              defaultValue={initial.caseMaterial}
              placeholder="Stainless steel"
              className={inputClasses}
            />
          </Field>
          <Field label="Dial" htmlFor="dialColor" error={issue("dialColor")}>
            <input
              id="dialColor"
              name="dialColor"
              defaultValue={initial.dialColor}
              placeholder="Silver"
              className={inputClasses}
            />
          </Field>
        </div>
      </section>

      <section className="flex flex-col gap-6 border-t border-border-grey pt-8">
        <h2 className="eyebrow">Words</h2>
        <Field
          label="Description"
          htmlFor="description"
          error={issue("description")}
          hint="One or two sentences. Used in listings and as the page's meta description."
        >
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={initial.description}
            className={cn(inputClasses, "min-h-24 py-2.5 leading-[1.6]")}
          />
        </Field>

        <RichTextField
          label="Notes"
          name="story"
          defaultValue={initial.story}
          error={issue("story")}
          rows={14}
        />
      </section>

      <section className="flex flex-col gap-5 border-t border-border-grey pt-8">
        <h2 className="eyebrow">Photographs</h2>
        <ImageManager name="images" initial={initial.images} folder="collection" />
      </section>

      <section className="flex flex-col gap-4 border-t border-border-grey pt-8">
        <h2 className="eyebrow">Visibility</h2>
        <label className="flex items-center gap-3 text-small text-graphite">
          <input
            type="checkbox"
            name="published"
            defaultChecked={initial.published}
            className="size-4 accent-navy"
          />
          Published. Unpublished records are hidden from the public site.
        </label>
        <label className="flex items-center gap-3 text-small text-graphite">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={initial.featured}
            className="size-4 accent-navy"
          />
          Featured on the homepage carousel.
        </label>
      </section>

      <div className="flex flex-wrap items-center gap-3 border-t border-border-grey pt-8">
        <button type="submit" disabled={saving} className={buttonVariants.primary}>
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create timepiece"}
        </button>
        <Link href="/admin/collection" className={buttonVariants.secondary}>
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

export default TimepieceForm;
