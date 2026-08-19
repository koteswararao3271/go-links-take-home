"use client";

import { useMemo, useState, useTransition } from "react";
import type { GoLink } from "@/lib/types";
import { CreateLinkForm } from "@/components/CreateLinkForm";
import { LinksTable } from "@/components/LinksTable";

interface Props {
  initialLinks: GoLink[];
  prefillSlug?: string;
}

export function LinksApp({ initialLinks, prefillSlug }: Props) {
  const [links, setLinks] = useState<GoLink[]>(initialLinks);
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return links;
    return links.filter(
      (link) =>
        link.slug.toLowerCase().includes(q) ||
        link.description?.toLowerCase().includes(q)
    );
  }, [links, query]);

  function handleCreated(link: GoLink) {
    setLinks((prev) => [...prev.filter((l) => l.slug !== link.slug), link]);
  }

  function handleDeleted(slug: string) {
    setLinks((prev) => prev.filter((l) => l.slug !== slug));
  }

  return (
    <div className="flex flex-col gap-8">
      <CreateLinkForm onCreated={handleCreated} initialSlug={prefillSlug} />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <label htmlFor="search" className="text-sm font-medium text-slate-700">
            Existing shortcuts
          </label>
          <input
            id="search"
            type="search"
            value={query}
            onChange={(e) =>
              startTransition(() => setQuery(e.target.value))
            }
            placeholder="Search by slug or description"
            className="w-64 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>
        <div aria-busy={isPending}>
          <LinksTable links={filtered} onDeleted={handleDeleted} />
        </div>
      </div>
    </div>
  );
}
