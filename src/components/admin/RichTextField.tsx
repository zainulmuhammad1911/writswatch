"use client";

import { useState } from "react";
import { ArticleBody } from "@/components/public/ArticleBody";
import { Field, textareaClasses } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

export interface RichTextFieldProps {
  label: string;
  name: string;
  defaultValue?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  rows?: number;
}

/**
 * Long-form editing with a live preview.
 *
 * Deliberately not a WYSIWYG. A visual editor emits HTML, and rendering
 * editor HTML on the public site would mean `dangerouslySetInnerHTML`, a
 * DOMPurify dependency, and keeping `unsafe-inline` in the CSP forever. The
 * block syntax below is what `ArticleBody` already parses into real React
 * elements, so nothing an editor types can become markup.
 *
 * The preview uses the same component the public page does, so what is shown
 * here is what will actually render.
 */
export function RichTextField({
  label,
  name,
  defaultValue = "",
  hint,
  error,
  required,
  rows = 18,
}: RichTextFieldProps) {
  const [value, setValue] = useState(defaultValue);
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <Field
        label={label}
        htmlFor={name}
        error={error}
        required={required}
        hint={
          hint ??
          "Blank line between paragraphs. Start a line with ## for a heading, or > for a pulled quote."
        }
      >
        <textarea
          id={name}
          name={name}
          rows={rows}
          required={required}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-describedby={error ? `${name}-error` : undefined}
          className={cn(textareaClasses, "font-mono text-caption leading-[1.7]")}
        />
      </Field>

      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setShowPreview((v) => !v)}
          aria-expanded={showPreview}
          className="inline-flex min-h-11 items-center text-small font-medium text-navy transition-colors duration-fast hover:text-navy-dark"
        >
          {showPreview ? "Hide preview" : "Show preview"}
        </button>
        <p className="text-caption text-slate">
          {value.trim() ? `${value.trim().split(/\s+/).length} words` : "Empty"}
        </p>
      </div>

      {showPreview && (
        <div className="border border-border-grey bg-pure-white p-6">
          {value.trim() ? (
            <ArticleBody content={value} />
          ) : (
            <p className="text-small text-slate">Nothing to preview yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default RichTextField;
