import { describe, expect, it } from "vitest";
import { createLinkSchema } from "../validation";

describe("createLinkSchema", () => {
  it("accepts a valid link", () => {
    const result = createLinkSchema.safeParse({
      slug: "design-system",
      url: "https://example.com/design",
      description: "Component library",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a link without a description", () => {
    const result = createLinkSchema.safeParse({
      slug: "oncall",
      url: "https://example.com",
    });
    expect(result.success).toBe(true);
  });

  it.each([
    ["Design-System", "uppercase"],
    ["design_system", "underscore"],
    ["-design", "leading hyphen"],
    ["design-", "trailing hyphen"],
    ["design--system", "double hyphen"],
    ["", "empty"],
  ])("rejects slug %j (%s)", (slug) => {
    const result = createLinkSchema.safeParse({ slug, url: "https://example.com" });
    expect(result.success).toBe(false);
  });

  it("rejects reserved slugs", () => {
    const result = createLinkSchema.safeParse({ slug: "api", url: "https://example.com" });
    expect(result.success).toBe(false);
  });

  it.each([
    ["not-a-url", "no scheme"],
    ["ftp://example.com", "unsupported scheme"],
    ["javascript:alert(1)", "javascript scheme"],
  ])("rejects url %j (%s)", (url) => {
    const result = createLinkSchema.safeParse({ slug: "test", url });
    expect(result.success).toBe(false);
  });

  it("rejects a description over 280 characters", () => {
    const result = createLinkSchema.safeParse({
      slug: "test",
      url: "https://example.com",
      description: "x".repeat(281),
    });
    expect(result.success).toBe(false);
  });
});
