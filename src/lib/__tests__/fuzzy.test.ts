import { describe, expect, it } from "vitest";
import { levenshtein, suggestSlugs } from "../fuzzy";

describe("levenshtein", () => {
  it("is 0 for identical strings", () => {
    expect(levenshtein("oncall", "oncall")).toBe(0);
  });

  it("counts a single substitution", () => {
    expect(levenshtein("oncall", "oncail")).toBe(1);
  });

  it("counts insertions and deletions", () => {
    expect(levenshtein("payroll", "payrol")).toBe(1);
    expect(levenshtein("payrol", "payroll")).toBe(1);
  });
});

describe("suggestSlugs", () => {
  const candidates = ["design-system", "oncall", "payroll", "runbook-auth"];

  it("suggests the closest match for a likely typo", () => {
    expect(suggestSlugs("oncal", candidates)).toEqual(["oncall"]);
    expect(suggestSlugs("payrol", candidates)).toEqual(["payroll"]);
  });

  it("excludes an exact match (distance 0)", () => {
    expect(suggestSlugs("oncall", candidates)).not.toContain("oncall");
  });

  it("returns nothing for an unrelated slug", () => {
    expect(suggestSlugs("zzzzzzzzzz", candidates)).toEqual([]);
  });

  it("caps results at the requested limit", () => {
    const many = ["aaaa", "aaab", "aaac", "aaad", "aaae"];
    expect(suggestSlugs("aaaa", many, { limit: 2 }).length).toBeLessThanOrEqual(2);
  });
});
