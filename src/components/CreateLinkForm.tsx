"use client";

import { FormEvent, useId, useRef, useState } from "react";
import type { GoLink } from "@/lib/types";

interface Props {
  onCreated: (link: GoLink) => void;
  initialSlug?: string;
}

type FieldErrors = Record<string, string>;

export function CreateLinkForm({ onCreated, initialSlug }: Props) {
  const [slug, setSlug] = useState(initialSlug ?? "");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const slugInputRef = useRef<HTMLInputElement>(null);
  const formId = useId();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setAnnouncement("");

    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, url, description }),
      });
      const body = await res.json();

      if (!res.ok) {
        const details: FieldErrors = body.error?.details ?? {
          _: body.error?.message ?? "Something went wrong",
        };
        setErrors(details);
        setAnnouncement(`Could not create shortcut: ${body.error?.message}`);
        slugInputRef.current?.focus();
        return;
      }

      onCreated(body.link as GoLink);
      setSlug("");
      setUrl("");
      setDescription("");
      setAnnouncement(`Created go/${body.link.slug}`);
    } catch {
      setErrors({ _: "Network error — please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      noValidate
    >
      <div className="flex flex-col gap-1">
        <label htmlFor={`${formId}-slug`} className="text-sm font-medium text-slate-700">
          Slug
        </label>
        <div className="flex items-center gap-1">
          <span className="text-sm text-slate-400">go/</span>
          <input
            id={`${formId}-slug`}
            ref={slugInputRef}
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="design-system"
            className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            aria-invalid={Boolean(errors.slug)}
            aria-describedby={errors.slug ? `${formId}-slug-error` : undefined}
          />
        </div>
        {errors.slug && (
          <p id={`${formId}-slug-error`} className="text-sm text-red-600">
            {errors.slug}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={`${formId}-url`} className="text-sm font-medium text-slate-700">
          Destination URL
        </label>
        <input
          id={`${formId}-url`}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/docs"
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          aria-invalid={Boolean(errors.url)}
          aria-describedby={errors.url ? `${formId}-url-error` : undefined}
        />
        {errors.url && (
          <p id={`${formId}-url-error`} className="text-sm text-red-600">
            {errors.url}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={`${formId}-description`} className="text-sm font-medium text-slate-700">
          Description <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <input
          id={`${formId}-description`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this link for?"
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>

      {errors._ && <p className="text-sm text-red-600">{errors._}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="self-start rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {submitting ? "Creating…" : "Create shortcut"}
      </button>

      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </form>
  );
}
