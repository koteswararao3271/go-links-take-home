import type { CreateLinkInput, GoLink } from "./types";

/**
 * In-memory store, intentionally. This is the first iteration of the
 * service (see README "Tradeoffs") — it keeps the exercise focused on API
 * design and behavior rather than a database/migration setup. Data resets
 * on server restart and won't survive Next.js dev's per-request module
 * reload without this module-scope Map, which is why it's attached to
 * `globalThis`: dev mode's Fast Refresh can otherwise re-evaluate this
 * module and quietly wipe seeded data between requests.
 */
declare global {
  // eslint-disable-next-line no-var
  var __goLinksStore: Map<string, GoLink> | undefined;
}

function seed(): Map<string, GoLink> {
  const now = new Date().toISOString();
  const seeded: GoLink[] = [
    {
      slug: "design-system",
      url: "https://www.figma.com/community",
      description: "Shared component library and design tokens",
      createdAt: now,
      updatedAt: now,
      visitCount: 0,
    },
    {
      slug: "oncall",
      url: "https://example.pagerduty.com/schedules",
      description: "Current on-call rotation and escalation policy",
      createdAt: now,
      updatedAt: now,
      visitCount: 0,
    },
    {
      slug: "payroll",
      url: "https://example.com/payroll",
      description: "Payroll and benefits portal",
      createdAt: now,
      updatedAt: now,
      visitCount: 0,
    },
  ];
  return new Map(seeded.map((link) => [link.slug, link]));
}

function getStore(): Map<string, GoLink> {
  if (!globalThis.__goLinksStore) {
    globalThis.__goLinksStore = seed();
  }
  return globalThis.__goLinksStore;
}

export function listLinks(query?: string): GoLink[] {
  const all = Array.from(getStore().values());
  const filtered = query
    ? all.filter(
        (link) =>
          link.slug.includes(query.toLowerCase()) ||
          link.description?.toLowerCase().includes(query.toLowerCase())
      )
    : all;
  return filtered.sort((a, b) => a.slug.localeCompare(b.slug));
}

export function getLink(slug: string): GoLink | undefined {
  return getStore().get(slug);
}

export class DuplicateSlugError extends Error {
  constructor(slug: string) {
    super(`Slug "${slug}" already exists`);
    this.name = "DuplicateSlugError";
  }
}

export function createLink(input: CreateLinkInput): GoLink {
  const store = getStore();
  if (store.has(input.slug)) {
    throw new DuplicateSlugError(input.slug);
  }
  const now = new Date().toISOString();
  const link: GoLink = {
    slug: input.slug,
    url: input.url,
    description: input.description,
    createdAt: now,
    updatedAt: now,
    visitCount: 0,
  };
  store.set(input.slug, link);
  return link;
}

export function deleteLink(slug: string): boolean {
  return getStore().delete(slug);
}

export function recordVisit(slug: string): void {
  const link = getStore().get(slug);
  if (!link) return;
  link.visitCount += 1;
  link.lastVisitedAt = new Date().toISOString();
}

/** Test-only escape hatch to reset state between test cases. */
export function __resetStoreForTests(): void {
  globalThis.__goLinksStore = seed();
}
