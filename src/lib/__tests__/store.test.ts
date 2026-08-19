import { beforeEach, describe, expect, it } from "vitest";
import {
  __resetStoreForTests,
  createLink,
  deleteLink,
  DuplicateSlugError,
  getLink,
  listLinks,
  recordHealthCheck,
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
    expect(link.health).toBe("unknown");
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

  it("records a health check result", () => {
    createLink({ slug: "checked", url: "https://example.com" });
    const link = recordHealthCheck("checked", {
      health: "broken",
      statusCode: 500,
      checkedAt: "2026-01-01T00:00:00.000Z",
    });
    expect(link?.health).toBe("broken");
    expect(link?.lastCheckStatus).toBe(500);
    expect(getLink("checked")?.health).toBe("broken");
  });

  it("returns undefined recording a health check for a missing slug", () => {
    expect(
      recordHealthCheck("nope", { health: "healthy", checkedAt: "2026-01-01T00:00:00.000Z" })
    ).toBeUndefined();
  });
});
