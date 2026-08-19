import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { logger } from "@/lib/logger";
import { createLink, DuplicateSlugError, listLinks } from "@/lib/store";
import type { ApiError } from "@/lib/types";
import { createLinkSchema, flattenZodError } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const query = request.nextUrl.searchParams.get("q") ?? undefined;

  const links = listLinks(query);
  logger.info("links_listed", { requestId, count: links.length, query });

  return NextResponse.json({ links }, { headers: { "x-request-id": requestId } });
}

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const headers = { "x-request-id": requestId };

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    logger.warn("link_create_rejected", { requestId, reason: "invalid_json" });
    return NextResponse.json<ApiError>(
      { error: { code: "invalid_json", message: "Request body must be valid JSON" } },
      { status: 400, headers }
    );
  }

  try {
    const input = createLinkSchema.parse(body);
    const link = createLink(input);
    logger.info("link_created", { requestId, slug: link.slug });
    return NextResponse.json(
      { link },
      {
        status: 201,
        headers: { ...headers, Location: `/api/links/${link.slug}` },
      }
    );
  } catch (err) {
    if (err instanceof ZodError) {
      const details = flattenZodError(err);
      logger.warn("link_create_rejected", { requestId, reason: "validation", details });
      return NextResponse.json<ApiError>(
        { error: { code: "validation_error", message: "Invalid link data", details } },
        { status: 400, headers }
      );
    }
    if (err instanceof DuplicateSlugError) {
      logger.warn("link_create_rejected", { requestId, reason: "duplicate_slug" });
      return NextResponse.json<ApiError>(
        { error: { code: "duplicate_slug", message: err.message } },
        { status: 409, headers }
      );
    }
    logger.error("link_create_failed", {
      requestId,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json<ApiError>(
      { error: { code: "internal_error", message: "Something went wrong" } },
      { status: 500, headers }
    );
  }
}
