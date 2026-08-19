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
  const [checkingAll, setCheckingAll] = useState(false);

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

  function handleChecked(link: GoLink) {
    setLinks((prev) => prev.map((l) => (l.slug === link.slug ? link : l)));
  }

  async function handleCheckAll() {
    setCheckingAll(true);
    try {
      const results = await Promise.allSettled(
        links.map((link) =>
          fetch(`/api/links/${link.slug}/check`, { method: "POST" }).then((res) => res.json())
        )
      );
      for (const result of results) {
        if (result.status === "fulfilled" && result.value.link) {
          handleChecked(result.value.link as GoLink);
        }
      }
    } finally {
      setCheckingAll(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <CreateLinkForm onCreated={handleCreated} initialSlug={prefillSlug} />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <label htmlFor="search" className="text-sm font-medium text-slate-700">
            Existing shortcuts
          </label>
          <div className="flex items-center gap-3">
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
            <button
              type="button"
              onClick={handleCheckAll}
              disabled={checkingAll || links.length === 0}
              className="whitespace-nowrap rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {checkingAll ? "Checking…" : "Check all"}
            </button>
          </div>
        </div>
        <div aria-busy={isPending}>
          <LinksTable links={filtered} onDeleted={handleDeleted} onChecked={handleChecked} />
        </div>
      </div>
    </div>
  );
}
