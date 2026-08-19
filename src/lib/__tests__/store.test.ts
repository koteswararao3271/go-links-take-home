import { beforeEach, describe, expect, it } from "vitest";
import {
  __resetStoreForTests,
  createLink,
  deleteLink,
  DuplicateSlugError,
  getLink,
  listLinks,
  recordVisit,
} from "../store";

beforeEach(() => {
  __resetStoreForTests();
});

describe("store", () => {
  it("seeds with example links", () => {
    expect(listLinks().length).toBeGreaterThan(0);
    expect(getLink("payroll")).toBeDefined();
  });

  it("creates a new link", () => {
    const link = createLink({ slug: "docs", url: "https://example.com/docs" });
    expect(link.visitCount).toBe(0);
    expect(getLink("docs")).toEqual(link);
  });

  it("throws DuplicateSlugError for an existing slug", () => {
    createLink({ slug: "docs", url: "https://example.com/docs" });
    expect(() => createLink({ slug: "docs", url: "https://example.com/other" })).toThrow(
      DuplicateSlugError
    );
  });

  it("deletes a link", () => {
    createLink({ slug: "temp", url: "https://example.com" });
    expect(deleteLink("temp")).toBe(true);
    expect(getLink("temp")).toBeUndefined();
  });

  it("returns false deleting a slug that does not exist", () => {
    expect(deleteLink("nope")).toBe(false);
  });

  it("tracks visit count and last visited time", () => {
    createLink({ slug: "tracked", url: "https://example.com" });
    recordVisit("tracked");
    recordVisit("tracked");
    const link = getLink("tracked")!;
    expect(link.visitCount).toBe(2);
    expect(link.lastVisitedAt).toBeDefined();
  });

  it("filters listLinks by query against slug and description", () => {
    createLink({ slug: "runbook-payments", url: "https://example.com", description: "Payments runbook" });
    createLink({ slug: "runbook-auth", url: "https://example.com" });
    expect(listLinks("payments")).toHaveLength(1);
    expect(listLinks("runbook")).toHaveLength(2);
  });
});
