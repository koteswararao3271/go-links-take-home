"use client";

import { useState } from "react";
import type { GoLink } from "@/lib/types";

interface Props {
  links: GoLink[];
  onDeleted: (slug: string) => void;
  onChecked: (link: GoLink) => void;
}

const HEALTH_BADGE: Record<GoLink["health"], { label: string; className: string }> = {
  unknown: { label: "Not checked", className: "bg-slate-100 text-slate-500" },
  healthy: { label: "Healthy", className: "bg-green-100 text-green-700" },
  broken: { label: "Broken", className: "bg-red-100 text-red-700" },
};

function HealthBadge({ link }: { link: GoLink }) {
  const badge = HEALTH_BADGE[link.health];
  const title =
    link.health === "broken"
      ? link.lastCheckError ?? (link.lastCheckStatus ? `HTTP ${link.lastCheckStatus}` : undefined)
      : link.health === "healthy" && link.lastCheckStatus
        ? `HTTP ${link.lastCheckStatus}`
        : undefined;
  return (
    <span
      title={title}
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
    >
      {badge.label}
    </span>
  );
}

export function LinksTable({ links, onDeleted, onChecked }: Props) {
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
  const [checkingSlug, setCheckingSlug] = useState<string | null>(null);

  async function copy(slug: string) {
    const text = `${window.location.origin}/${slug}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug((s) => (s === slug ? null : s)), 1500);
    } catch {
      // Clipboard API can be unavailable (permissions, non-secure context).
      // Not worth a visible error for a "nice to have" copy button.
    }
  }

  async function handleDelete(slug: string) {
    if (!window.confirm(`Delete go/${slug}? This can't be undone.`)) return;
    setDeletingSlug(slug);
    try {
      const res = await fetch(`/api/links/${slug}`, { method: "DELETE" });
      if (res.ok) onDeleted(slug);
    } finally {
      setDeletingSlug(null);
    }
  }

  async function handleCheck(slug: string) {
    setCheckingSlug(slug);
    try {
      const res = await fetch(`/api/links/${slug}/check`, { method: "POST" });
      const body = await res.json();
      if (res.ok) onChecked(body.link as GoLink);
    } finally {
      setCheckingSlug(null);
    }
  }

  if (links.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
        No shortcuts match yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th scope="col" className="px-4 py-2 font-medium">Shortcut</th>
            <th scope="col" className="px-4 py-2 font-medium">Destination</th>
            <th scope="col" className="px-4 py-2 font-medium">Health</th>
            <th scope="col" className="px-4 py-2 font-medium">Visits</th>
            <th scope="col" className="px-4 py-2 font-medium">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {links.map((link) => (
            <tr key={link.slug}>
              <td className="px-4 py-3 align-top">
                <a
                  href={`/${link.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-slate-900 hover:underline"
                >
                  go/{link.slug}
                </a>
                {link.description && (
                  <p className="mt-0.5 text-xs text-slate-500">{link.description}</p>
                )}
              </td>
              <td className="max-w-xs truncate px-4 py-3 align-top text-slate-600" title={link.url}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {link.url}
                </a>
              </td>
              <td className="px-4 py-3 align-top">
                <HealthBadge link={link} />
              </td>
              <td className="px-4 py-3 align-top text-slate-600">{link.visitCount}</td>
              <td className="px-4 py-3 align-top">
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => handleCheck(link.slug)}
                    disabled={checkingSlug === link.slug}
                    className="text-xs font-medium text-slate-600 hover:text-slate-900 disabled:opacity-50"
                  >
                    {checkingSlug === link.slug ? "Checking…" : "Check"}
                  </button>
                  <button
                    type="button"
                    onClick={() => copy(link.slug)}
                    className="text-xs font-medium text-slate-600 hover:text-slate-900"
                  >
                    {copiedSlug === link.slug ? "Copied!" : "Copy"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(link.slug)}
                    disabled={deletingSlug === link.slug}
                    className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    {deletingSlug === link.slug ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
